-- AlterTable
ALTER TABLE `Infrastructure` ADD COLUMN `id_parent` BIGINT NULL;

-- AddForeignKey
ALTER TABLE `Infrastructure` ADD CONSTRAINT `Infrastructure_id_parent_fkey` FOREIGN KEY (`id_parent`) REFERENCES `Infrastructure`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
