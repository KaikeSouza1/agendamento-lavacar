// src/components/ClienteForm.tsx

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Cliente, Carro } from "@prisma/client";
import { toast } from "sonner";
import { Car, Trash2, Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ClienteComCarros = Cliente & { carros: Carro[] };

interface ClienteFormProps {
  cliente: ClienteComCarros | null;
  onSuccess: () => void;
}

// Schema para editar/criar dados do cliente
const clienteSchema = z.object({
  nome: z.string().min(3, "Nome precisa ter pelo menos 3 caracteres."),
  telefone: z.string().optional(),
});

// Schema para adicionar um novo carro
const carroSchema = z.object({
  modelo: z.string().min(2, "Modelo do carro é obrigatório."),
  placa: z.string().optional(),
});

// Schema combinado para criar um novo cliente com seu primeiro carro
const novoClienteSchema = clienteSchema.merge(carroSchema);


export function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const [isSubmittingCliente, setIsSubmittingCliente] = useState(false);
  const [isSubmittingCarro, setIsSubmittingCarro] = useState(false);
  const [carroParaExcluir, setCarroParaExcluir] = useState<Carro | null>(null);

  // Formulário para os dados do CLIENTE (criação e edição)
  const clienteForm = useForm<z.infer<typeof novoClienteSchema>>({
    resolver: zodResolver(cliente ? clienteSchema : novoClienteSchema),
    defaultValues: {
      nome: cliente?.nome || "",
      telefone: cliente?.telefone || "",
      modelo: "",
      placa: "",
    },
  });

  // Formulário SEPARADO apenas para ADICIONAR um novo carro a um cliente existente
  const carroForm = useForm<z.infer<typeof carroSchema>>({
    resolver: zodResolver(carroSchema),
    defaultValues: { modelo: "", placa: "" },
  });


  async function handleClienteSubmit(values: z.infer<typeof novoClienteSchema>) {
    setIsSubmittingCliente(true);
    const url = cliente ? `/api/clientes/${cliente.id}` : '/api/clientes';
    const method = cliente ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Ocorreu um erro.");
      }
      toast.success(`Cliente ${cliente ? 'atualizado' : 'cadastrado'} com sucesso!`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingCliente(false);
    }
  }

  async function handleAddCarroSubmit(values: z.infer<typeof carroSchema>) {
    if (!cliente) return;
    setIsSubmittingCarro(true);
    try {
      const response = await fetch('/api/carros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, clienteId: cliente.id }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao adicionar carro.");
      }
      toast.success("Carro adicionado com sucesso!");
      carroForm.reset();
      onSuccess(); // Recarrega a lista de clientes para mostrar o novo carro
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingCarro(false);
    }
  }
  
  async function handleDeleteCarro() {
    if (!carroParaExcluir) return;
    setIsSubmittingCarro(true); // Reutiliza o estado de loading do formulário de carro
    try {
        const response = await fetch(`/api/carros/${carroParaExcluir.id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Erro ao excluir o carro.");
        }
        toast.success("Carro excluído com sucesso!");
        onSuccess();
    } catch (error: any) {
        toast.error(error.message);
    } finally {
        setCarroParaExcluir(null);
        setIsSubmittingCarro(false);
    }
  }


  return (
    <>
      {/* Formulário Principal: Criar ou Editar Cliente */}
      <Form {...clienteForm}>
        <form onSubmit={clienteForm.handleSubmit(handleClienteSubmit)} className="space-y-4">
          <FormField control={clienteForm.control} name="nome" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Cliente</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={clienteForm.control} name="telefone" render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone (Opcional)</FormLabel>
              <FormControl><Input {...field} placeholder="(99) 99999-9999" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          
          {/* Campos do carro SÓ aparecem se for um NOVO cliente */}
          {!cliente && (
            <>
              <p className="font-medium text-sm pt-2">Dados do Primeiro Carro</p>
              <FormField control={clienteForm.control} name="modelo" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={clienteForm.control} name="placa" render={({ field }) => (<FormItem><FormLabel>Placa (Opcional)</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmittingCliente}>
              {isSubmittingCliente && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmittingCliente ? 'Salvando...' : (cliente ? 'Salvar Alterações do Cliente' : 'Cadastrar Cliente')}
            </Button>
          </DialogFooter>
        </form>
      </Form>

      {/* Seção para gerenciar carros de um cliente EXISTENTE */}
      {cliente && (
        <div className="space-y-6 border-t pt-6">
          <div>
            <h3 className="font-semibold text-base mb-2">Carros Cadastrados</h3>
            <div className="space-y-3 max-h-32 overflow-y-auto pr-2 rounded-lg">
              {cliente.carros.length > 0 ? cliente.carros.map(carro => (
                <div key={carro.id} className="flex items-center justify-between rounded-md border p-3 bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{carro.modelo}</p>
                      {carro.placa && <p className="text-sm text-muted-foreground">{carro.placa}</p>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCarroParaExcluir(carro)} disabled={isSubmittingCarro}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum carro cadastrado.</p>
              )}
            </div>
          </div>
          
          {/* Formulário para adicionar novo carro */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-base">Adicionar Novo Carro</h3>
            <Form {...carroForm}>
              <form onSubmit={carroForm.handleSubmit(handleAddCarroSubmit)} className="space-y-4 mt-2">
                <FormField control={carroForm.control} name="modelo" render={({ field }) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={carroForm.control} name="placa" render={({ field }) => (<FormItem><FormLabel>Placa (Opcional)</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
                <DialogFooter>
                  <Button type="submit" variant="secondary" disabled={isSubmittingCarro}>
                    {isSubmittingCarro && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adicionar Carro
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      )}

      {/* Dialogo de confirmação para excluir carro */}
      <AlertDialog open={!!carroParaExcluir} onOpenChange={() => setCarroParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente o carro <span className="font-bold">{carroParaExcluir?.modelo}</span>.
              Se o carro tiver agendamentos, a exclusão não será permitida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCarro} disabled={isSubmittingCarro}>
                {isSubmittingCarro && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}