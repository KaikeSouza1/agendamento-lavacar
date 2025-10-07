// src/app/api/servicos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para BUSCAR (GET) todos os serviços
export async function GET() {
  try {
    const servicos = await prisma.servico.findMany({
      include: {
        agendamento: {
          include: {
            cliente: true,
            carro: true,
          },
        },
        avaliacao: true, // Adicionado para incluir a avaliação
      },
      orderBy: {
        iniciado_em: 'desc', // Mostra os mais recentes primeiro
      },
    });
    return NextResponse.json(servicos);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json({ message: 'Erro ao buscar serviços.' }, { status: 500 });
  }
}

// Função para CRIAR (POST) um novo serviço (ESTA É A VERSÃO CORRETA)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agendamentoId } = body;

    if (!agendamentoId) {
      return NextResponse.json({ message: 'ID do agendamento é obrigatório.' }, { status: 400 });
    }

    // Verifica se já não existe um serviço para este agendamento
    const servicoExistente = await prisma.servico.findUnique({
      where: { agendamentoId },
    });

    if (servicoExistente) {
      // Se já existe, apenas retorna o serviço existente para evitar duplicados
      return NextResponse.json(servicoExistente, { status: 200 });
    }

    // Se não existe, cria um novo
    const novoServico = await prisma.servico.create({
      data: {
        agendamentoId: agendamentoId,
        status: 'Em Andamento',
        iniciado_em: new Date(),
      },
    });

    return NextResponse.json(novoServico, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json({ message: 'Erro ao criar serviço.' }, { status: 500 });
  }
}