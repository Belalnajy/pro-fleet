-- AlterTable
ALTER TABLE "public"."customs_clearance_invoices" ADD COLUMN     "qrCode" TEXT;

-- AlterTable
ALTER TABLE "public"."invoices" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "qrCode" TEXT,
ALTER COLUMN "tripId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isBot" BOOLEAN NOT NULL DEFAULT false,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
