// src/components/ListaAvaliacoes.tsx
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Avaliacao, Servico, Agendamento, Cliente, Carro } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AvaliacaoCompleta = Avaliacao & {
  servico: Servico & {
    agendamento: Agendamento & {
      cliente: Cliente;
      carro: Carro;
    };
  };
};

export function ListaAvaliacoes() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCompleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvaliacoes() {
      try {
        const response = await fetch('/api/avaliacoes/all');
        if (!response.ok) throw new Error("Falha ao buscar avaliações");
        const data = await response.json();
        setAvaliacoes(data);
      } catch (error) {
        toast.error("Não foi possível carregar as avaliações.");
      } finally {
        setLoading(false);
      }
    }
    fetchAvaliacoes();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
        <h2 className="text-2xl font-bold">Avaliações dos Clientes</h2>
        {avaliacoes.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {avaliacoes.map(avaliacao => (
                    <Card key={avaliacao.id}>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>{avaliacao.servico.agendamento.cliente.nome}</span>
                                <div className="flex items-center gap-1 text-yellow-400">
                                    <Star className="h-5 w-5 fill-current" />
                                    <span className="font-bold text-lg">{avaliacao.estrelas}</span>
                                </div>
                            </CardTitle>
                            <CardDescription>
                                {avaliacao.servico.agendamento.carro.modelo} - {format(new Date(avaliacao.criado_em), "dd/MM/yyyy", { locale: ptBR })}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">"{avaliacao.comentario || 'Nenhum comentário.'}"</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma avaliação recebida ainda.</p>
        )}
    </div>
  )
}