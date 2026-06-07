// @ts-nocheck
"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { audit } from "@/lib/audit"

const saveDocumentSchema = z.object({
  opportunityId: z.string().min(1),
  type: z.enum([
    "NATIONAL_ID",
    "KRA_PIN",
    "OFFER_LETTER_UNSIGNED",
    "OFFER_LETTER_SIGNED",
    "BOOKING_RECEIPT",
  ]),
  fileName: z.string().min(1),
  fileUrl:  z.string().url(),
  fileKey:  z.string().min(1),
})

export async function saveDocumentRecord(data: {
  opportunityId: string
  type:          string
  fileName:      string
  fileUrl:       string
  fileKey:       string
}) {
  const session = await requireAuth()

  const parsed = saveDocumentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    await prisma.document.deleteMany({
      where: {
        opportunityId: parsed.data.opportunityId,
        type:          parsed.data.type,
      },
    })

    const doc = await prisma.document.create({ data: parsed.data })

    await audit({
      action:     "DOCUMENT_UPLOADED",
      entityType: "DOCUMENT",
      entityId:   doc.id,
      actor:      session,
      metadata: {
        opportunityId: parsed.data.opportunityId,
        type:          parsed.data.type,
        fileName:      parsed.data.fileName,
      },
    })

    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { error: "Failed to save document record." }
  }
}

export async function deleteDocument(documentId: string, contactId: string) {
  const session = await requireAuth()

  try {
    const doc = await prisma.document.findUnique({ where: { id: documentId } })

    await prisma.document.delete({ where: { id: documentId } })

    await audit({
      action:     "DOCUMENT_DELETED",
      entityType: "DOCUMENT",
      entityId:   documentId,
      actor:      session,
      metadata: {
        contactId,
        type:     doc?.type,
        fileName: doc?.fileName,
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete document." }
  }
}