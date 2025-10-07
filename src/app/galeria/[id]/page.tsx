// src/app/galeria/[id]/page.tsx

"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Car, User, History, MessageSquareText, Star, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// Tipos do Prisma para type safety
type Servico = import('@prisma/client').Servico;
type Avaliacao = import('@prisma/client').Avaliacao;
type Agendamento = import('@prisma/client').Agendamento;
type Cliente = import('@prisma/client').Cliente;
type Carro = import('@prisma/client').Carro;

type ServicoCompleto = Servico & {
  avaliacao: Avaliacao | null;
  agendamento: Agendamento & {
    cliente: Cliente;
    carro: Carro;
  };
};

type HistoricoServico = Servico & {
  agendamento: Agendamento & {
    carro: Carro;
  };
};

export default function PaginaGaleria() {
  const params = useParams();
  const id = params.id as string;
  const [servico, setServico] = useState<ServicoCompleto | null>(null);
  const [historico, setHistorico] = useState<HistoricoServico[]>([]);
  const [loading, setLoading] = useState(true);

  const [estrelas, setEstrelas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<Avaliacao | null>(null);

  useEffect(() => {
    if (!id) return;
    
    async function fetchData() {
      try {
        const response = await fetch(`/api/galeria/${id}`);
        if (!response.ok) {
          notFound();
          return;
        }
        const data: ServicoCompleto = await response.json();
        setServico(data);

        if (data.avaliacao) {
          setAvaliacaoExistente(data.avaliacao);
          setEstrelas(data.avaliacao.estrelas);
          setComentario(data.avaliacao.comentario || "");
        }

        const historyResponse = await fetch(`/api/historico/${data.agendamento.clienteId}?servicoAtualId=${data.id}`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setHistorico(historyData);
        }

      } catch (error) {
        toast.error("Não foi possível carregar os dados da galeria.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSubmitAvaliacao = async () => {
    if (estrelas === 0) {
      toast.error("Por favor, selecione pelo menos uma estrela para avaliar.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicoId: servico?.id,
          estrelas,
          comentario,
        }),
      });
      if (!response.ok) throw new Error("Falha ao enviar avaliação.");
      
      const novaAvaliacao = await response.json();
      setAvaliacaoExistente(novaAvaliacao);
      toast.success("Obrigado pela sua avaliação!");
    } catch (error) {
      toast.error("Ocorreu um erro ao enviar sua avaliação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen w-full bg-secondary flex-col items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-2">Carregando...</p>
      </main>
    );
  }

  if (!servico) {
    return (
      <main className="flex min-h-screen w-full bg-secondary flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Serviço Não Encontrado</h1>
        <p className="text-muted-foreground mt-2">O link que você acessou parece ser inválido.</p>
      </main>
    );
  }

  const fotos = Array.isArray(servico.fotos) ? (servico.fotos as string[]) : [];

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex justify-center mb-6">
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
            <CardTitle className="text-2xl sm:text-3xl">Detalhes do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-lg border bg-background p-4 space-y-3">
              <h3 className="font-semibold text-lg">Informações do Veículo</h3>
              <div className="flex items-center gap-3 text-muted-foreground"><User className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.cliente.nome}</span></div>
              <div className="flex items-center gap-3 text-muted-foreground"><Car className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.carro.modelo} - {servico.agendamento.carro.placa || 'Sem placa'}</span></div>
            </div>

            {servico.observacoes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MessageSquareText className="h-5 w-5" />
                  Observações do Serviço
                </h3>
                <div className="rounded-lg border bg-background p-4">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {servico.observacoes}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Fotos do Veículo</h3>
              {fotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {fotos.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md group">
                      <div className="relative aspect-square w-full">
                        <Image 
                          src={url} 
                          alt="Foto do serviço" 
                          fill 
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw" 
                          className="object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Nenhuma foto foi adicionada a este serviço.</p>
              )}
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-lg text-center">Sua Avaliação</h3>
              {avaliacaoExistente ? (
                <div className="rounded-lg border bg-background p-6 text-center">
                  <h4 className="font-medium mb-3">Obrigado por avaliar!</h4>
                  <div className="flex justify-center mb-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`h-7 w-7 ${
                          value <= estrelas ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {comentario && <p className="text-muted-foreground italic">"{comentario}"</p>}
                </div>
              ) : (
                <div className="rounded-lg border bg-background p-6 space-y-4">
                  <p className="text-sm text-center text-muted-foreground">Sua opinião é muito importante para nós!</p>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`h-10 w-10 cursor-pointer transition-colors ${
                          value <= estrelas ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                        }`}
                        onClick={() => setEstrelas(value)}
                      />
                    ))}
                  </div>
                  <Textarea
                    placeholder="Deixe um comentário (opcional)..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleSubmitAvaliacao} disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Avaliação
                  </Button>
                </div>
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
            <br/>
            Desenvolvido por Kaike Souza®
          </p>
        </footer>
      </div>
    </main>
  );
}