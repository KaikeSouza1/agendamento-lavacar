// src/components/AgendamentoForm.tsx

"use client";

// A importação do 'useState' já existia, apenas garantindo que está aqui.
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, PlusCircle, ArrowLeft, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Cliente, Carro } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

// Tipos e Schemas
type ClienteComCarros = Cliente & { carros: Carro[] };
type FormStep = "INITIAL" | "SELECT_CLIENT" | "CREATE_CLIENT" | "SCHEDULE_DETAILS" | "CREATE_CAR";

const formSchema = z.object({
  clienteId: z.number({ required_error: "Selecione um cliente." }),
  carroId: z.string({ required_error: "Selecione um carro." }),
  data: z.date({ required_error: "A data é obrigatória." }),
  horario: z.string().refine((time) => {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }, {
    message: "Hora inválida. Use o formato HH:mm (ex: 09:30).",
  }),
});

const novoClienteSchema = z.object({
  nome: z.string().min(3, "Nome precisa ter pelo menos 3 caracteres."),
  telefone: z.string().optional(),
  modelo: z.string().min(2, "Modelo precisa ter pelo menos 2 caracteres."),
  placa: z.string().min(7, "Placa inválida.").max(8, "Placa inválida."),
});

const novoCarroSchema = z.object({
  modelo: z.string().min(2, "Modelo precisa ter pelo menos 2 caracteres."),
  placa: z.string().min(7, "Placa inválida.").max(8, "Placa inválida."),
});


export function AgendamentoForm({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<FormStep>("INITIAL");
  
  const [clientes, setClientes] = useState<ClienteComCarros[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteComCarros | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ALTERAÇÃO 1: Adicionar estado para controlar o popover do calendário ---
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema) });
  const novoClienteForm = useForm<z.infer<typeof novoClienteSchema>>({ resolver: zodResolver(novoClienteSchema) });
  const novoCarroForm = useForm<z.infer<typeof novoCarroSchema>>({ resolver: zodResolver(novoCarroSchema) });

  const buscarClientes = useCallback(async () => {
    try {
      const response = await fetch(`/api/clientes`);
      if (!response.ok) throw new Error("Erro ao buscar clientes.");
      const data = await response.json();
      setClientes(data);
    } catch (error) { 
        toast.error("Erro ao carregar a lista de clientes."); 
    }
  }, []);

  useEffect(() => {
    if (step === "SELECT_CLIENT") {
      buscarClientes();
    }
  }, [step, buscarClientes]);
  
  const handleSelectCliente = (cliente: ClienteComCarros) => {
    form.setValue("clienteId", cliente.id);
    setSelectedCliente(cliente);
    setStep("SCHEDULE_DETAILS");
  };

  async function onSaveNewCliente(values: z.infer<typeof novoClienteSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      
      const novoCliente: ClienteComCarros = await response.json();
      toast.success(`Cliente ${novoCliente.nome} cadastrado!`);
      
      novoClienteForm.reset();
      handleSelectCliente(novoCliente);
    } catch (error: any) { 
        toast.error(error.message); 
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onSaveNewCar(values: z.infer<typeof novoCarroSchema>) {
    if (!selectedCliente) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/carros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelo: values.modelo,
          placa: values.placa,
          clienteId: selectedCliente.id,
        }),
      });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      
      const novoCarro: Carro = await response.json();
      toast.success(`Carro ${novoCarro.modelo} cadastrado para ${selectedCliente.nome}!`);
      
      setSelectedCliente(prev => prev ? { ...prev, carros: [...prev.carros, novoCarro] } : null);
      
      form.setValue("carroId", novoCarro.id.toString()); 
      novoCarroForm.reset();
      setStep("SCHEDULE_DETAILS");
      buscarClientes(); 
    } catch (error: any) { 
        toast.error(error.message); 
    } finally {
        setIsSubmitting(false);
    }
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const [horas, minutos] = values.horario.split(':').map(Number);
    
    const dataHoraFinal = new Date(values.data);
    dataHoraFinal.setHours(horas, minutos, 0, 0);

    try {
      const response = await fetch('/api/agendamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clienteId: values.clienteId, carroId: parseInt(values.carroId), data_hora: dataHoraFinal.toISOString() }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.message); }
      toast.success(`Agendamento salvo com sucesso!`);
      onSuccess();
    } catch (error: any) { 
        toast.error(error.message); 
    } finally { 
        setIsSubmitting(false); 
    }
  }

  const filteredClientes = clientes.filter(cliente => 
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="transition-all duration-300">
      {step === "INITIAL" && (
        <div className="space-y-4 pt-4">
          <Button variant="outline" className="w-full h-12 text-base" onClick={() => setStep("SELECT_CLIENT")}>
            Buscar Cliente Existente
          </Button>
          <Button className="w-full h-12 text-base" onClick={() => setStep("CREATE_CLIENT")}>
            <PlusCircle className="mr-2 h-5 w-5" />
            Cadastrar Novo Cliente
          </Button>
        </div>
      )}

      {step === "SELECT_CLIENT" && (
        <div>
          <Button variant="ghost" onClick={() => setStep("INITIAL")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="relative mb-4">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
             <Input 
                placeholder="Buscar por nome..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredClientes.length > 0 ? (
                filteredClientes.map(cliente => (
                    <Card key={cliente.id} className="cursor-pointer hover:bg-accent" onClick={() => handleSelectCliente(cliente)}>
                        <CardContent className="p-3">
                            <p className="font-semibold">{cliente.nome}</p>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum cliente encontrado.</p>
            )}
          </div>
        </div>
      )}

      {step === "CREATE_CLIENT" && (
        <div>
            <Button variant="ghost" onClick={() => setStep("INITIAL")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Form {...novoClienteForm}>
                <form onSubmit={novoClienteForm.handleSubmit(onSaveNewCliente)} className="space-y-4">
                    <FormField control={novoClienteForm.control} name="nome" render={({field}) => (<FormItem><FormLabel>Nome do Cliente</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoClienteForm.control} name="telefone" render={({field}) => (<FormItem><FormLabel>Telefone (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <p className="font-medium text-sm pt-2">Dados do Primeiro Carro</p>
                    <FormField control={novoClienteForm.control} name="modelo" render={({field}) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoClienteForm.control} name="placa" render={({field}) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar e Continuar'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
      )}

      {step === "CREATE_CAR" && selectedCliente && (
        <div>
            <Button variant="ghost" onClick={() => setStep("SCHEDULE_DETAILS")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Card className="mb-6">
                <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-bold text-lg">{selectedCliente.nome}</p>
                </CardContent>
            </Card>
            <h2 className="text-xl font-bold mb-4">Cadastrar Novo Carro</h2>
            <Form {...novoCarroForm}>
                <form onSubmit={novoCarroForm.handleSubmit(onSaveNewCar)} className="space-y-4">
                    <FormField control={novoCarroForm.control} name="modelo" render={({field}) => (<FormItem><FormLabel>Modelo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={novoCarroForm.control} name="placa" render={({field}) => (<FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} maxLength={8} /></FormControl><FormMessage /></FormItem>)} />
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando Carro...' : 'Salvar Carro'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </div>
      )}

      {step === "SCHEDULE_DETAILS" && selectedCliente && (
        <div>
            <Button variant="ghost" onClick={() => setStep("INITIAL")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Trocar Cliente
            </Button>
            <Card className="mb-6">
                <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-bold text-lg">{selectedCliente.nome}</p>
                </CardContent>
            </Card>

            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control} name="carroId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Carro</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Selecione o carro" /></SelectTrigger></FormControl>
                        <SelectContent>
                            {selectedCliente.carros.map((carro) => (<SelectItem key={carro.id} value={carro.id.toString()}>{carro.modelo} - {carro.placa}</SelectItem>))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                        <div className="flex justify-end pt-2">
                          <Button 
                            type="button" 
                            variant="link" 
                            onClick={() => setStep("CREATE_CAR")} 
                            className="p-0 text-sm h-auto"
                          >
                              <PlusCircle className="mr-1 h-4 w-4" /> Cadastrar Outro Carro
                          </Button>
                        </div>
                    </FormItem>
                )}
                />

                {/* --- ALTERAÇÃO 2: Bloco do Popover do Calendário modificado --- */}
                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data do Agendamento</FormLabel>
                      <Popover modal={true} open={isCalendarOpen} onOpenChange={setCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              setCalendarOpen(false); // Fecha o popover ao selecionar
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setDate(new Date().getDate() - 1))
                            }
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                    control={form.control}
                    name="horario"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Horário</FormLabel>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <FormControl>
                                    <Input
                                        placeholder="HH:mm"
                                        maxLength={5}
                                        className="pl-10"
                                        {...field}
                                    />
                                </FormControl>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Salvando Agendamento...' : 'Salvar Agendamento'}</Button>
            </form>
            </Form>
        </div>
      )}
    </div>
  );
}