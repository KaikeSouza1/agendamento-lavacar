-- AlterTable
ALTER TABLE "Agendamento" ADD COLUMN     "modelo_carro" TEXT,
ADD COLUMN     "placa_carro" TEXT;

-- CreateTable
CREATE TABLE "Servico" (
    "id" SERIAL NOT NULL,
    "agendamentoId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    "observacoes" TEXT,
    "fotos" JSONB,
    "checklist" JSONB,
    "iniciado_em" TIMESTAMP(3),
    "finalizado_em" TIMESTAMP(3),

    CONSTRAINT "Servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Servico_agendamentoId_key" ON "Servico"("agendamentoId");

-- AddForeignKey
ALTER TABLE "Servico" ADD CONSTRAINT "Servico_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "Agendamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
