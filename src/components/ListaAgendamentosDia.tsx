// src/components/ListaAgendamentosDia.tsx

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, isSameDay, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AgendamentoEvent } from '../app/page';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ListaAgendamentosDiaProps {
  agendamentos: AgendamentoEvent[];
  dataSelecionada: Date;
  onDataChange: (novaData: Date) => void;
  loading: boolean;
  onEdit: (agendamento: AgendamentoEvent) => void;
  onDeleteSuccess: () => void;
}

export default function ListaAgendamentosDia({ agendamentos, dataSelecionada, onDataChange, loading, onEdit, onDeleteSuccess }: ListaAgendamentosDiaProps) {
  const [agendamentoParaDeletar, setAgendamentoParaDeletar] = useState<AgendamentoEvent | null>(null);
  const router = useRouter();
  
  const agendamentosDoDia = agendamentos.filter(ag => ag.start && isSameDay(ag.start, dataSelecionada)).sort((a, b) => a.start!.getTime() - b.start!.getTime());

  const handlePreviousDay = () => onDataChange(subDays(dataSelecionada, 1));
  const handleNextDay = () => onDataChange(addDays(dataSelecionada, 1));
  const handleToday = () => onDataChange(new Date());

  const handleIniciarServico = async (agendamentoId: number) => {
    try {
      const response = await fetch('/api/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendamentoId }),
      });

      if (!response.ok) throw new Error('Falha ao iniciar serviço');

      const servico = await response.json();
      toast.success("Serviço iniciado! Redirecionando...");
      router.push(`/servicos/${servico.id}`);
    } catch (error) {
      console.error("Erro ao iniciar serviço:", error);
      toast.error("Oops! Algo deu errado ao iniciar o serviço.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!agendamentoParaDeletar) return;
    try {
      const response = await fetch(`/api/agendamentos/${agendamentoParaDeletar.resource}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Falha ao deletar');
      
      toast.success(`Agendamento de ${agendamentoParaDeletar.cliente.nome} foi deletado.`);
      onDeleteSuccess();
    } catch (error) {
      console.error("Falha ao deletar agendamento", error);
      toast.error("Oops! Algo deu errado ao deletar.");
    } finally {
      setAgendamentoParaDeletar(null);
    }
  };

  return (
    <>
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl text-foreground"><CalendarDays className="h-6 w-6" /><span>{format(dataSelecionada, "eeee, dd 'de' MMMM", { locale: ptBR })}</span></CardTitle>
              <div className="flex space-x-2"><Button variant="outline" onClick={handleToday}>Hoje</Button><Button variant="outline" size="icon" onClick={handlePreviousDay}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={handleNextDay}><ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : agendamentosDoDia.length > 0 ? (
            <ul className="space-y-3">
              {agendamentosDoDia.map(ag => (
                <li key={ag.resource} className="flex items-center justify-between rounded-lg bg-secondary p-4 transition-colors hover:bg-accent">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-primary w-20 text-center">{format(ag.start!, 'HH:mm')}</span>
                    <div className="flex flex-col">
                      {/* CORRIGIDO AQUI */}
                      <span className="text-foreground text-lg font-medium">{ag.cliente.nome}</span>
                      <span className="text-muted-foreground text-sm">{ag.carro.modelo} {ag.carro.placa && `- ${ag.carro.placa}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="icon" className="h-9 w-9" onClick={() => handleIniciarServico(ag.resource)}><Play className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => onEdit(ag)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setAgendamentoParaDeletar(ag)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center text-muted-foreground py-16"><p>Nenhum agendamento para este dia.</p></div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!agendamentoParaDeletar} onOpenChange={() => setAgendamentoParaDeletar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {/* CORRIGIDO AQUI */}
              Esta ação não pode ser desfeita. Isso irá deletar permanentemente o agendamento de <span className="font-bold">{agendamentoParaDeletar?.cliente.nome}</span> para o carro <span className="font-bold">{agendamentoParaDeletar?.carro.modelo}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteConfirm}>Continuar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}