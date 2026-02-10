-- CreateEnum
CREATE TYPE "SignatureLayout" AS ENUM ('COMPACT', 'CLASSIC', 'MINIMAL');

-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "calendarUrl" TEXT,
ADD COLUMN     "pronouns" TEXT;

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "layout" "SignatureLayout" NOT NULL DEFAULT 'CLASSIC',
    "config" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signature_userId_idx" ON "Signature"("userId");

-- CreateIndex
CREATE INDEX "Signature_cardId_idx" ON "Signature"("cardId");

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
