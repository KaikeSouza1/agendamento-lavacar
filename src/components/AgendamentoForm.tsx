// src/components/AgendamentoForm.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Cliente, Carro } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandDialog } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Tipos e Schemas
type ClienteComCarros = Cliente & { carros: Carro[] };
const formSchema = z.object({
  clienteId: z.number({ required_error: "Selecione um cliente." }),
  carroId: z.string({ required_error: "Selecione um carro." }),
  data: z.date({ required_error: "A data é obrigatória." }),
});
const novoClienteSchema = z.object({
    nome: z.string().min(3, "Nome precisa ter pelo menos 3 letras."),
    telefone: z.string().optional(),
    modelo: z.string().min(2, "Modelo precisa ter pelo menos 2 letras."),
    placa: z.string().min(7, "Placa inválida.").max(8, "Placa inválida."),
});
const novoCarroSchema = z.object({
    modelo: z.string().min(2, "Modelo precisa ter pelo menos 2 letras."),
    placa: z.string().min(7, "Placa inválida.").max(8, "Placa inválida."),
});

const horariosDisponiveis = Array.from({ length: 28 }, (_, i) => {
    const hora = Math.floor(i / 2) + 8;
    const minuto = i % 2 === 0 ? '00' : '30';
    return `${hora.toString().padStart(2, '0')}:${minuto}`;
});

export function AgendamentoForm({ onSuccess }: { onSuccess: () => void; agendamentoInicial?: any }) {
  const [clientes, setClientes] = useState<ClienteComCarros[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteComCarros | null>(null);
  
  const [openClienteSearch, setOpenClienteSearch] = useState(false);
  const [openNovoCliente, setOpenNovoCliente] = useState(false);
  const [openNovoCarro, setOpenNovoCarro] = useState(false);

  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });
  const novoClienteForm = useForm<z.infer<typeof novoClienteSchema>>({ resolver: zodResolver(novoClienteSchema) });
  const novoCarroForm = useForm<z.infer<typeof novoCarroSchema>>({ resolver: zodResolver(novoCarroSchema) });

  const buscarClientes = useCallback(async (busca: string = "") => {
    try {
      const response = await fetch(`/api/clientes?nome=${busca}`);
      const data = await response.json();
      setClientes(data);
      return data;
    } catch (error) { toast.error("Erro ao buscar clientes."); return []; }
  }, []);

  const handleSelectCliente = (cliente: ClienteComCarros) => {
    form.setValue("clienteId", cliente.id);
    setSelectedCliente(cliente);
    form.resetField("carroId");
    setOpenClienteSearch(false);
  };
  
  async function onSaveNewCliente(values: z.infer<typeof novoClienteSchema>) {
    try {
      const response = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      
      const novoCliente: ClienteComCarros = await response.json();
      toast.success(`Cliente ${novoCliente.nome} cadastrado!`);
      
      await buscarClientes();
      handleSelectCliente(novoCliente);
      novoClienteForm.reset();
      setOpenNovoCliente(false);
    } catch (error: any) { toast.error(error.message); }
  }

  async function onSaveNewCarro(values: z.infer<typeof novoCarroSchema>) {
    if (!selectedCliente) return;
    try {
        const response = await fetch('/api/carros', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({...values, clienteId: selectedCliente.id})});
        if (!response.ok) throw new Error("Erro ao salvar carro.");
        
        const novoCarro = await response.json();
        toast.success(`Carro ${novoCarro.modelo} adicionado!`);

        const responseCliente = await fetch(`/api/clientes?nome=${selectedCliente.nome}`);
        const clienteAtualizado = (await responseCliente.json())[0];
        setSelectedCliente(clienteAtualizado);
        
        form.setValue("carroId", novoCarro.id.toString());
        
        novoCarroForm.reset();
        setOpenNovoCarro(false);
    } catch (error: any) { toast.error(error.message); }
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!horaSelecionada) { toast.error("Selecione um horário."); return; }
    setIsSubmitting(true);
    const [horas, minutos] = horaSelecionada.split(':').map(Number);
    const dataHoraFinal = new Date(values.data);
    dataHoraFinal.setHours(horas, minutos, 0, 0);

    try {
      const response = await fetch('/api/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clienteId: values.clienteId, carroId: parseInt(values.carroId), data_hora: dataHoraFinal.toISOString() }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      toast.success(`Agendamento salvo com sucesso!`);
      onSuccess();
    } catch (error: any) { toast.error(error.message); } finally { setIsSubmitting(false); }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormItem className="flex flex-col">
            <FormLabel>Cliente</FormLabel>
            <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setOpenClienteSearch(true)}>
              {selectedCliente ? selectedCliente.nome : "Selecione ou busque um cliente"}
            </Button>
            {form.formState.errors.clienteId && <FormMessage>{form.formState.errors.clienteId.message}</FormMessage>}
          </FormItem>

          {selectedCliente && (
            <FormField
              control={form.control} name="carroId" render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center">
                    <FormLabel>Carro</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setOpenNovoCarro(true)}><PlusCircle className="h-4 w-4 mr-2"/>Adicionar Carro</Button>
                  </div>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o carro" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {selectedCliente.carros.map((carro) => (<SelectItem key={carro.id} value={carro.id.toString()}>{carro.modelo} - {carro.placa}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control} name="data" render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Agendamento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? (format(field.value, "PPP", { locale: ptBR })) : (<span>Escolha uma data</span>)}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus locale={ptBR} />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div>
            <FormLabel>Horário</FormLabel>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {horariosDisponiveis.map(hora => (<Button type="button" variant={horaSelecionada === hora ? "default" : "outline"} key={hora} onClick={() => setHoraSelecionada(hora)}>{hora}</Button>))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Agendamento'}</Button>
        </form>
      </Form>

      {/* DIALOG DE BUSCA DE CLIENTE */}
      <CommandDialog open={openClienteSearch} onOpenChange={setOpenClienteSearch}>
        <CommandInput placeholder="Digite para buscar um cliente..." onValueChange={buscarClientes} />
        <CommandList>
          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
          <CommandGroup>
            <CommandItem onSelect={() => { setOpenClienteSearch(false); setOpenNovoCliente(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar novo cliente
            </CommandItem>
            {clientes.map((cliente) => (
              <CommandItem key={cliente.id} onSelect={() => handleSelectCliente(cliente)}>
                {cliente.nome}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* DIALOG PARA NOVO CLIENTE */}
      <Dialog open={openNovoCliente} onOpenChange={setOpenNovoCliente}>
        <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Novo Cliente</DialogTitle></DialogHeader>
            <Form {...novoClienteForm}>
                <form onSubmit={novoClienteForm.handleSubmit(onSaveNewCliente)} className="space-y-4">
                    <FormField control={novoClienteForm.control} name="nome" render={({field}) => (<FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoClienteForm.control} name="telefone" render={({field}) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <p className="font-medium text-sm pt-2">Dados do Primeiro Carro</p>
                    <FormField control={novoClienteForm.control} name="modelo" render={({field}) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoClienteForm.control} name="placa" render={({field}) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit">Salvar Cliente</Button></DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG PARA NOVO CARRO */}
      <Dialog open={openNovoCarro} onOpenChange={setOpenNovoCarro}>
        <DialogContent>
            <DialogHeader><DialogTitle>Adicionar Novo Carro para {selectedCliente?.nome}</DialogTitle></DialogHeader>
            <Form {...novoCarroForm}>
                <form onSubmit={novoCarroForm.handleSubmit(onSaveNewCarro)} className="space-y-4">
                    <FormField control={novoCarroForm.control} name="modelo" render={({field}) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoCarroForm.control} name="placa" render={({field}) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter><Button type="submit">Salvar Carro</Button></DialogFooter>
                </form>
            </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}