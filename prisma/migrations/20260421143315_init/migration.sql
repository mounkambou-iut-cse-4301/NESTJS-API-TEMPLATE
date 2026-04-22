-- CreateEnum
CREATE TYPE "public"."Genre" AS ENUM ('F', 'M');

-- CreateEnum
CREATE TYPE "public"."TypeUtilisateur" AS ENUM ('SUPERADMIN', 'ADMIN', 'CLIENT', 'PROFESSIONEL', 'INSTITUT');

-- CreateEnum
CREATE TYPE "public"."StatutModele" AS ENUM ('PENDING', 'CONFIRM');

-- CreateEnum
CREATE TYPE "public"."StatutReservation" AS ENUM ('PROPOSE', 'EN_ATTENTE_PAIEMENT', 'EN_ATTENTE_PRESTATION', 'CANCEL', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."StatutPaiement" AS ENUM ('PENDING', 'CONFIRM', 'CANCEL');

-- CreateEnum
CREATE TYPE "public"."ModePaiement" AS ENUM ('CARTE', 'MOBILE_MONEY', 'ESPECES');

-- CreateEnum
CREATE TYPE "public"."TypeReservation" AS ENUM ('A_DOMICILE', 'A_INSTITUT');

-- CreateEnum
CREATE TYPE "public"."TypeCommission" AS ENUM ('POURCENTAGE', 'FIXE');

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "date_naissance" TIMESTAMP(3),
    "genre" "public"."Genre",
    "type" "public"."TypeUtilisateur" NOT NULL DEFAULT 'CLIENT',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "is_block" BOOLEAN NOT NULL DEFAULT false,
    "nombre_attempts" INTEGER NOT NULL DEFAULT 0,
    "derniere_connexion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UtilisateurRole" (
    "utilisateurId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UtilisateurRole_pkey" PRIMARY KEY ("utilisateurId","roleId")
);

-- CreateTable
CREATE TABLE "public"."RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "commission_domicile" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_domicile_type" "public"."TypeCommission" NOT NULL DEFAULT 'POURCENTAGE',
    "commission_institut" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commission_institut_type" "public"."TypeCommission" NOT NULL DEFAULT 'POURCENTAGE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."adresses" (
    "id" SERIAL NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "adresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" SERIAL NOT NULL,
    "nom" TEXT,
    "images" TEXT[],
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "image" TEXT,
    "categorieId" INTEGER NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modeles" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "images" TEXT[],
    "statut" "public"."StatutModele" NOT NULL DEFAULT 'PENDING',
    "prestataireProposeId" INTEGER,
    "serviceId" INTEGER NOT NULL,

    CONSTRAINT "modeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tarifs" (
    "id" SERIAL NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "duree_estime" INTEGER NOT NULL,
    "age_min" INTEGER NOT NULL,
    "age_max" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,

    CONSTRAINT "tarifs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."institut_modeles" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "institut_modeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."portfolios" (
    "id" SERIAL NOT NULL,
    "images" TEXT[],
    "utilisateurId" INTEGER NOT NULL,
    "modelId" INTEGER,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reservations" (
    "id" SERIAL NOT NULL,
    "heure_debut" TIMESTAMP(3) NOT NULL,
    "heure_fin" TIMESTAMP(3) NOT NULL,
    "date_reservation" TIMESTAMP(3) NOT NULL,
    "type" "public"."TypeReservation" NOT NULL DEFAULT 'A_DOMICILE',
    "statut" "public"."StatutReservation" NOT NULL DEFAULT 'PROPOSE',
    "age" INTEGER,
    "sexe" "public"."Genre",
    "nom_client" TEXT NOT NULL,
    "numero_client" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "modelId" INTEGER NOT NULL,
    "adresseId" INTEGER NOT NULL,
    "prestataireId" INTEGER,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."propositions" (
    "id" SERIAL NOT NULL,
    "prestataireId" INTEGER NOT NULL,
    "reservationId" INTEGER NOT NULL,

    CONSTRAINT "propositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date_paiement" TIMESTAMP(3),
    "mode_paiement" "public"."ModePaiement",
    "statut_paiement" "public"."StatutPaiement" NOT NULL DEFAULT 'PENDING',
    "reservationId" INTEGER,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_nom_key" ON "public"."Role"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "public"."categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "services_nom_key" ON "public"."services"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "institut_modeles_utilisateurId_modelId_key" ON "public"."institut_modeles"("utilisateurId", "modelId");

-- CreateIndex
CREATE UNIQUE INDEX "propositions_prestataireId_reservationId_key" ON "public"."propositions"("prestataireId", "reservationId");

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."adresses" ADD CONSTRAINT "adresses_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modeles" ADD CONSTRAINT "modeles_prestataireProposeId_fkey" FOREIGN KEY ("prestataireProposeId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modeles" ADD CONSTRAINT "modeles_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tarifs" ADD CONSTRAINT "tarifs_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institut_modeles" ADD CONSTRAINT "institut_modeles_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."institut_modeles" ADD CONSTRAINT "institut_modeles_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."portfolios" ADD CONSTRAINT "portfolios_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."modeles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "public"."modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_adresseId_fkey" FOREIGN KEY ("adresseId") REFERENCES "public"."adresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reservations" ADD CONSTRAINT "reservations_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propositions" ADD CONSTRAINT "propositions_prestataireId_fkey" FOREIGN KEY ("prestataireId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."propositions" ADD CONSTRAINT "propositions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "public"."reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
