import { deleteFromDrive } from "@/lib/google-drive"

export async function deleteDocument(documentId: string, contactId: string) {
  await requireAuth()

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!doc) return { error: "Document not found." }

    // Delete from Google Drive using the stored fileKey (Drive file ID)
    try {
      await deleteFromDrive(doc.fileKey)
    } catch {
      // Log but don't block — DB record should still be removed
      console.error(`[deleteDocument] Failed to delete from Drive: ${doc.fileKey}`)
    }

    await prisma.document.delete({ where: { id: documentId } })
    revalidatePath(`/contacts/${contactId}`)
    return { success: true }
  } catch {
    return { error: "Failed to delete document." }
  }
}