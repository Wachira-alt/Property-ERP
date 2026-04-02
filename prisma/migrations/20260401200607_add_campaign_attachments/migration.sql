-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "audience" TEXT NOT NULL DEFAULT 'ALL',
ADD COLUMN     "sentCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "campaign_attachments" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "campaign_attachments_campaignId_idx" ON "campaign_attachments"("campaignId");

-- AddForeignKey
ALTER TABLE "campaign_attachments" ADD CONSTRAINT "campaign_attachments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
