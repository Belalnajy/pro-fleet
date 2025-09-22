-- AlterTable
ALTER TABLE "public"."trips" ADD COLUMN     "customsBrokerId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."trips" ADD CONSTRAINT "trips_customsBrokerId_fkey" FOREIGN KEY ("customsBrokerId") REFERENCES "public"."customs_brokers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
