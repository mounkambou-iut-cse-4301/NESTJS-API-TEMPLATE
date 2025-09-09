/*
  Warnings:

  - You are about to drop the column `communeUrl` on the `Commune` table. All the data in the column will be lost.
  - You are about to drop the column `is_synchronized` on the `Infrastructure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Commune" DROP COLUMN "communeUrl";

-- AlterTable
ALTER TABLE "public"."Infrastructure" DROP COLUMN "is_synchronized";
