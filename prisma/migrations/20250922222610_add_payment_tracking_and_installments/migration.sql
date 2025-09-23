/*
  Warnings:

  - You are about to drop the column `customsBrokerId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `customsFee` on the `invoices` table. All the data in the column will be lost.
  - Made the column `tripId` on table `invoices` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PaymentStatus" ADD VALUE 'PARTIAL';
ALTER TYPE "public"."PaymentStatus" ADD VALUE 'INSTALLMENT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."TripStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "public"."TripStatus" ADD VALUE 'EN_ROUTE_PICKUP';
ALTER TYPE "public"."TripStatus" ADD VALUE 'AT_PICKUP';
ALTER TYPE "public"."TripStatus" ADD VALUE 'PICKED_UP';
ALTER TYPE "public"."TripStatus" ADD VALUE 'IN_TRANSIT';
ALTER TYPE "public"."TripStatus" ADD VALUE 'AT_DESTINATION';

-- DropForeignKey
ALTER TABLE "public"."invoices" DROP CONSTRAINT "invoices_customsBrokerId_fkey";

-- AlterTable
ALTER TABLE "public"."invoices" DROP COLUMN "customsBrokerId",
DROP COLUMN "customsFee",
ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "installmentAmount" DOUBLE PRECISION,
ADD COLUMN     "installmentCount" INTEGER,
ADD COLUMN     "installmentsPaid" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextInstallmentDate" TIMESTAMP(3),
ADD COLUMN     "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "tripId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."tracking_logs" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "public"."trips" ADD COLUMN     "arrivedDestAt" TIMESTAMP(3),
ADD COLUMN     "arrivedPickupAt" TIMESTAMP(3),
ADD COLUMN     "assignedAt" TIMESTAMP(3),
ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "destinationLat" DOUBLE PRECISION,
ADD COLUMN     "destinationLng" DOUBLE PRECISION,
ADD COLUMN     "enRoutePickupAt" TIMESTAMP(3),
ADD COLUMN     "inTransitAt" TIMESTAMP(3),
ADD COLUMN     "originLat" DOUBLE PRECISION,
ADD COLUMN     "originLng" DOUBLE PRECISION,
ADD COLUMN     "pickedUpAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."customs_clearance_invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "clearanceId" TEXT NOT NULL,
    "customsBrokerId" TEXT NOT NULL,
    "customsFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "additionalFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.15,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installmentCount" INTEGER,
    "installmentsPaid" INTEGER NOT NULL DEFAULT 0,
    "nextInstallmentDate" TIMESTAMP(3),
    "installmentAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customs_clearance_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clearance_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clearance_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customs_clearance_invoices_invoiceNumber_key" ON "public"."customs_clearance_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "customs_clearance_invoices_clearanceId_key" ON "public"."customs_clearance_invoices"("clearanceId");

-- AddForeignKey
ALTER TABLE "public"."customs_clearance_invoices" ADD CONSTRAINT "customs_clearance_invoices_clearanceId_fkey" FOREIGN KEY ("clearanceId") REFERENCES "public"."customs_clearances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customs_clearance_invoices" ADD CONSTRAINT "customs_clearance_invoices_customsBrokerId_fkey" FOREIGN KEY ("customsBrokerId") REFERENCES "public"."customs_brokers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clearance_payments" ADD CONSTRAINT "clearance_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "public"."customs_clearance_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
