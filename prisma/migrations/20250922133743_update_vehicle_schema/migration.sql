/*
  Warnings:

  - You are about to drop the column `capacity` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `vehicles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[vehicleTypeId,vehicleNumber]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."vehicles_vehicleTypeId_capacity_key";

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "capacity",
DROP COLUMN "description",
ADD COLUMN     "vehicleNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleTypeId_vehicleNumber_key" ON "public"."vehicles"("vehicleTypeId", "vehicleNumber");
