/*
  Warnings:

  - A unique constraint covering the columns `[telephone]` on the table `Utilisateur` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `telephone` to the `Utilisateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Utilisateur` ADD COLUMN `telephone` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Utilisateur_telephone_key` ON `Utilisateur`(`telephone`);
