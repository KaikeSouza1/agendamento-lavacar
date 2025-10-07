// src/app/api/servicos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
// A linha 'import { cuid } from ...' foi removida daqui.

// Função para OBTER um serviço específico
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

// Função para ATUALIZAR (PUT) um serviço
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    
    const { status, observacoes, checklist, fotos, valor, servicos_adicionais } = body;

    const dadosParaAtualizar: any = {
      observacoes,
      checklist,
      fotos,
      servicos_adicionais,
    };

    if (status) {
      dadosParaAtualizar.status = status;
      if (status === 'Concluído' && !body.finalizado_em) {
        dadosParaAtualizar.finalizado_em = new Date();
      }
    }
    
    if (valor !== undefined && valor !== null && valor !== '') {
      dadosParaAtualizar.valor = parseFloat(valor);
    } else {
      dadosParaAtualizar.valor = null;
    }

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: dadosParaAtualizar,
      include: {
        agendamento: {
          include: {
            cliente: true,
            carro: true,
          },
        },
      },
    });
    
    revalidatePath('/'); 

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ message: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}

// Função para ATUALIZAR PARCIALMENTE (PATCH) um serviço
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);
        const body = await request.json();
        const { galleryId } = body;

        if (!galleryId) {
            return NextResponse.json({ message: 'galleryId é obrigatório' }, { status: 400 });
        }

        const servicoAtualizado = await prisma.servico.update({
            where: { id },
            data: { galleryId },
        });

        return NextResponse.json(servicoAtualizado);
    } catch (error) {
        console.error('Erro ao atualizar galleryId:', error);
        return NextResponse.json({ message: 'Erro ao atualizar galleryId' }, { status: 500 });
    }
}