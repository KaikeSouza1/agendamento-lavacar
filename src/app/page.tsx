"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SeletorDataAgenda } from "@/components/SeletorDataAgenda";
import ListaAgendamentosDia from "@/components/ListaAgendamentosDia";
import { AgendamentoForm } from "@/components/AgendamentoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaServicos } from "@/components/ListaServicos";
import { Cliente, Carro, Servico } from "@prisma/client";
import { toast } from "sonner";
import { DashboardCompleto } from "@/components/DashboardCompleto";

export type AgendamentoComDadosCompletos = {
  id: number;
  data_hora: string;
  cliente: Cliente;
  carro: Carro;
  servico: Servico | null;
};

export type AgendamentoEvent = {
  title: string | undefined;
  start: Date | undefined;
  end: Date | undefined;
  resource: number;
  cliente: Cliente;
  carro: Carro;
  servico: Servico | null;
};

export default function Home() {
  const [modalAberto, setModalAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<AgendamentoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoEvent | null>(null);

  const buscarTodosAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agendamentos');
      if (!response.ok) throw new Error("Falha ao buscar agendamentos");
      
      const data: AgendamentoComDadosCompletos[] = await response.json();
      
      const eventosFormatados: AgendamentoEvent[] = data.map((ag) => ({
        title: ag.cliente.nome,
        start: new Date(ag.data_hora),
        end: new Date(new Date(ag.data_hora).getTime() + 60 * 60 * 1000),
        resource: ag.id,
        cliente: ag.cliente,
        carro: ag.carro,
        servico: ag.servico,
      }));
      setAgendamentos(eventosFormatados);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buscarTodosAgendamentos();
  }, [buscarTodosAgendamentos]);

  const handleSuccess = () => {
    setModalAberto(false);
    setAgendamentoParaEditar(null);
    buscarTodosAgendamentos();
  };

  const handleOpenNewModal = () => {
    setAgendamentoParaEditar(null);
    setModalAberto(true);
  };
  
  const handleOpenEditModal = (agendamento: AgendamentoEvent) => {
    toast.info("A edição de agendamentos será implementada em breve.");
  };

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Image
            src="/logobarber.png"
            alt="Logo da Garage Wier"
            width={250} 
            height={70} 
            priority
            style={{ height: 'auto' }}
          />
          <Button onClick={handleOpenNewModal} className="w-full sm:w-auto text-lg">
            Novo Agendamento
          </Button>
        </div>

        {/* ✅ AJUSTE: defaultValue mudado para "agendamentos" */}
        <Tabs defaultValue="agendamentos" className="w-full">
          {/* ✅ AJUSTE: Ordem das abas alterada */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agendamentos">Agenda</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agendamentos">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
              <div className="lg:col-span-1 flex flex-col gap-6">
                <SeletorDataAgenda 
                  dataSelecionada={dataSelecionada} 
                  onDataChange={(date) => date && setDataSelecionada(date)} 
                />
              </div>
              <div className="lg:col-span-2">
                <ListaAgendamentosDia 
                  dataSelecionada={dataSelecionada} 
                  agendamentos={agendamentos}
                  onDataChange={setDataSelecionada}
                  loading={loading}
                  onEdit={handleOpenEditModal}
                  onDeleteSuccess={handleSuccess}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="servicos">
            <ListaServicos />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardCompleto />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={modalAberto} onOpenChange={(isOpen: boolean) => {
        if (!isOpen) setAgendamentoParaEditar(null);
        setModalAberto(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{agendamentoParaEditar ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
            <DialogDescription>Preencha os dados abaixo para criar ou editar um agendamento.</DialogDescription>
          </DialogHeader>
          <AgendamentoForm 
            onSuccess={handleSuccess} 
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}