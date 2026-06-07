// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { audit } from "@/lib/audit"

const moveToReservationSchema = z.object({
  contactId:     z.string().min(1),
  agreedPrice:   z.coerce.number().positive("Agreed price must be a positive number"),
  paymentMethod: z.enum(["CASH", "MORTGAGE"], {
    errorMap: () => ({ message: "Payment method is required" }),
  }),
})

const extendReservationSchema = z.object({
  unitId: z.string().min(1),
  days:   z.coerce.number().int().min(1).max(30),
  reason: z.string().optional(),
})

export async function moveToReservation(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MOVE_TO_AMBER")

  const parsed = moveToReservationSchema.safeParse({
    contactId:     formData.get("contactId"),
    agreedPrice:   formData.get("agreedPrice"),
    paymentMethod: formData.get("paymentMethod"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { contactId, agreedPrice, paymentMethod } = parsed.data

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where:   { contactId },
      include: { unit: true },
    })

    if (!opportunity)                          return { error: "No opportunity found for this contact." }
    if (opportunity.stage !== "GREEN")         return { error: "Contact is not in the Green stage." }
    if (!opportunity.unitId)                   return { error: "A unit must be assigned before moving to reservation." }
    if (opportunity.unit?.status !== "AVAILABLE") return { error: "The assigned unit is no longer available." }

    const kycDocs = await prisma.document.findMany({
      where: {
        opportunityId: opportunity.id,
        type: { in: ["NATIONAL_ID", "KRA_PIN"] },
      },
    })

    const hasNationalId = kycDocs.some((d) => d.type === "NATIONAL_ID")
    const hasKraPin     = kycDocs.some((d) => d.type === "KRA_PIN")

    if (!hasNationalId || !hasKraPin) {
      return { error: "Both National ID and KRA PIN must be uploaded before creating a reservation." }
    }

    const reservedUntil = new Date()
    reservedUntil.setDate(reservedUntil.getDate() + 7)

    await prisma.$transaction([
      prisma.opportunity.update({
        where: { contactId },
        data:  { stage: "AMBER", agreedPrice, paymentMethod },
      }),
      prisma.unit.update({
        where: { id: opportunity.unitId },
        data:  { status: "RESERVED", reservedUntil },
      }),
    ])

    await audit({
      action:     "STAGE_MOVED_TO_AMBER",
      entityType: "OPPORTUNITY",
      entityId:   opportunity.id,
      actor:      session,
      metadata: {
        contactId,
        unitId:        opportunity.unitId,
        agreedPrice,
        paymentMethod,
        reservedUntil: reservedUntil.toISOString(),
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to move to reservation. Please try again." }
  }
}

export async function finalizeSale(contactId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "MOVE_TO_CLOSED")

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where:   { contactId },
      include: { unit: true, documents: true, ledgerEntries: true },
    })

    if (!opportunity)                  return { error: "Opportunity not found." }
    if (opportunity.stage !== "AMBER") return { error: "Contact is not in Amber stage." }
    if (!opportunity.unitId)           return { error: "No unit assigned." }

    const docTypes = opportunity.documents.map((d) => d.type)
    const required = ["NATIONAL_ID", "KRA_PIN", "OFFER_LETTER_SIGNED", "BOOKING_RECEIPT"]
    const missing  = required.filter((r) => !docTypes.includes(r as any))

    if (missing.length > 0) {
      return {
        error: `Missing required documents: ${missing.map((m) => m.replace(/_/g, " ")).join(", ")}`,
      }
    }

    const ledgerTotal = opportunity.ledgerEntries.reduce(
      (sum, e) => sum + Number(e.amount), 0
    )
    if (ledgerTotal < Number(opportunity.agreedPrice)) {
      return { error: "Ledger total is less than the agreed price." }
    }

    await prisma.$transaction([
      prisma.opportunity.update({
        where: { contactId },
        data:  { stage: "CLOSED", closedAt: new Date() },
      }),
      prisma.unit.update({
        where: { id: opportunity.unitId },
        data:  { status: "SOLD", reservedUntil: null },
      }),
    ])

    await audit({
      action:     "STAGE_MOVED_TO_CLOSED",
      entityType: "OPPORTUNITY",
      entityId:   opportunity.id,
      actor:      session,
      metadata: {
        contactId,
        unitId:       opportunity.unitId,
        unitName:     opportunity.unit?.name,
        agreedPrice:  Number(opportunity.agreedPrice),
        ledgerTotal,
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to finalize sale. Please try again." }
  }
}

export async function extendReservation(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "EXTEND_RESERVATION")

  const parsed = extendReservationSchema.safeParse({
    unitId: formData.get("unitId"),
    days:   formData.get("days"),
    reason: formData.get("reason") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { unitId, days, reason } = parsed.data

  try {
    const unit = await prisma.unit.findUnique({ where: { id: unitId } })

    if (!unit || !unit.reservedUntil) {
      return { error: "Unit is not currently reserved." }
    }

    const previousExpiry = unit.reservedUntil
    const newExpiry      = new Date(previousExpiry)
    newExpiry.setDate(newExpiry.getDate() + days)

    await prisma.$transaction([
      prisma.unit.update({
        where: { id: unitId },
        data:  { reservedUntil: newExpiry },
      }),
      prisma.reservationExtension.create({
        data: { unitId, grantedById: session.id, previousExpiry, newExpiry, reason },
      }),
    ])

    await audit({
      action:     "RESERVATION_EXTENDED",
      entityType: "UNIT",
      entityId:   unitId,
      actor:      session,
      metadata: {
        unitName:       unit.name,
        days,
        reason,
        previousExpiry: previousExpiry.toISOString(),
        newExpiry:      newExpiry.toISOString(),
      },
    })

    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { error: "Failed to extend reservation." }
  }
}

export async function cancelOpportunity(contactId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "CANCEL_OPPORTUNITY")

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { contactId },
    })

    if (!opportunity) return { error: "Opportunity not found." }

    await prisma.$transaction([
      prisma.opportunity.update({
        where: { contactId },
        data:  { stage: "CANCELLED" },
      }),
      ...(opportunity.unitId
        ? [
            prisma.unit.update({
              where: { id: opportunity.unitId },
              data:  { status: "AVAILABLE", reservedUntil: null },
            }),
          ]
        : []),
    ])

    await audit({
      action:     "STAGE_CANCELLED",
      entityType: "OPPORTUNITY",
      entityId:   opportunity.id,
      actor:      session,
      metadata: {
        contactId,
        unitId:        opportunity.unitId,
        previousStage: opportunity.stage,
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to cancel opportunity." }
  }
}