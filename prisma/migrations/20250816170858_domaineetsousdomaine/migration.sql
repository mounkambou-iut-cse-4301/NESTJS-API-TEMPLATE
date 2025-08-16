/*
  Warnings:

  - You are about to drop the column `domaine` on the `TypeInfrastructure` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Infrastructure` ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `domaineId` INTEGER NULL,
    ADD COLUMN `sousdomaineId` INTEGER NULL;

-- AlterTable
ALTER TABLE `TypeInfrastructure` DROP COLUMN `domaine`,
    ADD COLUMN `description` VARCHAR(191) NULL,
    ADD COLUMN `domaineId` INTEGER NULL,
    ADD COLUMN `sousdomaineId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Domaine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `nom_en` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Domaine_nom_key`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SousDomaine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domaineId` INTEGER NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `nom_en` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SousDomaine` ADD CONSTRAINT `SousDomaine_domaineId_fkey` FOREIGN KEY (`domaineId`) REFERENCES `Domaine`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TypeInfrastructure` ADD CONSTRAINT `TypeInfrastructure_domaineId_fkey` FOREIGN KEY (`domaineId`) REFERENCES `Domaine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TypeInfrastructure` ADD CONSTRAINT `TypeInfrastructure_sousdomaineId_fkey` FOREIGN KEY (`sousdomaineId`) REFERENCES `SousDomaine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_domaineId_fkey` FOREIGN KEY (`domaineId`) REFERENCES `Domaine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_sousdomaineId_fkey` FOREIGN KEY (`sousdomaineId`) REFERENCES `SousDomaine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
