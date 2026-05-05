-- CreateEnum
CREATE TYPE "public"."TypeUtilisateur" AS ENUM ('SUPERADMIN', 'ADMIN', 'AGENT_COLLECTE', 'POINT_FOCAL', 'COORDINATION');

-- AlterTable
ALTER TABLE "public"."Utilisateur" ADD COLUMN     "type" "public"."TypeUtilisateur" NOT NULL DEFAULT 'AGENT_COLLECTE';
