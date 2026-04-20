"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

const saveDocumentSchema = z.object({
  opportunityId: z.string().min(1),
  type:          z.enum([
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
  type: string
  fileName: string
  fileUrl: string
  fileKey: string
}) {
  await requireAuth()

  const parsed = saveDocumentSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  try {
    // Replace existing document of same type
    await prisma.document.deleteMany({
      where: {
        opportunityId: parsed.data.opportunityId,
        type:          parsed.data.type,
      },
    })

    await prisma.document.create({ data: parsed.data })

    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { error: "Failed to save document record." }
  }
}

export async function deleteDocument(documentId: string, contactId: string) {
  await requireAuth()

  try {
    await prisma.document.delete({ where: { id: documentId } })
    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete document." }
  }
}