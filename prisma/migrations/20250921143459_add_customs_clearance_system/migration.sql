-- CreateEnum
CREATE TYPE "public"."ClearanceStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('BILL_OF_LADING', 'COMMERCIAL_INVOICE', 'PACKING_LIST', 'CERTIFICATE_OF_ORIGIN', 'IMPORT_LICENSE', 'CUSTOMS_DECLARATION', 'INSURANCE_CERTIFICATE', 'OTHER');

-- CreateTable
CREATE TABLE "public"."customs_clearances" (
    "id" TEXT NOT NULL,
    "clearanceNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "customsBrokerId" TEXT NOT NULL,
    "status" "public"."ClearanceStatus" NOT NULL DEFAULT 'PENDING',
    "customsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customs_clearances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customs_documents" (
    "id" TEXT NOT NULL,
    "clearanceId" TEXT NOT NULL,
    "documentType" "public"."DocumentType" NOT NULL,
    "documentName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "customs_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customs_tariffs" (
    "id" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "dutyRate" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "additionalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customs_tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customs_clearances_clearanceNumber_key" ON "public"."customs_clearances"("clearanceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customs_tariffs_hsCode_key" ON "public"."customs_tariffs"("hsCode");

-- AddForeignKey
ALTER TABLE "public"."customs_clearances" ADD CONSTRAINT "customs_clearances_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_clearances" ADD CONSTRAINT "customs_clearances_customsBrokerId_fkey" FOREIGN KEY ("customsBrokerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_documents" ADD CONSTRAINT "customs_documents_clearanceId_fkey" FOREIGN KEY ("clearanceId") REFERENCES "public"."customs_clearances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
