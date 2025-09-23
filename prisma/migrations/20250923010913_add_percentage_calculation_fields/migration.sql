-- AlterTable
ALTER TABLE "public"."customs_clearances" ADD COLUMN     "additionalFeesPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "additionalFeesType" TEXT NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "customsFeePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "customsFeeType" TEXT NOT NULL DEFAULT 'FIXED';
