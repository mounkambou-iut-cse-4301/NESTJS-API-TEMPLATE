-- AlterTable
ALTER TABLE `Competence` ADD COLUMN `sousDomaineId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Competence` ADD CONSTRAINT `Competence_sousDomaineId_fkey` FOREIGN KEY (`sousDomaineId`) REFERENCES `SousDomaine`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
