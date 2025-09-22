-- AlterTable
ALTER TABLE "public"."Commune" ADD COLUMN     "maxActivatedCommunes" INTEGER NOT NULL DEFAULT 10,
ALTER COLUMN "is_verified" SET DEFAULT false;
