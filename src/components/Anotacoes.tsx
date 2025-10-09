// src/components/Anotacoes.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { PlusCircle, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Anotacao {
  id: number;
  conteudo: string;
}

const anotacaoSchema = z.object({
  conteudo: z.string().min(1, 'A anotação não pode estar vazia.'),
});

export function Anotacoes() {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Anotacao | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Anotacao | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(anotacaoSchema),
    defaultValues: { conteudo: '' },
  });

  const fetchAnotacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/anotacoes');
      const data = await response.json();
      setAnotacoes(data);
    } catch (error) {
      toast.error('Erro ao buscar anotações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnotacoes();
  }, []);

  const onSubmit = async (values: { conteudo: string }) => {
    setIsSubmitting(true);
    const method = editando ? 'PUT' : 'POST';
    const body = JSON.stringify(editando ? { ...values, id: editando.id } : values);

    try {
      await fetch('/api/anotacoes', { method, headers: { 'Content-Type': 'application/json' }, body });
      toast.success(`Anotação ${editando ? 'atualizada' : 'salva'}!`);
      form.reset();
      setEditando(null);
      fetchAnotacoes();
    } catch (error) {
      toast.error('Erro ao salvar anotação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!paraExcluir) return;
    try {
      await fetch('/api/anotacoes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paraExcluir.id }),
      });
      toast.success('Anotação excluída.');
      setParaExcluir(null);
      fetchAnotacoes();
    } catch (error) {
      toast.error('Erro ao excluir anotação.');
    }
  };

  const handleEdit = (anotacao: Anotacao) => {
    setEditando(anotacao);
    form.setValue('conteudo', anotacao.conteudo);
  };
  
  const handleCancelEdit = () => {
    setEditando(null);
    form.reset();
  };

  return (
    <div className="space-y-6 mt-6">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="conteudo"
                render={({ field }) => (
                  <FormItem>
                    <Textarea placeholder="Digite sua anotação aqui..." {...field} rows={4} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                {editando && <Button type="button" variant="ghost" onClick={handleCancelEdit}>Cancelar</Button>}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : editando ? 'Atualizar' : <PlusCircle className="mr-2 h-4 w-4" />}
                  {editando ? 'Salvar Alterações' : 'Adicionar Anotação'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? <p>Carregando...</p> : anotacoes.map(anotacao => (
          <Card key={anotacao.id}>
            <CardContent className="p-4 flex justify-between items-start">
              <p className="whitespace-pre-wrap">{anotacao.conteudo}</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(anotacao)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => setParaExcluir(anotacao)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!paraExcluir} onOpenChange={() => setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}