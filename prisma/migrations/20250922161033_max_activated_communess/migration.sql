/*
  Warnings:

  - You are about to drop the column `maxActivatedCommunes` on the `Commune` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Commune" DROP COLUMN "maxActivatedCommunes";

-- AlterTable
ALTER TABLE "public"."Setting" ADD COLUMN     "maxActivatedCommunes" INTEGER NOT NULL DEFAULT 10;
