/*
  Warnings:

  - A unique constraint covering the columns `[communeUrl]` on the table `Commune` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Commune" ADD COLUMN     "communeUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Infrastructure" ADD COLUMN     "is_synchronized" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Commune_communeUrl_key" ON "public"."Commune"("communeUrl");
