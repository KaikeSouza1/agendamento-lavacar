// src/app/servicos/[id]/page.tsx

"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Agendamento, Servico, Cliente, Carro } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Car, User, Calendar, Tag, Camera, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Interface para combinar os tipos do Prisma
type ServicoComAgendamento = Servico & {
  agendamento: Agendamento & {
    cliente: Cliente;
    carro: Carro;
  };
};

// Itens padrão do checklist
const ITENS_CHECKLIST = [
  "Lavagem Externa",
  "Aspiração Interna",
  "Limpeza de Painel",
  "Limpeza de Vidros",
  "Pretinho nos Pneus",
  "Cera",
];

export default function PaginaServico() {
  const params = useParams();
  const id = params.id as string;
  const [servico, setServico] = useState<ServicoComAgendamento | null>(null);
  const [loading, setLoading] = useState(true);

  // States para os campos do formulário
  const [observacoes, setObservacoes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchServico = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/servicos/${id}`);
      if (!response.ok) throw new Error("Serviço não encontrado");
      const data: ServicoComAgendamento = await response.json();
      setServico(data);
      setObservacoes(data.observacoes || "");

      if (data.checklist && typeof data.checklist === 'object') {
        setChecklist(data.checklist as Record<string, boolean>);
      } else {
        const initialChecklist = ITENS_CHECKLIST.reduce((acc, item) => ({ ...acc, [item]: false }), {});
        setChecklist(initialChecklist);
      }
      
      if (Array.isArray(data.fotos)) {
        setFotos(data.fotos as string[]);
      } else {
        setFotos([]);
      }

    } catch (error) {
      console.error("Erro ao buscar serviço:", error);
      toast.error("Serviço não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
        fetchServico();
    }
  }, [id, fetchServico]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info("Enviando foto...");

    const UPLOAD_PRESET = "upload1";

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET); 

      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no upload");

      const data = await response.json();
      const newFotos = [...fotos, data.secure_url];
      
      setFotos(newFotos);
      
      await handleSave(undefined, newFotos, true);

      toast.success("Foto enviada e salva!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar a foto.");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleChecklistChange = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };
  
  const handleSave = async (novoStatus?: 'Concluído', fotosParaSalvar?: string[], isAutoSave: boolean = false) => {
    try {
      const response = await fetch(`/api/servicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes,
          checklist,
          fotos: fotosParaSalvar || fotos,
          status: novoStatus || servico?.status,
        }),
      });

      if (!response.ok) throw new Error("Falha ao salvar");
      
      if(novoStatus === 'Concluído') {
        toast.success("Serviço finalizado!");
      } else if (!isAutoSave) {
        toast.success("Progresso salvo!");
      }
      
      const updatedServico = await response.json();
      setServico(prev => ({
        ...(prev as ServicoComAgendamento),
        ...updatedServico,
      })); 
      setFotos(Array.isArray(updatedServico.fotos) ? updatedServico.fotos : []);

    } catch (error) {
      toast.error("Erro ao salvar as alterações.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-secondary p-4 sm:p-8">
        <div className="mx-auto max-w-4xl">
           <Skeleton className="h-10 w-40 mb-8" />
           <Skeleton className="h-[600px] w-full" />
        </div>
      </main>
    )
  }

  if (!servico) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-2xl">Serviço não encontrado</h1>
        <Button asChild className="mt-4">
          <Link href="/">Voltar para a Agenda</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Agenda
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">
              Detalhes do Serviço
            </CardTitle>
            <CardDescription>
              {servico.iniciado_em ? `Iniciado em: ${format(new Date(servico.iniciado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}` : 'Serviço pendente de início'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="rounded-lg border bg-background p-4 space-y-3">
                <h3 className="font-semibold text-lg">Informações do Agendamento</h3>
                <div className="flex items-center gap-3 text-muted-foreground"><User className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.cliente.nome}</span></div>
                <div className="flex items-center gap-3 text-muted-foreground"><Car className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.agendamento.carro.modelo} - {servico.agendamento.carro.placa || 'Sem placa'}</span></div>
                <div className="flex items-center gap-3 text-muted-foreground"><Calendar className="h-5 w-5"/> <span className="font-medium text-foreground">{format(new Date(servico.agendamento.data_hora), "eeee, dd/MM 'às' HH:mm", { locale: ptBR })}</span></div>
                <div className="flex items-center gap-3 text-muted-foreground"><Tag className="h-5 w-5"/> <span className="font-medium text-foreground">{servico.status}</span></div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Checklist do Serviço</h3>
              <div className="grid grid-cols-2 gap-4">
                {ITENS_CHECKLIST.map(item => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox id={item} checked={checklist[item] || false} onCheckedChange={() => handleChecklistChange(item)} disabled={servico.status === 'Concluído'} />
                    <Label htmlFor={item} className="text-base cursor-pointer">{item}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
                <h3 className="font-semibold text-lg">Fotos do Veículo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {fotos.map((url) => (
                    <div key={url} className="relative aspect-square w-full overflow-hidden rounded-md">
                      <Image src={url} alt="Foto do serviço" fill sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw" className="object-cover" />
                    </div>
                  ))}
                  
                  {servico.status !== 'Concluído' && (
                    <Label htmlFor="photo-upload" className={`relative aspect-square w-full flex flex-col items-center justify-center rounded-md border-2 border-dashed cursor-pointer hover:bg-accent ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Camera className="h-8 w-8 text-muted-foreground" />}
                      <span className="mt-2 text-sm text-muted-foreground text-center">Adicionar foto</span>
                    </Label>
                  )}
                  <input id="photo-upload" type="file" className="sr-only" accept="image/*" capture="environment" onChange={handleFileChange} disabled={isUploading || servico.status === 'Concluído'} />
                </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Observações</h3>
              <Textarea placeholder="Adicione anotações sobre o estado do veículo..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={5} disabled={servico.status === 'Concluído'} />
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            {servico.status !== 'Concluído' && (
              <>
                <Button variant="outline" onClick={() => handleSave()}>Salvar Progresso</Button>
                <Button onClick={() => handleSave('Concluído')}>Finalizar Serviço</Button>
              </>
            )}
            {servico.status === 'Concluído' && servico.finalizado_em && (
              <p className="text-green-600 font-semibold">
                Serviço finalizado em {format(new Date(servico.finalizado_em), "dd/MM/yyyy 'às' HH:mm")}
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}