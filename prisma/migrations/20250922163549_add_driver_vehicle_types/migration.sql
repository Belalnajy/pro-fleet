-- CreateTable
CREATE TABLE "driver_vehicle_types" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_vehicle_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_vehicle_types_driverId_vehicleTypeId_key" ON "driver_vehicle_types"("driverId", "vehicleTypeId");

-- AddForeignKey
ALTER TABLE "driver_vehicle_types" ADD CONSTRAINT "driver_vehicle_types_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_vehicle_types" ADD CONSTRAINT "driver_vehicle_types_vehicleTypeId_fkey" FOREIGN KEY ("vehicleTypeId") REFERENCES "vehicle_type_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;
