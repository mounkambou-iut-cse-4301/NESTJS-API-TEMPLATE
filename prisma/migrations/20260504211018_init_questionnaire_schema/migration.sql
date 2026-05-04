-- CreateEnum
CREATE TYPE "public"."TypeQuestion" AS ENUM ('TEXT', 'BOOLEAN', 'NUMBERS', 'DECIMAL', 'DATE', 'PHONE', 'REGION', 'DEPARTEMENT', 'ARRODISSEMENT', 'GPS', 'OBJECT', 'ENUM', 'MULTI_SELECT', 'TABLE', 'FILE', 'PHOTO');

-- CreateEnum
CREATE TYPE "public"."StatutFiche" AS ENUM ('PENDING', 'VALID', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."PhotoType" AS ENUM ('PORTRAIT', 'ACTIVITE', 'HABITAT', 'PIECE_JUSTIFICATIVE', 'AUTRE');

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
CREATE TABLE "public"."Groupe" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Groupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Zone" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "groupeId" INTEGER NOT NULL,
    "departementId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Questionnaire" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Questionnaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "code" TEXT,
    "question" TEXT NOT NULL,
    "type" "public"."TypeQuestion" NOT NULL,
    "description" TEXT,
    "sectionId" INTEGER,
    "questionnaireId" INTEGER,
    "order" INTEGER,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" JSONB,
    "validationRules" JSONB,
    "visibilityRules" JSONB,
    "scoringRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionSection" (
    "id" SERIAL NOT NULL,
    "questionnaireId" INTEGER NOT NULL,
    "sectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fiche" (
    "id" SERIAL NOT NULL,
    "questionnaireId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,
    "regionId" INTEGER,
    "departementId" INTEGER,
    "arrodissementId" INTEGER,
    "statut" "public"."StatutFiche" NOT NULL DEFAULT 'PENDING',
    "codeFiche" TEXT,
    "numeroQuestionnaire" TEXT,
    "resultatCollecte" INTEGER,
    "scoreTotal" INTEGER DEFAULT 0,
    "scoreDetails" JSONB,
    "statutSelection" TEXT,
    "signatureAgent" TEXT,
    "signatureFemme" TEXT,
    "savedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedById" INTEGER,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reponse" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "reponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FichePhoto" (
    "id" SERIAL NOT NULL,
    "ficheId" INTEGER NOT NULL,
    "type" "public"."PhotoType" NOT NULL DEFAULT 'AUTRE',
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FichePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Utilisateur" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isBlock" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "picture" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "loginAttempt" INTEGER NOT NULL DEFAULT 0,
    "regionId" INTEGER,
    "departementId" INTEGER,
    "groupeId" INTEGER,
    "zoneId" INTEGER,
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
CREATE INDEX "Groupe_regionId_idx" ON "public"."Groupe"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "Groupe_regionId_name_key" ON "public"."Groupe"("regionId", "name");

-- CreateIndex
CREATE INDEX "Zone_groupeId_idx" ON "public"."Zone"("groupeId");

-- CreateIndex
CREATE INDEX "Zone_departementId_idx" ON "public"."Zone"("departementId");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_groupeId_departementId_key" ON "public"."Zone"("groupeId", "departementId");

-- CreateIndex
CREATE UNIQUE INDEX "Questionnaire_name_key" ON "public"."Questionnaire"("name");

-- CreateIndex
CREATE INDEX "Section_order_idx" ON "public"."Section"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "public"."Section"("name");

-- CreateIndex
CREATE INDEX "Question_code_idx" ON "public"."Question"("code");

-- CreateIndex
CREATE INDEX "Question_sectionId_idx" ON "public"."Question"("sectionId");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_idx" ON "public"."Question"("questionnaireId");

-- CreateIndex
CREATE INDEX "Question_sectionId_order_idx" ON "public"."Question"("sectionId", "order");

-- CreateIndex
CREATE INDEX "Question_questionnaireId_order_idx" ON "public"."Question"("questionnaireId", "order");

-- CreateIndex
CREATE INDEX "QuestionSection_questionnaireId_idx" ON "public"."QuestionSection"("questionnaireId");

-- CreateIndex
CREATE INDEX "QuestionSection_sectionId_idx" ON "public"."QuestionSection"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSection_questionnaireId_sectionId_key" ON "public"."QuestionSection"("questionnaireId", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Fiche_codeFiche_key" ON "public"."Fiche"("codeFiche");

-- CreateIndex
CREATE UNIQUE INDEX "Fiche_numeroQuestionnaire_key" ON "public"."Fiche"("numeroQuestionnaire");

-- CreateIndex
CREATE INDEX "Fiche_questionnaireId_idx" ON "public"."Fiche"("questionnaireId");

-- CreateIndex
CREATE INDEX "Fiche_agentId_idx" ON "public"."Fiche"("agentId");

-- CreateIndex
CREATE INDEX "Fiche_regionId_idx" ON "public"."Fiche"("regionId");

-- CreateIndex
CREATE INDEX "Fiche_departementId_idx" ON "public"."Fiche"("departementId");

-- CreateIndex
CREATE INDEX "Fiche_arrodissementId_idx" ON "public"."Fiche"("arrodissementId");

-- CreateIndex
CREATE INDEX "Fiche_statut_idx" ON "public"."Fiche"("statut");

-- CreateIndex
CREATE INDEX "Fiche_validatedById_idx" ON "public"."Fiche"("validatedById");

-- CreateIndex
CREATE INDEX "Fiche_createdAt_idx" ON "public"."Fiche"("createdAt");

-- CreateIndex
CREATE INDEX "Fiche_savedAt_idx" ON "public"."Fiche"("savedAt");

-- CreateIndex
CREATE INDEX "Reponse_ficheId_idx" ON "public"."Reponse"("ficheId");

-- CreateIndex
CREATE INDEX "Reponse_questionId_idx" ON "public"."Reponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Reponse_ficheId_questionId_key" ON "public"."Reponse"("ficheId", "questionId");

-- CreateIndex
CREATE INDEX "FichePhoto_ficheId_idx" ON "public"."FichePhoto"("ficheId");

-- CreateIndex
CREATE INDEX "FichePhoto_type_idx" ON "public"."FichePhoto"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_email_key" ON "public"."Utilisateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_phone_key" ON "public"."Utilisateur"("phone");

-- CreateIndex
CREATE INDEX "Utilisateur_regionId_idx" ON "public"."Utilisateur"("regionId");

-- CreateIndex
CREATE INDEX "Utilisateur_departementId_idx" ON "public"."Utilisateur"("departementId");

-- CreateIndex
CREATE INDEX "Utilisateur_groupeId_idx" ON "public"."Utilisateur"("groupeId");

-- CreateIndex
CREATE INDEX "Utilisateur_zoneId_idx" ON "public"."Utilisateur"("zoneId");

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
ALTER TABLE "public"."Groupe" ADD CONSTRAINT "Groupe_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Zone" ADD CONSTRAINT "Zone_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "public"."Groupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Zone" ADD CONSTRAINT "Zone_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSection" ADD CONSTRAINT "QuestionSection_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuestionSection" ADD CONSTRAINT "QuestionSection_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "public"."Questionnaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "public"."Utilisateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Fiche" ADD CONSTRAINT "Fiche_arrodissementId_fkey" FOREIGN KEY ("arrodissementId") REFERENCES "public"."Arrodissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reponse" ADD CONSTRAINT "Reponse_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "public"."Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reponse" ADD CONSTRAINT "Reponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FichePhoto" ADD CONSTRAINT "FichePhoto_ficheId_fkey" FOREIGN KEY ("ficheId") REFERENCES "public"."Fiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_departementId_fkey" FOREIGN KEY ("departementId") REFERENCES "public"."Departement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "public"."Groupe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Utilisateur" ADD CONSTRAINT "Utilisateur_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "public"."Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionRole" ADD CONSTRAINT "PermissionRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PermissionRole" ADD CONSTRAINT "PermissionRole_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "public"."Utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UtilisateurRole" ADD CONSTRAINT "UtilisateurRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
