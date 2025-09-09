-- AlterTable
ALTER TABLE "public"."Commune" ADD COLUMN     "communeUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."Infrastructure" ADD COLUMN     "is_synchronized" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "centralServerUrl" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);
