"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Dashboard from "@/components/Dashboard";
import { SeletorDataAgenda } from "@/components/SeletorDataAgenda";
import ListaAgendamentosDia from "@/components/ListaAgendamentosDia";
import { AgendamentoForm } from "@/components/AgendamentoForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListaServicos } from "@/components/ListaServicos";
import { Cliente, Carro } from "@prisma/client";
import { toast } from "sonner";

// Tipos atualizados para refletir o novo schema do banco de dados
export type AgendamentoComClienteECarro = {
  id: number;
  data_hora: string;
  cliente: Cliente;
  carro: Carro;
};

export type AgendamentoEvent = {
  title: string | undefined;
  start: Date | undefined;
  end: Date | undefined;
  resource: number;
  cliente: Cliente;
  carro: Carro;
};

interface DashboardData {
  agendamentosHoje: number;
  proximoCliente: {
    nome: string;
    horario: Date;
  } | null;
}

export default function Home() {
  const [modalAberto, setModalAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<AgendamentoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendamentoParaEditar, setAgendamentoParaEditar] = useState<AgendamentoEvent | null>(null);

  const [dashboardData, setDashboardData] = useState<DashboardData>({
    agendamentosHoje: 0,
    proximoCliente: null,
  });
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const buscarDadosDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const buscarTodosAgendamentos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/agendamentos');
      if (!response.ok) throw new Error("Falha ao buscar agendamentos");
      
      const data: AgendamentoComClienteECarro[] = await response.json();
      
      // Mapeia os dados da API para o formato que o componente espera
      const eventosFormatados: AgendamentoEvent[] = data.map((ag) => ({
        title: ag.cliente.nome,
        start: new Date(ag.data_hora),
        end: new Date(new Date(ag.data_hora).getTime() + 60 * 60 * 1000),
        resource: ag.id,
        cliente: ag.cliente,
        carro: ag.carro,
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
    buscarDadosDashboard();
  }, [buscarTodosAgendamentos, buscarDadosDashboard]);

  const handleSuccess = () => {
    setModalAberto(false);
    setAgendamentoParaEditar(null);
    buscarTodosAgendamentos();
    buscarDadosDashboard();
  };

  const handleOpenNewModal = () => {
    setAgendamentoParaEditar(null);
    setModalAberto(true);
  };
  
  const handleOpenEditModal = (agendamento: AgendamentoEvent) => {
    // A funcionalidade de edição foi desativada temporariamente pois o novo formulário é complexo.
    // Isso evita bugs enquanto não implementamos a edição.
    toast.info("A edição de agendamentos será implementada em breve.");
    // setAgendamentoParaEditar(agendamento);
    // setModalAberto(true);
  };

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <Image
            src="/logobarber.png" // Lembre-se de trocar para a logo do lava-car depois
            alt="Logo do Lava-car"
            width={250} 
            height={70} 
            priority
          />

          <Button onClick={handleOpenNewModal} className="w-full sm:w-auto text-lg">
            Novo Agendamento
          </Button>
        </div>

        <Tabs defaultValue="agendamentos" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="agendamentos">Agenda</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>
          
          <TabsContent value="agendamentos">
            <Accordion type="single" collapsible className="w-full bg-card rounded-xl border shadow-sm px-6 my-6">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold">
                  Resumo do Dia
                </AccordionTrigger>
                <AccordionContent>
                  <Dashboard data={dashboardData} loading={loadingDashboard} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
        </Tabs>
      </div>

      <Dialog open={modalAberto} onOpenChange={(isOpen: boolean) => {
        if (!isOpen) setAgendamentoParaEditar(null);
        setModalAberto(isOpen);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{agendamentoParaEditar ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
          </DialogHeader>
          <AgendamentoForm 
            onSuccess={handleSuccess} 
            // A prop agendamentoInicial foi removida pois o novo form não a utiliza ainda
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}