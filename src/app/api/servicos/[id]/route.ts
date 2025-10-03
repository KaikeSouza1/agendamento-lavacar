// src/app/api/servicos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// A função GET já está correta
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const servico = await prisma.servico.findUnique({
      where: { id },
      include: {
        agendamento: {
          include: {
            cliente: true,
            carro: true,
          },
        },
      },
    });

    if (!servico) {
      return NextResponse.json({ message: 'Serviço não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return NextResponse.json({ message: 'Erro ao buscar serviço.' }, { status: 500 });
  }
}

// A CORREÇÃO ESTÁ NA FUNÇÃO PUT ABAIXO
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { status, observacoes, checklist, fotos, valor } = body;

    const fotosParaSalvar = Array.isArray(fotos) ? fotos : [];

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: {
        status,
        observacoes,
        checklist,
        fotos: fotosParaSalvar,
        valor: valor ? parseFloat(valor) : null,
        ...(status === 'Concluído' && { finalizado_em: new Date() }),
      },
      // ADICIONE ESTE BLOCO PARA GARANTIR QUE A RESPOSTA VENHA COMPLETA
      include: {
        agendamento: {
          include: {
            cliente: true,
            carro: true,
          },
        },
      },
    });

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ message: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}