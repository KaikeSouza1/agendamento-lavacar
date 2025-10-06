// src/components/ListaClientes.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { Cliente, Carro } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ClienteForm } from "./ClienteForm";
import { toast } from "sonner";
import { User, Car, PlusCircle, Search } from 'lucide-react';
import { Skeleton } from "./ui/skeleton";

type ClienteComCarros = Cliente & { carros: Carro[] };

export default function ListaClientes() {
  const [clientes, setClientes] = useState<ClienteComCarros[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteComCarros | null>(null);

  const buscarClientes = useCallback(async () => {
    setLoading(true);
    try {
      // Adicionado um debounce manual simples para não buscar a cada tecla digitada
      const timer = setTimeout(async () => {
        const response = await fetch(`/api/clientes?nome=${searchTerm}`);
        if (!response.ok) throw new Error("Erro ao buscar clientes.");
        const data = await response.json();
        setClientes(data);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    } catch (error) {
      toast.error("Erro ao carregar a lista de clientes.");
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    buscarClientes();
  }, [buscarClientes]);

  const handleOpenModal = (cliente: ClienteComCarros | null) => {
    setClienteSelecionado(cliente);
    setModalAberto(true);
  };

  const handleSuccess = () => {
    setModalAberto(false);
    setClienteSelecionado(null);
    buscarClientes();
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente por nome..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => handleOpenModal(null)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-5 w-5" />
          Novo Cliente
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clientes.map((cliente) => (
            <Card key={cliente.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleOpenModal(cliente)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {cliente.nome}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{cliente.carros.length} carro(s) cadastrado(s)</p>
                  {cliente.carros.slice(0, 2).map((carro) => (
                    <div key={carro.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{carro.modelo} {carro.placa && `- ${carro.placa}`}</span>
                    </div>
                  ))}
                   {cliente.carros.length > 2 && <p className="text-xs text-muted-foreground">+ {cliente.carros.length - 2} outro(s)...</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{clienteSelecionado ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
            <DialogDescription>
              {clienteSelecionado ? 'Edite as informações do cliente e gerencie seus carros.' : 'Preencha os dados para cadastrar um novo cliente e seu primeiro carro.'}
            </DialogDescription>
          </DialogHeader>
          <ClienteForm cliente={clienteSelecionado} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
}