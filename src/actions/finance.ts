"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { assertPermission } from "@/lib/permissions"

const createLedgerEntrySchema = z.object({
  opportunityId: z.string().min(1),
  description:   z.string().min(1, "Description is required"),
  amount:        z.coerce.number().positive("Amount must be greater than 0"),
  dueDate:       z.string().min(1, "Due date is required"),
})

const markAsPaidSchema = z.object({
  entryId:    z.string().min(1),
  paymentRef: z.string().min(1, "Payment reference is required"),
})

// ─── Create Ledger Entry ──────────────────────────────────────────────────────

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
    return { error: parsed.error.errors[0].message }
  }

  const { opportunityId, description, amount, dueDate } = parsed.data

  try {
    // Verify opportunity exists and is in AMBER stage
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
    })

    if (!opportunity) {
      return { error: "Opportunity not found." }
    }

    if (opportunity.stage !== "AMBER") {
      return { error: "Ledger entries can only be added during reservation stage." }
    }

    await prisma.ledgerEntry.create({
      data: {
        opportunityId,
        description,
        amount,
        dueDate: new Date(dueDate),
        status:  "PENDING",
      },
    })

    revalidatePath(`/contacts`)
    return { success: true }
  } catch {
    return { error: "Failed to create ledger entry." }
  }
}

// ─── Delete Ledger Entry ──────────────────────────────────────────────────────

export async function deleteLedgerEntry(entryId: string, contactId: string) {
  const session = await requireAuth()
  assertPermission(session.role, "CREATE_LEDGER_ENTRY")

  try {
    const entry = await prisma.ledgerEntry.findUnique({
      where:   { id: entryId },
      include: { opportunity: true },
    })

    if (!entry)                         return { error: "Entry not found." }
    if (entry.opportunity.stage !== "AMBER") return { error: "Cannot delete entries outside Amber stage." }
    if (entry.status === "PAID")        return { error: "Cannot delete a paid entry." }

    await prisma.ledgerEntry.delete({ where: { id: entryId } })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete ledger entry." }
  }
}

// ─── Mark as Paid ─────────────────────────────────────────────────────────────

export async function markAsPaid(formData: FormData) {
  const session = await requireAuth()
  assertPermission(session.role, "MARK_PAYMENT_PAID")

  const parsed = markAsPaidSchema.safeParse({
    entryId:    formData.get("entryId"),
    paymentRef: formData.get("paymentRef"),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { entryId, paymentRef } = parsed.data

  try {
    const entry = await prisma.ledgerEntry.findUnique({
      where:   { id: entryId },
      include: {
        opportunity: {
          include: { ledgerEntries: true },
        },
      },
    })

    if (!entry)                   return { error: "Entry not found." }
    if (entry.status === "PAID")  return { error: "Entry is already marked as paid." }

    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        status:     "PAID",
        paidAt:     new Date(),
        paymentRef,
        markedById: session.id,
      },
    })

    // Check if all entries are now paid → move to PAST
    const allEntries = entry.opportunity.ledgerEntries
    const allPaid    = allEntries
      .filter((e) => e.id !== entryId)
      .every((e) => e.status === "PAID")

    if (allPaid) {
      await prisma.opportunity.update({
        where: { id: entry.opportunityId },
        data:  { stage: "PAST" },
      })
    }

    revalidatePath("/finance")
    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { error: "Failed to mark entry as paid." }
  }
}

// ─── Get Ledger Summary ───────────────────────────────────────────────────────

export async function getLedgerSummary(opportunityId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where:   { opportunityId },
    orderBy: { dueDate: "asc" },
  })

  const total    = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const paid     = entries.filter((e) => e.status === "PAID").reduce((sum, e) => sum + Number(e.amount), 0)
  const pending  = entries.filter((e) => e.status === "PENDING").reduce((sum, e) => sum + Number(e.amount), 0)
  const overdue  = entries.filter((e) => e.status === "OVERDUE").reduce((sum, e) => sum + Number(e.amount), 0)

  return { entries, total, paid, pending, overdue }
}