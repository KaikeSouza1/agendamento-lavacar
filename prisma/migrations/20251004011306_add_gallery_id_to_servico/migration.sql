/*
  Warnings:

  - A unique constraint covering the columns `[galleryId]` on the table `Servico` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Servico" ADD COLUMN     "galleryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Servico_galleryId_key" ON "Servico"("galleryId");
