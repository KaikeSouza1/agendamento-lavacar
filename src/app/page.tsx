// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { SeletorDataAgenda } from "@/components/SeletorDataAgenda";
import ListaAgendamentosDia from "@/components/ListaAgendamentosDia";
import { AgendamentoForm } from "@/components/AgendamentoForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ListaServicos } from "@/components/ListaServicos";
import { Cliente, Carro, Servico } from "@prisma/client";
import { DashboardCompleto } from "@/components/DashboardCompleto";
import ListaClientes from "@/components/ListaClientes";
import { ListaAvaliacoes } from "@/components/ListaAvaliacoes";
import { Anotacoes } from "@/components/Anotacoes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Wrench,
  LayoutDashboard,
  Users,
  Star,
  Notebook,
} from "lucide-react";

export type ClienteComCarros = Cliente & { carros: Carro[] };

export type AgendamentoComDadosCompletos = {
  id: number;
  data_hora: string;
  cliente: ClienteComCarros;
  carro: Carro;
  servico: Servico | null;
};

export type AgendamentoEvent = {
  title: string | undefined;
  start: Date | undefined;
  end: Date | undefined;
  resource: number;
  cliente: ClienteComCarros;
  carro: Carro;
  servico: Servico | null;
};

const navItems = [
  { name: "Agenda", href: "agendamentos", icon: Calendar },
  { name: "Serviços", href: "servicos", icon: Wrench },
  { name: "Dashboard", href: "dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "clientes", icon: Users },
  { name: "Avaliações", href: "avaliacoes", icon: Star },
  { name: "Anotações", href: "anotacoes", icon: Notebook },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("agendamentos");
  const [modalAberto, setModalAberto] = useState(false);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [agendamentos, setAgendamentos] = useState<AgendamentoEvent[]>([]);
  const [loadingAgendamentos, setLoadingAgendamentos] = useState(true);
  const [agendamentoParaEditar, setAgendamentoParaEditar] =
    useState<AgendamentoEvent | null>(null);

  const buscarTodosAgendamentos = useCallback(async () => {
    setLoadingAgendamentos(true);
    try {
      const response = await fetch("/api/agendamentos");
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
      setLoadingAgendamentos(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "agendamentos") {
      buscarTodosAgendamentos();
    }
  }, [activeTab, buscarTodosAgendamentos]);

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
    setAgendamentoParaEditar(agendamento);
    setModalAberto(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "agendamentos":
        return (
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
                loading={loadingAgendamentos}
                onEdit={handleOpenEditModal}
                onDeleteSuccess={handleSuccess}
              />
            </div>
          </div>
        );
      case "servicos":
        return <ListaServicos />;
      case "dashboard":
        return <DashboardCompleto />;
      case "clientes":
        return <ListaClientes />;
      case "avaliacoes":
        return <ListaAvaliacoes />;
      case "anotacoes":
        return <Anotacoes />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid min-h-screen w-full lg:grid-cols-[280px_1fr]">
        {/* SIDEBAR */}
        <div className="hidden border-r bg-card lg:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-20 items-center border-b px-6">
              <Image
                src="/logobarber.png"
                alt="Logo da Garage Wier"
                width={180}
                height={50}
                priority
              />
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-4 text-sm font-medium">
                {navItems.map(({ name, href, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => setActiveTab(href)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-foreground transition-all hover:bg-accent ${
                      activeTab === href ? "bg-accent font-semibold" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex flex-col">
          {/* ✅ HEADER AJUSTADO */}
          <header className="flex h-auto items-center gap-4 border-b bg-card px-4 sm:px-6 justify-between flex-wrap py-4">
            <div className="lg:hidden flex-shrink mx-auto">
  <Image
    src="/logobarber.png"
    alt="Logo da Garage Wier"
    width={130}
    height={40}
    priority
    style={{ height: "auto" }}
  />
</div>


            <div className="hidden lg:flex-grow"></div>

            <div className="w-full lg:w-auto mt-2 lg:mt-0 flex justify-end">
              <Button
                onClick={handleOpenNewModal}
                size="lg"
                className="h-12 text-base px-6 w-full sm:w-auto"
              >
                Novo Agendamento
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-secondary">
            {/* MENU DROPDOWN NO MOBILE */}
            <div className="lg:hidden mb-6">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione uma seção" />
                </SelectTrigger>
                <SelectContent>
                  {navItems.map(({ name, href, icon: Icon }) => (
                    <SelectItem
                      key={href}
                      value={href}
                      className="py-3 text-base"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* CONTEÚDO DA ABA */}
            {renderContent()}
          </main>
        </div>
      </div>

      {/* MODAL DE AGENDAMENTO */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {agendamentoParaEditar
                ? "Editar Agendamento"
                : "Novo Agendamento"}
            </DialogTitle>
            <DialogDescription>
              {agendamentoParaEditar
                ? "Altere os dados do agendamento."
                : "Preencha para criar um novo agendamento."}
            </DialogDescription>
          </DialogHeader>
          <AgendamentoForm
            agendamentoParaEditar={agendamentoParaEditar}
            onSuccess={handleSuccess}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
