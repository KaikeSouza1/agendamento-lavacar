// src/app/api/servicos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    // ✅ 1. Obtenha o novo campo do corpo da requisição
    const { status, observacoes, checklist, fotos, valor, servicos_adicionais } = body;

    const dadosParaAtualizar: any = {
      observacoes,
      checklist,
      fotos,
      servicos_adicionais, // ✅ 2. Adicione o campo ao objeto de atualização
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

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ message: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}