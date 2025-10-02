/*
  Warnings:

  - You are about to drop the column `modelo_carro` on the `Agendamento` table. All the data in the column will be lost.
  - You are about to drop the column `nome_cliente` on the `Agendamento` table. All the data in the column will be lost.
  - You are about to drop the column `placa_carro` on the `Agendamento` table. All the data in the column will be lost.
  - Added the required column `carroId` to the `Agendamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clienteId` to the `Agendamento` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Servico" DROP CONSTRAINT "Servico_agendamentoId_fkey";

-- AlterTable
ALTER TABLE "Agendamento" DROP COLUMN "modelo_carro",
DROP COLUMN "nome_cliente",
DROP COLUMN "placa_carro",
ADD COLUMN     "carroId" INTEGER NOT NULL,
ADD COLUMN     "clienteId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carro" (
    "id" SERIAL NOT NULL,
    "modelo" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "clienteId" INTEGER NOT NULL,

    CONSTRAINT "Carro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nome_key" ON "Cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Carro_placa_key" ON "Carro"("placa");

-- AddForeignKey
ALTER TABLE "Carro" ADD CONSTRAINT "Carro_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_carroId_fkey" FOREIGN KEY ("carroId") REFERENCES "Carro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;
