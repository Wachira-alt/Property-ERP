-- CreateTable
CREATE TABLE "contact_documents" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploaderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_documents_contactId_idx" ON "contact_documents"("contactId");

-- AddForeignKey
ALTER TABLE "contact_documents" ADD CONSTRAINT "contact_documents_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
