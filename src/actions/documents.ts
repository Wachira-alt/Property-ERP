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
export async function uploadContactDocument(data: {
  contactId:   string
  fileName:    string
  fileUrl:     string
  fileKey:     string
  mimeType:    string
}) {
  const session = await requireAuth()

  try {
    const doc = await prisma.contactDocument.create({
      data: {
        contactId:    data.contactId,
        fileName:     data.fileName,
        fileUrl:      data.fileUrl,
        fileKey:      data.fileKey,
        mimeType:     data.mimeType,
        uploadedBy:   session.id,
        uploaderName: session.name,
      },
    })

    await audit({
      action:     "DOCUMENT_UPLOADED",
      entityType: "CONTACT",
      entityId:   data.contactId,
      actor:      session,
      metadata: {
        documentId: doc.id,
        fileName:   data.fileName,
        vault:      true,
      },
    })

    revalidatePath(`/contacts/${data.contactId}`)
    return { success: true, document: doc }
  } catch {
    return { error: "Failed to upload document." }
  }
}

export async function deleteContactDocument(
  documentId: string,
  contactId:  string
) {
  const session = await requireAuth()

  if (session.role !== "ADMIN" && session.role !== "GENERAL_MANAGER") {
    return { error: "Only Admin or General Manager can delete documents." }
  }

  try {
    const doc = await prisma.contactDocument.findUnique({
      where: { id: documentId },
    })

    if (!doc) return { error: "Document not found." }

    await prisma.contactDocument.delete({ where: { id: documentId } })

    await audit({
      action:     "DOCUMENT_DELETED",
      entityType: "CONTACT",
      entityId:   contactId,
      actor:      session,
      metadata: {
        documentId,
        fileName: doc.fileName,
        vault:    true,
      },
    })

    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete document." }
  }
}