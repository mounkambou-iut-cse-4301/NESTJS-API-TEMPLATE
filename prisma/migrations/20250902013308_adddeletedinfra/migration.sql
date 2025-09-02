-- AlterTable
ALTER TABLE `Commune` MODIFY `is_verified` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `DeletedInfrastructure` (
    `id` BIGINT NOT NULL,
    `id_parent` BIGINT NULL,
    `id_type_infrastructure` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `existing_infrastructure` BOOLEAN NOT NULL DEFAULT true,
    `type` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NOT NULL,
    `departementId` INTEGER NOT NULL,
    `arrondissementId` INTEGER NOT NULL,
    `communeId` INTEGER NOT NULL,
    `domaineId` INTEGER NULL,
    `sousdomaineId` INTEGER NULL,
    `competenceId` INTEGER NULL,
    `utilisateurId` INTEGER NULL,
    `location` JSON NULL,
    `images` JSON NULL,
    `attribus` JSON NULL,
    `composant` JSON NULL,
    `created_at` DATETIME(3) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `fileURL` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
