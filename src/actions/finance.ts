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

    revalidatePath("/contacts")
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

    if (!entry)                              return { error: "Entry not found." }
    if (entry.opportunity.stage !== "AMBER") return { error: "Cannot delete entries outside Amber stage." }
    if (entry.status === "PAID")             return { error: "Cannot delete a paid entry." }

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

  // ── Step 1: Load entry and validate ───────────────────────────────────────
  const entry = await prisma.ledgerEntry.findUnique({
    where: { id: entryId },
  })

  if (!entry)                  return { error: "Entry not found." }
  if (entry.status === "PAID") return { error: "Entry is already marked as paid." }

  // ── Step 2: Mark as paid ──────────────────────────────────────────────────
  try {
    await prisma.ledgerEntry.update({
      where: { id: entryId },
      data: {
        status:     "PAID",
        paidAt:     new Date(),
        paymentRef,
        markedById: session.id,
      },
    })
  } catch {
    return { error: "Failed to mark entry as paid." }
  }

  // ── Step 3: Check PAST transition with fresh queries ──────────────────────
  try {
    // Re-query opportunity stage fresh — never use the pre-update snapshot
    const opportunity = await prisma.opportunity.findUnique({
      where:  { id: entry.opportunityId },
      select: { id: true, stage: true },
    })

    if (!opportunity) {
      revalidatePath("/finance")
      return { success: true }
    }

    // Re-query all entries after the update to get live statuses
    const allEntries = await prisma.ledgerEntry.findMany({
      where:  { opportunityId: entry.opportunityId },
      select: { id: true, status: true },
    })

    const allPaid = allEntries.every((e) => e.status === "PAID")

    console.log(
      "[markAsPaid] stage:", opportunity.stage,
      "| allPaid:", allPaid,
      "| entries:", allEntries.length
    )

    if (allPaid && opportunity.stage === "CLOSED") {
      await prisma.opportunity.update({
        where: { id: entry.opportunityId },
        data:  { stage: "PAST" },
      })
      console.log("[markAsPaid] Moved to PAST:", entry.opportunityId)
      revalidatePath("/contacts")
    }
  } catch (err) {
    console.error("[markAsPaid] Stage transition failed:", err)
  }

  revalidatePath("/finance")
  revalidatePath("/contacts")
  return { success: true }
}

// ─── Get Ledger Summary ───────────────────────────────────────────────────────

export async function getLedgerSummary(opportunityId: string) {
  const entries = await prisma.ledgerEntry.findMany({
    where:   { opportunityId },
    orderBy: { dueDate: "asc" },
  })

  const total   = entries.reduce((sum, e) => sum + Number(e.amount), 0)
  const paid    = entries
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const pending = entries
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + Number(e.amount), 0)
  const overdue = entries
    .filter((e) => e.status === "OVERDUE")
    .reduce((sum, e) => sum + Number(e.amount), 0)

  return { entries, total, paid, pending, overdue }
}