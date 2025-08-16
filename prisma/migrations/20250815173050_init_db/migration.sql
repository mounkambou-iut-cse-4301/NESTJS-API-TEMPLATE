-- CreateTable
CREATE TABLE `Region` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Region_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Departement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `regionId` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Departement_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Arrondissement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `departementId` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,

    UNIQUE INDEX `Arrondissement_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commune` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `arrondissementId` INTEGER NOT NULL,
    `departementId` INTEGER NOT NULL,
    `regionId` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_block` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Commune_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Utilisateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mot_de_passe` VARCHAR(191) NOT NULL,
    `communeId` INTEGER NULL,
    `is_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_block` BOOLEAN NOT NULL DEFAULT false,
    `derniere_connexion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Utilisateur_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Role_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Permission_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UtilisateurRole` (
    `utilisateurId` INTEGER NOT NULL,
    `roleId` INTEGER NOT NULL,

    PRIMARY KEY (`utilisateurId`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permissionId` INTEGER NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TypeInfrastructure` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `domaine` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `location` JSON NULL,
    `images` JSON NULL,
    `attribus` JSON NOT NULL,
    `composant` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TypeInfrastructure_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Infrastructure` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `id_type_infrastructure` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `existing_infrastructure` BOOLEAN NOT NULL DEFAULT true,
    `type` VARCHAR(191) NOT NULL,
    `regionId` INTEGER NOT NULL,
    `departementId` INTEGER NOT NULL,
    `arrondissementId` INTEGER NOT NULL,
    `communeId` INTEGER NOT NULL,
    `location` JSON NULL,
    `images` JSON NULL,
    `attribus` JSON NOT NULL,
    `composant` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_infra_commune`(`communeId`),
    INDEX `idx_infra_type`(`id_type_infrastructure`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Departement` ADD CONSTRAINT `Departement_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Arrondissement` ADD CONSTRAINT `Arrondissement_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commune` ADD CONSTRAINT `Commune_arrondissementId_fkey` FOREIGN KEY (`arrondissementId`) REFERENCES `Arrondissement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commune` ADD CONSTRAINT `Commune_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commune` ADD CONSTRAINT `Commune_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Utilisateur` ADD CONSTRAINT `Utilisateur_communeId_fkey` FOREIGN KEY (`communeId`) REFERENCES `Commune`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UtilisateurRole` ADD CONSTRAINT `UtilisateurRole_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UtilisateurRole` ADD CONSTRAINT `UtilisateurRole_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_id_type_infrastructure_fkey` FOREIGN KEY (`id_type_infrastructure`) REFERENCES `TypeInfrastructure`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_regionId_fkey` FOREIGN KEY (`regionId`) REFERENCES `Region`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_departementId_fkey` FOREIGN KEY (`departementId`) REFERENCES `Departement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_arrondissementId_fkey` FOREIGN KEY (`arrondissementId`) REFERENCES `Arrondissement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_communeId_fkey` FOREIGN KEY (`communeId`) REFERENCES `Commune`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
