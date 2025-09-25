/*
  Warnings:

  - You are about to drop the column `estimatedDeliveryDate` on the `trips` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('TRIP_STATUS_UPDATE', 'TRIP_ASSIGNED', 'TRIP_CANCELLED', 'INVOICE_CREATED', 'INVOICE_PAID', 'PAYMENT_RECEIVED', 'DRIVER_ASSIGNED', 'DRIVER_ACCEPTED', 'DRIVER_REJECTED', 'SYSTEM_ANNOUNCEMENT', 'CUSTOMS_UPDATE');

-- AlterTable
ALTER TABLE "public"."trips" DROP COLUMN "estimatedDeliveryDate";

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
