-- DropForeignKey
ALTER TABLE "opportunities" DROP CONSTRAINT "opportunities_unitId_fkey";

-- AlterTable
ALTER TABLE "opportunities" ALTER COLUMN "unitId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
