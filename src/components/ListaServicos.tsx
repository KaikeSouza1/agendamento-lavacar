// src/components/ListaServicos.tsx

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Agendamento, Servico, Cliente, Carro } from '@prisma/client';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Wrench, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type ServicoComAgendamento = Servico & {
    agendamento: Agendamento & {
        cliente: Cliente;
        carro: Carro;
    }
};

export function ListaServicos() {
    const [servicos, setServicos] = useState<ServicoComAgendamento[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchServicos = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/servicos');
                if (!response.ok) throw new Error("Falha ao buscar serviços");
                const data = await response.json();
                setServicos(data);
            } catch (error) {
                toast.error("Não foi possível carregar a lista de serviços.");
            } finally {
                setLoading(false);
            }
        };

        fetchServicos();
    }, []);

    const servicosEmAndamento = servicos.filter(s => s.status === 'Em Andamento');
    const servicosConcluidos = servicos.filter(s => s.status === 'Concluído');

    if (loading) { /* ... (tela de loading não muda) */ }

    return (
        <div className="space-y-8 mt-6">
            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Em Andamento ({servicosEmAndamento.length})
                </h2>
                {servicosEmAndamento.length > 0 ? (
                    <div className="space-y-4">
                        {servicosEmAndamento.map(servico => (
                            <Card key={servico.id} className="cursor-pointer hover:border-primary" onClick={() => router.push(`/servicos/${servico.id}`)}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">{servico.agendamento.carro.modelo}</p>
                                        <p className="text-sm text-muted-foreground">{servico.agendamento.cliente.nome}</p>
                                    </div>
                                    <p className="text-sm">Iniciado às {servico.iniciado_em ? format(new Date(servico.iniciado_em), 'HH:mm') : ''}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Nenhum serviço em andamento.</p>
                )}
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    Concluídos ({servicosConcluidos.length})
                </h2>
                {servicosConcluidos.length > 0 ? (
                     <div className="space-y-4">
                        {servicosConcluidos.map(servico => (
                            <Card key={servico.id} className="cursor-pointer hover:border-primary opacity-70" onClick={() => router.push(`/servicos/${servico.id}`)}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-lg">{servico.agendamento.carro.modelo}</p>
                                        <p className="text-sm text-muted-foreground">{servico.agendamento.cliente.nome}</p>
                                    </div>
                                    {/* ÁREA MODIFICADA PARA MOSTRAR O VALOR */}
                                    <div className="text-right">
                                        {servico.valor && (
                                            <p className="font-bold text-lg text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(servico.valor))}
                                            </p>
                                        )}
                                        <p className="text-sm">Finalizado às {servico.finalizado_em ? format(new Date(servico.finalizado_em), 'HH:mm') : ''}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">Nenhum serviço concluído hoje.</p>
                )}
            </div>
        </div>
    );
}