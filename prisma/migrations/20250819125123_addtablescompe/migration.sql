-- AlterTable
ALTER TABLE `TypeInfrastructure` ADD COLUMN `competenceId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `TypeInfrastructure` ADD CONSTRAINT `TypeInfrastructure_competenceId_fkey` FOREIGN KEY (`competenceId`) REFERENCES `Competence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
