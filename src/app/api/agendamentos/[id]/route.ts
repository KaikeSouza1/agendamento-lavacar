// src/app/api/agendamentos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para OBTER um agendamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        cliente: true,
        carro: true,
        servico: true,
      },
    });

    if (!agendamento) {
      return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(agendamento);
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    return NextResponse.json({ message: 'Erro ao buscar agendamento.' }, { status: 500 });
  }
}

// Função para ATUALIZAR (PUT) um agendamento
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    // ✅ CORREÇÃO APLICADA: Usando os campos atuais do schema
    const { data_hora, clienteId, carroId } = body;

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        data_hora: new Date(data_hora),
        clienteId: clienteId,
        carroId: carroId,
      },
    });

    return NextResponse.json(agendamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ message: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

// Função para DELETAR (DELETE) um agendamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    // O onDelete: Cascade no schema do Prisma já cuida de deletar o serviço junto.
    await prisma.agendamento.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao deletar agendamento:', error);
    return NextResponse.json({ message: 'Erro ao deletar agendamento' }, { status: 500 });
  }
}