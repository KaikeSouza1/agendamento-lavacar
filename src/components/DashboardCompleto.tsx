// src/components/DashboardCompleto.tsx

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, BarChart, Users, Activity, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardData {
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  totalServicosHoje: number;
  totalServicosSemana: number;
  totalServicosMes: number;
  atividadesRecentes: {
    id: number;
    nomeCliente: string;
    modeloCarro: string;
    valor: number;
    finalizado_em: Date | null;
  }[];
}

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: React.ElementType, description?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DashboardCompleto() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard/full');
        if (!response.ok) throw new Error("Falha ao buscar dados.");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6 mt-6">
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
         </div>
         <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          title="Faturamento (Hoje)" 
          value={formatCurrency(data.faturamentoHoje)} 
          icon={DollarSign}
          description={`${data.totalServicosHoje} serviços hoje`}
        />
        <StatCard 
          title="Faturamento (Semana)" 
          value={formatCurrency(data.faturamentoSemana)} 
          icon={DollarSign}
          description={`${data.totalServicosSemana} serviços na semana`}
        />
        <StatCard 
          title="Faturamento (Mês)" 
          value={formatCurrency(data.faturamentoMes)} 
          icon={DollarSign}
          description={`${data.totalServicosMes} serviços no mês`}
        />
      </div>
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity /> Atividades Recentes</CardTitle>
            <CardDescription>Os últimos 5 serviços concluídos.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {data.atividadesRecentes.length > 0 ? data.atividadesRecentes.map(servico => (
                    <div key={servico.id} className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="font-medium">{servico.nomeCliente}</p>
                            <p className="text-sm text-muted-foreground">{servico.modeloCarro}</p>
                        </div>
                        <div className="text-right">
                           <p className="font-semibold text-green-600">{formatCurrency(servico.valor)}</p>
                           <p className="text-xs text-muted-foreground">{format(new Date(servico.finalizado_em!), "dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-muted-foreground py-4">Nenhuma atividade recente encontrada.</p>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}