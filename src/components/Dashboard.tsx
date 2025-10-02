// src/components/Dashboard.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Interface simplificada
interface DashboardData {
  agendamentosHoje: number;
  proximoCliente: {
    nome: string;
    horario: Date;
  } | null;
}

interface DashboardProps {
  data: DashboardData;
  loading: boolean;
}

export default function Dashboard({ data, loading }: DashboardProps) {

  const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  const proximoClienteInfo = data.proximoCliente
    ? `${data.proximoCliente.nome} às ${format(new Date(data.proximoCliente.horario), "HH:mm")}`
    : "Nenhum próximo cliente";

  if (loading) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardTitle>Carregando...</CardTitle></CardHeader></Card>
        </div>
    );
  }

  // Layout ajustado para 2 colunas
  return (
    <div className="grid gap-4 md:grid-cols-2 mb-6">
      <StatCard title="Agendamentos Hoje" value={data.agendamentosHoje} icon={Calendar} />
      <StatCard title="Próximo Cliente" value={proximoClienteInfo} icon={Clock} />
    </div>
  );
}