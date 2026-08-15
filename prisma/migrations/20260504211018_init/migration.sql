-- CreateEnum
CREATE TYPE "public"."TypeUtilisateur" AS ENUM ('SUPERADMIN', 'ADMIN', 'INSPECTEUR');

-- CreateTable
CREATE TABLE "public"."Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Departement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Arrodissement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "departementId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Arrodissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isBlock" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "type" "public"."TypeUtilisateur" NOT NULL DEFAULT 'INSPECTEUR',
    "picture" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "loginAttempt" INTEGER NOT NULL DEFAULT 0,
    "regionId" INTEGER,
    "departementId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PermissionRole" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UtilisateurRole" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UtilisateurRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "public"."Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Region_nameEn_key" ON "public"."Region"("nameEn");

-- CreateIndex
CREATE INDEX "Departement_regionId_idx" ON "public"."Departement"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Departement_regionId_name_key" ON "public"."Departement"("regionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Departement_regionId_nameEn_key" ON "public"."Departement"("regionId", "nameEn");

-- CreateIndex
CREATE INDEX "Arrodissement_departementId_idx" ON "public"."Arrodissement"("departementId");

-- CreateIndex
CREATE UNIQUE INDEX "Arrodissement_departementId_name_key" ON "public"."Arrodissement"("departementId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Arrodissement_departementId_nameEn_key" ON "public"."Arrodissement"("departementId", "nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "public"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_phone_key" ON "public"."Utilisateur"("phone");

-- CreateIndex
CREATE INDEX "Utilisateur_regionId_idx" ON "public"."Utilisateur"("regionId");

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_idx" ON "public"."Utilisateur"("departementId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE INDEX "PermissionRole_roleId_idx" ON "public"."PermissionRole"("roleId");

-- CreateIndex
CREATE INDEX "PermissionRole_permissionId_idx" ON "public"."PermissionRole"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionRole_roleId_permissionId_key" ON "public"."PermissionRole"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "UtilisateurRole_utilisateurId_idx" ON "public"."UtilisateurRole"("utilisateurId");

-- CreateIndex
CREATE INDEX "UtilisateurRole_roleId_idx" ON "public"."UtilisateurRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UtilisateurRole_utilisateurId_roleId_key" ON "public"."UtilisateurRole"("utilisateurId", "roleId");

-- AddForeignKey
ALTER TABLE "public"."Departement" ADD CONSTRAINT "Departement_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arrodissement" ADD CONSTRAINT "Arrodissement_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionRole" ADD CONSTRAINT "PermissionRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionRole" ADD CONSTRAINT "PermissionRole_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
