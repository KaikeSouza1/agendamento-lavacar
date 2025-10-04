// src/app/galeria/[id]/page.tsx

import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, User, History } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Função para buscar o serviço atual (sem alterações)
async function getServicoData(galleryId: string) {
  const servico = await prisma.servico.findUnique({
    where: { galleryId: galleryId },
    include: {
      agendamento: {
        include: {
          cliente: true,
          carro: true,
        },
      },
    },
  });
  return servico;
}

// NOVA FUNÇÃO: Busca os últimos 5 serviços concluídos do cliente
async function getHistoricoServicos(clienteId: number, currentServicoId: number) {
  // ############ A SOLUÇÃO ESTÁ AQUI ############
  // Força o fuso horário para São Paulo APENAS para esta busca
  process.env.TZ = 'America/Sao_Paulo';
  // ###########################################

  const historico = await prisma.servico.findMany({
    where: {
      status: 'Concluído',
      id: {
        not: currentServicoId,
      },
      agendamento: {
        clienteId: clienteId,
      },
    },
    include: {
      agendamento: {
        include: {
          carro: true,
        },
      },
    },
    orderBy: {
      finalizado_em: 'desc',
    },
    take: 5,
  });
  return historico;
}


export default async function PaginaGaleria({ params }: { params: { id: string } }) {
  const servico = await getServicoData(params.id);

  if (!servico) {
    notFound();
  }

  const historico = await getHistoricoServicos(servico.agendamento.clienteId, servico.id);

  const fotos = Array.isArray(servico.fotos) ? (servico.fotos as string[]) : [];

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <Image
                src="/logobarber.png"
                alt="Logo da Garage Wier"
                width={250}
                height={70}
                priority
                style={{ height: 'auto' }}
            />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Galeria do Veículo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <h3 className="font-semibold text-lg">Detalhes do Veículo</h3>
              <div className="flex items-center gap-3 text-muted-foreground"><User className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.cliente.nome}</span></div>
              <div className="flex items-center gap-3 text-muted-foreground"><Car className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.carro.modelo} - {servico.agendamento.carro.placa || 'Sem placa'}</span></div>
            </div>

             <div className="space-y-3">
                <h3 className="font-semibold text-lg">Fotos</h3>
                {fotos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {fotos.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                            <div className="relative aspect-square w-full overflow-hidden rounded-md">
                                <Image src={url} alt="Foto do serviço" fill sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-300 hover:scale-105" />
                            </div>
                        </a>
                    ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground text-center py-8">Nenhuma foto foi adicionada a este serviço.</p>
                )}
            </div>

            {historico.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Serviços
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {historico.map((servicoAnterior) => (
                    <AccordionItem value={`item-${servicoAnterior.id}`} key={servicoAnterior.id}>
                      <AccordionTrigger>
                        {servicoAnterior.finalizado_em ? format(new Date(servicoAnterior.finalizado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Data indisponível'}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col space-y-2">
                           <p><strong>Carro:</strong> {servicoAnterior.agendamento.carro.modelo}</p>
                           {servicoAnterior.valor && (
                            <p><strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(servicoAnterior.valor))}</p>
                           )}
                           <a href={`/galeria/${servicoAnterior.galleryId}`} className="text-sm text-primary hover:underline mt-2">
                             Ver galeria deste serviço
                           </a>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
          </CardContent>
        </Card>
         <footer className="text-center mt-8 text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Garage Wier. Todos os direitos reservados.
              Desenvolvido por Kaike Souza ®
            </p>
        </footer>
      </div>
    </main>
  );
}
/////
