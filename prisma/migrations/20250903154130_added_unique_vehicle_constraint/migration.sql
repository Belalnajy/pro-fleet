/*
  Warnings:

  - A unique constraint covering the columns `[type,capacity]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "vehicles_type_capacity_key" ON "vehicles"("type", "capacity");
