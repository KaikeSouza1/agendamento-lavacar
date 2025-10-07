// src/app/api/agendamentos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função GET (sem alterações)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        cliente: { include: { carros: true }},
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

// Função PUT (sem alterações)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { data_hora, clienteId, carroId } = body;

    if (!data_hora || !clienteId || !carroId) {
        return NextResponse.json({ message: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: {
        data_hora: new Date(data_hora),
        clienteId: Number(clienteId),
        carroId: Number(carroId),
      },
    });

    return NextResponse.json(agendamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    return NextResponse.json({ message: 'Erro ao atualizar agendamento' }, { status: 500 });
  }
}

// === CORREÇÃO APLICADA AQUI ===
// Função para DELETAR (DELETE) um agendamento de forma segura
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    // 1. Verifica se existe um serviço vinculado a este agendamento
    const servico = await prisma.servico.findUnique({
      where: { agendamentoId: id },
    });

    // 2. Se um serviço existir, deleta ele primeiro
    if (servico) {
      await prisma.servico.delete({
        where: { id: servico.id },
      });
    }

    // 3. Agora deleta o agendamento com segurança
    await prisma.agendamento.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // Sucesso
  } catch (error) {
    // Adiciona um log mais detalhado no console do servidor para futuras depurações
    console.error('Erro detalhado ao deletar agendamento:', error);
    return NextResponse.json({ message: 'Erro no servidor ao deletar agendamento.' }, { status: 500 });
  }
}