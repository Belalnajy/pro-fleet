-- Add customs clearance management tables

-- Customs Clearance table
CREATE TABLE "CustomsClearance" (
    "id" TEXT NOT NULL,
    "clearanceNumber" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "customsBrokerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customsFee" DECIMAL(10,2) DEFAULT 0,
    "additionalFees" DECIMAL(10,2) DEFAULT 0,
    "totalFees" DECIMAL(10,2) DEFAULT 0,
    "estimatedCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsClearance_pkey" PRIMARY KEY ("id")
);

-- Customs Documents table
CREATE TABLE "CustomsDocument" (
    "id" TEXT NOT NULL,
    "clearanceId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "notes" TEXT,

    CONSTRAINT "CustomsDocument_pkey" PRIMARY KEY ("id")
);

-- Customs Fees Calculator table
CREATE TABLE "CustomsTariff" (
    "id" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "dutyRate" DECIMAL(5,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "additionalFees" DECIMAL(10,2) DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsTariff_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE UNIQUE INDEX "CustomsClearance_clearanceNumber_key" ON "CustomsClearance"("clearanceNumber");
CREATE INDEX "CustomsClearance_invoiceId_idx" ON "CustomsClearance"("invoiceId");
CREATE INDEX "CustomsClearance_customsBrokerId_idx" ON "CustomsClearance"("customsBrokerId");
CREATE INDEX "CustomsClearance_status_idx" ON "CustomsClearance"("status");

CREATE INDEX "CustomsDocument_clearanceId_idx" ON "CustomsDocument"("clearanceId");
CREATE INDEX "CustomsDocument_documentType_idx" ON "CustomsDocument"("documentType");
CREATE INDEX "CustomsDocument_status_idx" ON "CustomsDocument"("status");

CREATE UNIQUE INDEX "CustomsTariff_hsCode_key" ON "CustomsTariff"("hsCode");
CREATE INDEX "CustomsTariff_isActive_idx" ON "CustomsTariff"("isActive");

-- Add foreign key constraints
ALTER TABLE "CustomsClearance" ADD CONSTRAINT "CustomsClearance_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomsClearance" ADD CONSTRAINT "CustomsClearance_customsBrokerId_fkey" FOREIGN KEY ("customsBrokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CustomsDocument" ADD CONSTRAINT "CustomsDocument_clearanceId_fkey" FOREIGN KEY ("clearanceId") REFERENCES "CustomsClearance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
