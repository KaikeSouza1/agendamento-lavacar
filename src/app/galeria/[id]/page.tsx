// src/app/galeria/[id]/page.tsx

import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, User } from 'lucide-react';

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

export default async function PaginaGaleria({ params }: { params: { id: string } }) {
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
            {/* A linha da CardDescription com a data foi removida */}
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
            
            {/* A seção de "Serviços Adicionais" foi removida */}

          </CardContent>
        </Card>
         <footer className="text-center mt-8 text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Garage Wier. Todos os direitos reservados.</p>
        </footer>
      </div>
    </main>
  );
}