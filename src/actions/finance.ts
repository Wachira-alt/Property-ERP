// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"
import { audit } from "@/lib/audit"

const createLedgerEntrySchema = z.object({
  opportunityId: z.string().min(1),
  description:   z.string().min(1, "Description is required"),
  amount:        z.coerce.number().positive("Amount must be greater than 0"),
  dueDate:       z.string().min(1, "Due date is required"),
})

const markAsPaidSchema = z.object({
  entryId:        z.string().min(1),
  paymentRef:     z.string().min(1, "Payment reference is required"),
  receiptUrl:     z.string().optional(),
  receiptFileKey: z.string().optional(),
})

export async function createLedgerEntry(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "CREATE_LEDGER_ENTRY")

  const parsed = createLedgerEntrySchema.safeParse({
    opportunityId: formData.get("opportunityId"),
    description:   formData.get("description"),
    amount:        formData.get("amount"),
    dueDate:       formData.get("dueDate"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { opportunityId, description, amount, dueDate } = parsed.data

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    })

    if (!opportunity)                 return { error: "Opportunity not found." }
    if (opportunity.stage !== "AMBER") return { error: "Ledger entries can only be added during reservation stage." }

    const entry = await prisma.ledgerEntry.create({
      data: {
        opportunityId,
        description,
        amount,
        dueDate: new Date(dueDate),
        status:  "PENDING",
      },
    })

    await audit({
      action:     "LEDGER_ENTRY_CREATED",
      entityType: "LEDGER_ENTRY",
      entityId:   entry.id,
      actor:      session,
      metadata: {
        opportunityId,
        description,
        amount,
        dueDate,
      },
    })

    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { error: "Failed to create ledger entry." }
  }
}

export async function deleteLedgerEntry(entryId: string, contactId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "CREATE_LEDGER_ENTRY")

  try {
    const entry = await prisma.ledgerEntry.findUnique({
      where:   { id: entryId },
      include: { opportunity: true },
    })

    if (!entry)                              return { error: "Entry not found." }
    if (entry.opportunity.stage !== "AMBER") return { error: "Cannot delete entries outside Amber stage." }
    if (entry.status === "PAID")             return { error: "Cannot delete a paid entry." }

    await prisma.ledgerEntry.delete({ where: { id: entryId } })

    await audit({
      action:     "LEDGER_ENTRY_DELETED",
      entityType: "LEDGER_ENTRY",
      entityId:   entryId,
      actor:      session,
      metadata: {
        contactId,
        description: entry.description,
        amount:      Number(entry.amount),
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete ledger entry." }
  }
}

export async function markAsPaid(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MARK_PAYMENT_PAID")

  const parsed = markAsPaidSchema.safeParse({
    entryId:        formData.get("entryId"),
    paymentRef:     formData.get("paymentRef"),
    receiptUrl:     formData.get("receiptUrl")     || undefined,
    receiptFileKey: formData.get("receiptFileKey") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { entryId, paymentRef, receiptUrl, receiptFileKey } = parsed.data

  const entry = await prisma.ledgerEntry.findUnique({ where: { id: entryId } })

  if (!entry)                  return { error: "Entry not found." }
  if (entry.status === "PAID") return { error: "Entry is already marked as paid." }

  try {
    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        status:         "PAID",
        paidAt:         new Date(),
        paymentRef,
        receiptUrl:     receiptUrl     ?? null,
        receiptFileKey: receiptFileKey ?? null,
        markedById:     session.id,
      },
    })
  } catch {
    return { error: "Failed to mark entry as paid." }
  }

  await audit({
    action:     "PAYMENT_MARKED_PAID",
    entityType: "LEDGER_ENTRY",
    entityId:   entryId,
    actor:      session,
    metadata: {
      opportunityId: entry.opportunityId,
      description:   entry.description,
      amount:        Number(entry.amount),
      paymentRef,
      hasReceipt:    !!receiptUrl,
    },
  })

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where:   { id: entry.opportunityId },
      include: { documents: true, ledgerEntries: true, unit: true },
    })

    if (!opportunity) {
      revalidatePath("/finance")
      return { success: true }
    }

    const docTypes     = opportunity.documents.map((d) => d.type)
    const requiredDocs = ["NATIONAL_ID", "KRA_PIN", "OFFER_LETTER_SIGNED", "BOOKING_RECEIPT"]
    const hasAllDocs   = requiredDocs.every((type) => docTypes.includes(type as any))
    const ledgerTotal  = opportunity.ledgerEntries.reduce((sum, e) => sum + Number(e.amount), 0)
    const isPriceMet   = ledgerTotal >= Number(opportunity.agreedPrice)

    let currentStage = opportunity.stage

    if (currentStage === "AMBER" && hasAllDocs && isPriceMet) {
      await prisma.$transaction([
        prisma.opportunity.update({
          where: { id: opportunity.id },
          data:  { stage: "CLOSED", closedAt: new Date() },
        }),
        prisma.unit.update({
          where: { id: opportunity.unitId! },
          data:  { status: "SOLD", reservedUntil: null },
        }),
      ])

      await audit({
        action:     "STAGE_MOVED_TO_CLOSED",
        entityType: "OPPORTUNITY",
        entityId:   opportunity.id,
        actor:      session,
        metadata:   { autoTransition: true, trigger: "ALL_PAYMENTS_RECEIVED" },
      })

      currentStage = "CLOSED"
    }

    const allPaid = opportunity.ledgerEntries.every((e) =>
      e.id === entryId ? true : e.status === "PAID"
    )

    if (allPaid && (currentStage === "CLOSED" || currentStage === "AMBER")) {
      await prisma.opportunity.update({
        where: { id: opportunity.id },
        data:  { stage: "PAST" },
      })

      await audit({
        action:     "STAGE_MOVED_TO_PAST",
        entityType: "OPPORTUNITY",
        entityId:   opportunity.id,
        actor:      session,
        metadata:   { autoTransition: true, trigger: "ALL_LEDGER_ENTRIES_PAID" },
      })
    }
  } catch (err) {
    console.error("[markAsPaid] Auto-transition failed:", err)
  }

  revalidatePath("/finance")
  revalidatePath("/contacts")
  return { success: true }
}

export async function getLedgerSummary(opportunityId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where:   { opportunityId },
    orderBy: { dueDate: "asc" },
  })

  const total   = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const paid    = entries.filter((e) => e.status === "PAID").reduce((sum, e) => sum + Number(e.amount), 0)
  const pending = entries.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + Number(e.amount), 0)
  const overdue = entries.filter((e) => e.status === "OVERDUE").reduce((sum, e) => sum + Number(e.amount), 0)

  return { entries, total, paid, pending, overdue }
}