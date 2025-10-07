"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Agendamento, Servico, Cliente, Carro } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Car, User, Calendar, Tag, Camera, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type ServicoComAgendamento = Servico & {
  servicos_adicionais?: string | null;
  galleryId?: string | null;
  agendamento: Agendamento & {
    cliente: Cliente;
    carro: Carro;
  };
};

const ITENS_CHECKLIST = [
  "Lavagem Externa",
  "Limpeza Interna",
  "Aspirador",
  "Pretinho",
  "Cera",
];

export default function PaginaServico() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [servico, setServico] = useState<ServicoComAgendamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [observacoes, setObservacoes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [valor, setValor] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [servicosAdicionais, setServicosAdicionais] = useState("");

  const fetchServico = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/servicos/${id}`);
      if (!response.ok) throw new Error("Serviço não encontrado");
      const data: ServicoComAgendamento = await response.json();
      setServico(data);

      setObservacoes(data.observacoes || "");
      setValor(data.valor ? String(data.valor) : "");
      setServicosAdicionais(data.servicos_adicionais || "");
      
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
      toast.error("Serviço não encontrado.");
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) {
        fetchServico();
    }
  }, [id, fetchServico]);
  
  const handleSave = async ({ novoStatus, fotosParaSalvar = fotos, isAutoSave = false }: { 
    novoStatus?: 'Concluído'; 
    fotosParaSalvar?: string[];
    isAutoSave?: boolean;
  } = {}) => {
    
    if (novoStatus === 'Concluído') {
      setIsFinalizing(true);
    }

    try {
      const response = await fetch(`/api/servicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus || servico?.status,
          observacoes,
          checklist,
          fotos: fotosParaSalvar,
          valor: valor,
          servicos_adicionais: servicosAdicionais,
        }),
      });

      if (!response.ok) throw new Error("Falha ao salvar");
      
      const updatedServico = await response.json();
      
      setServico(updatedServico); 
      setFotos(Array.isArray(updatedServico.fotos) ? updatedServico.fotos : []);
      setValor(updatedServico.valor ? String(updatedServico.valor) : "");
      setServicosAdicionais(updatedServico.servicos_adicionais || "");

      if(novoStatus === 'Concluído') {
        toast.success("Serviço finalizado com sucesso!");
      } else if (!isAutoSave) {
        toast.success("Progresso salvo!");
      }

    } catch (error) {
      toast.error("Erro ao salvar as alterações.");
    } finally {
      if (novoStatus === 'Concluído') {
        setIsFinalizing(false);
      }
    }
  };

  const handleChecklistChange = (item: string) => {
    setChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };
  
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

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no upload");

      const data = await response.json();
      const newFotos = [...fotos, data.secure_url];
      
      setFotos(newFotos);
      
      await handleSave({ fotosParaSalvar: newFotos, isAutoSave: true });

      toast.success("Foto enviada e salva!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar a foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!servico || !servico.agendamento.cliente.telefone) {
        toast.error("Este cliente não possui um número de telefone cadastrado.");
        return;
    }

    setIsSending(true);
    let currentGalleryId = servico.galleryId;

    if (!currentGalleryId) {
        try {
            const tempId = crypto.randomUUID().slice(0, 8);
            const response = await fetch(`/api/servicos/${servico.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ galleryId: tempId }),
            });
            if (!response.ok) throw new Error("Falha ao criar ID da galeria");
            
            const updatedServico = await response.json();
            currentGalleryId = updatedServico.galleryId;
            setServico(prev => prev ? { ...prev, galleryId: currentGalleryId } : null);
            toast.success("ID de galeria criado para serviço antigo!");
        } catch (error) {
            toast.error("Erro ao preparar link para serviço antigo. Tente novamente.");
            setIsSending(false);
            return;
        }
    }

    const galleryBaseUrl = process.env.NEXT_PUBLIC_GALLERY_BASE_URL || 'https://galeria-lavacar.vercel.app';
    const galleryUrl = `${galleryBaseUrl}/galeria/${currentGalleryId}`;

    const phone = servico.agendamento.cliente.telefone.replace(/\D/g, '');
    const internationalPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const clienteNome = servico.agendamento.cliente.nome.split(' ')[0];
    
    const servicosFeitos = Object.entries(checklist)
        .filter(([_, checked]) => checked)
        .map(([item]) => `✅ ${item}`)
        .join('\n');

    const valorFormatado = servico.valor 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(servico.valor))
        : "Valor a combinar";
    
    const adicionaisTexto = servicosAdicionais.trim()
        ? `*Serviços Adicionais:*\n${servicosAdicionais.trim()}\n\n`
        : '';
    
    const message = `Olá ${clienteNome}! 👋\n\nSeu serviço na Garage Wier foi finalizado com sucesso!\n\n*Resumo do Serviço:*\n${servicosFeitos}\n\n${adicionaisTexto}*Valor Total:* ${valorFormatado}\n\nVeja as fotos do seu veiculo e se puder deixe sua avaliação.:\n${galleryUrl}\n\nAgradecemos a preferência! 😊`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${internationalPhone}?text=${encodedMessage}`;
    
    window.open(url, '_blank');
    setIsSending(false);
  };


  if (loading || !servico) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-lg">Carregando serviço...</p>
          </div>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Serviço não encontrado</h1>
            <p className="text-muted-foreground mt-2">O serviço que você está procurando não existe ou foi removido.</p>
            <Button asChild className="mt-6">
              <Link href="/">Voltar para a Agenda</Link>
            </Button>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-secondary p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="outline" className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a Agenda
          </Link>
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Detalhes do Serviço</CardTitle>
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
              <h3 className="font-semibold text-lg">Serviços Adicionais</h3>
              <Textarea 
                placeholder="Ex: Lavagem de peças, pintura de rodas..." 
                value={servicosAdicionais} 
                onChange={(e) => setServicosAdicionais(e.target.value)} 
                rows={3} 
                disabled={servico.status === 'Concluído'} 
              />
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
              <h3 className="font-semibold text-lg">Valor do Serviço</h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input 
                  type="number"
                  placeholder="0,00"
                  className="pl-9"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  disabled={servico.status === 'Concluído'}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Observações</h3>
              <Textarea placeholder="Adicione anotações sobre o estado do veículo..." value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={5} disabled={servico.status === 'Concluído'} />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {servico.status !== 'Concluído' ? (
              <div className="flex justify-end gap-3 w-full">
                <Button variant="outline" onClick={() => handleSave({})}>Salvar Progresso</Button>
                <Button onClick={() => handleSave({ novoStatus: 'Concluído' })} disabled={isFinalizing}>
                  {isFinalizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isFinalizing ? 'Finalizando...' : 'Finalizar Serviço'}
                </Button>
              </div>
            ) : (
              <>
                {servico.finalizado_em && (
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Finalizado em {format(new Date(servico.finalizado_em), "dd/MM/yy 'às' HH:mm")}
                  </p>
                )}
                <Button 
                  onClick={handleSendWhatsApp} 
                  disabled={!servico.agendamento.cliente.telefone || isSending}
                  className="w-full sm:w-auto"
                >
                  {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-5 w-5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                  {isSending ? 'Preparando...' : 'Enviar para Cliente'}
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}