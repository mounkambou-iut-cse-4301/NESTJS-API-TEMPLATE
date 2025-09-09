-- CreateTable
CREATE TABLE "public"."Region" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "code" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Departement" (
    "id" SERIAL NOT NULL,
    "regionId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "code" TEXT,

    CONSTRAINT "Departement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Arrondissement" (
    "id" SERIAL NOT NULL,
    "departementId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "code" TEXT,

    CONSTRAINT "Arrondissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commune" (
    "id" SERIAL NOT NULL,
    "arrondissementId" INTEGER,
    "departementId" INTEGER NOT NULL,
    "regionId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "nom_maire" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "code" TEXT,
    "typeCommuneId" INTEGER,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_block" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "communeId" INTEGER,
    "telephone" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "photo_url" TEXT,
    "ville" TEXT,
    "adresse" TEXT,
    "is_block" BOOLEAN NOT NULL DEFAULT false,
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
CREATE TABLE "public"."Domaine" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Domaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SousDomaine" (
    "id" SERIAL NOT NULL,
    "domaineId" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "nom_en" TEXT,
    "code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SousDomaine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Parcour" (
    "id" BIGSERIAL NOT NULL,
    "collecteurId" INTEGER,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TypeCommune" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeCommune_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Competence" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sousDomaineId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TypeInfrastructure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" JSONB,
    "description" TEXT,
    "images" JSONB,
    "attribus" JSONB NOT NULL,
    "composant" JSONB,
    "domaineId" INTEGER,
    "sousdomaineId" INTEGER,
    "competenceId" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TypeInfrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Infrastructure" (
    "id" BIGSERIAL NOT NULL,
    "id_parent" BIGINT,
    "id_type_infrastructure" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "existing_infrastructure" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "departementId" INTEGER NOT NULL,
    "arrondissementId" INTEGER NOT NULL,
    "communeId" INTEGER NOT NULL,
    "utilisateurId" INTEGER,
    "competenceId" INTEGER,
    "location" JSONB,
    "images" JSONB,
    "attribus" JSONB NOT NULL,
    "domaineId" INTEGER,
    "sousdomaineId" INTEGER,
    "composant" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeletedInfrastructure" (
    "id" BIGINT NOT NULL,
    "id_parent" BIGINT,
    "id_type_infrastructure" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "existing_infrastructure" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "departementId" INTEGER NOT NULL,
    "arrondissementId" INTEGER NOT NULL,
    "communeId" INTEGER NOT NULL,
    "domaineId" INTEGER,
    "sousdomaineId" INTEGER,
    "competenceId" INTEGER,
    "utilisateurId" INTEGER,
    "location" JSONB,
    "images" JSONB,
    "attribus" JSONB,
    "composant" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "fileURL" TEXT NOT NULL,

    CONSTRAINT "DeletedInfrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Region_code_key" ON "public"."Region"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Departement_code_key" ON "public"."Departement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Arrondissement_code_key" ON "public"."Arrondissement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Commune_code_key" ON "public"."Commune"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "public"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_telephone_key" ON "public"."Utilisateur"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "Role_nom_key" ON "public"."Role"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "public"."Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Domaine_nom_key" ON "public"."Domaine"("nom");

-- CreateIndex
CREATE INDEX "idx_parcour_collecteur" ON "public"."Parcour"("collecteurId");

-- CreateIndex
CREATE INDEX "idx_parcour_recordedAt" ON "public"."Parcour"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TypeCommune_name_key" ON "public"."TypeCommune"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Competence_name_key" ON "public"."Competence"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TypeInfrastructure_name_key" ON "public"."TypeInfrastructure"("name");

-- CreateIndex
CREATE INDEX "idx_infra_commune" ON "public"."Infrastructure"("communeId");

-- CreateIndex
CREATE INDEX "idx_infra_type" ON "public"."Infrastructure"("id_type_infrastructure");

-- AddForeignKey
ALTER TABLE "public"."Departement" ADD CONSTRAINT "Departement_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Arrondissement" ADD CONSTRAINT "Arrondissement_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commune" ADD CONSTRAINT "Commune_arrondissementId_fkey" FOREIGN KEY ("arrondissementId") REFERENCES "public"."Arrondissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commune" ADD CONSTRAINT "Commune_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commune" ADD CONSTRAINT "Commune_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commune" ADD CONSTRAINT "Commune_typeCommuneId_fkey" FOREIGN KEY ("typeCommuneId") REFERENCES "public"."TypeCommune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "public"."Commune"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SousDomaine" ADD CONSTRAINT "SousDomaine_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "public"."Domaine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Parcour" ADD CONSTRAINT "Parcour_collecteurId_fkey" FOREIGN KEY ("collecteurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Competence" ADD CONSTRAINT "Competence_sousDomaineId_fkey" FOREIGN KEY ("sousDomaineId") REFERENCES "public"."SousDomaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypeInfrastructure" ADD CONSTRAINT "TypeInfrastructure_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "public"."Domaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypeInfrastructure" ADD CONSTRAINT "TypeInfrastructure_sousdomaineId_fkey" FOREIGN KEY ("sousdomaineId") REFERENCES "public"."SousDomaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TypeInfrastructure" ADD CONSTRAINT "TypeInfrastructure_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "public"."Competence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_id_parent_fkey" FOREIGN KEY ("id_parent") REFERENCES "public"."Infrastructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_id_type_infrastructure_fkey" FOREIGN KEY ("id_type_infrastructure") REFERENCES "public"."TypeInfrastructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_arrondissementId_fkey" FOREIGN KEY ("arrondissementId") REFERENCES "public"."Arrondissement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "public"."Commune"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "public"."Competence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_domaineId_fkey" FOREIGN KEY ("domaineId") REFERENCES "public"."Domaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Infrastructure" ADD CONSTRAINT "Infrastructure_sousdomaineId_fkey" FOREIGN KEY ("sousdomaineId") REFERENCES "public"."SousDomaine"("id") ON DELETE SET NULL ON UPDATE CASCADE;
