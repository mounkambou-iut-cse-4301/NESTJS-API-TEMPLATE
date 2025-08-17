-- AlterTable
ALTER TABLE `Infrastructure` ADD COLUMN `utilisateurId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_utilisateurId_fkey` FOREIGN KEY (`utilisateurId`) REFERENCES `Utilisateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
