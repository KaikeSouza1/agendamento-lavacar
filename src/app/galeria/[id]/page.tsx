// src/app/galeria/[id]/page.tsx

import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Car, User } from 'lucide-react';

async function getServicoData(galleryId: string) {
  // A busca no banco de dados continua usando o campo "galleryId", isso está correto!
  const servico = await prisma.servico.findUnique({
    where: { galleryId: galleryId }, // <-- Sem alteração aqui
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

// A única mudança é aqui: de "galleryId" para "id"
export default async function PaginaGaleria({ params }: { params: { id: string } }) {
  // E aqui: de "params.galleryId" para "params.id"
  const servico = await getServicoData(params.id);

  if (!servico) {
    notFound();
  }

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
            <CardDescription>
              Serviço finalizado em: {servico.finalizado_em ? format(new Date(servico.finalizado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
            </CardDescription>
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
            
            {servico.servicos_adicionais && (
                 <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Serviços Adicionais</h3>
                    <p className='text-muted-foreground'>{servico.servicos_adicionais}</p>
                 </div>
            )}
          </CardContent>
        </Card>
         <footer className="text-center mt-8 text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Garage Wier. Todos os direitos reservados.</p>
        </footer>
      </div>
    </main>
  );
}