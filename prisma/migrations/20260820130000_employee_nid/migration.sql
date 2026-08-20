-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "nid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_nid_key" ON "Employee"("nid");
