// src/app/api/agendamentos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para BUSCAR (GET) todos os agendamentos
export async function GET() {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: {
        data_hora: 'asc',
      },
      // Incluímos os dados do cliente e do carro no retorno
      include: {
        cliente: true,
        carro: true,
      }
    });
    return NextResponse.json(agendamentos);
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao buscar agendamentos.' },
      { status: 500 }
    );
  }
}

// Função para CRIAR (POST) um novo agendamento
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Agora recebemos os IDs, não mais os nomes
    const { data_hora, clienteId, carroId } = body; 
    const dataHoraAgendamento = new Date(data_hora);

    if (!data_hora || !clienteId || !carroId) {
      return NextResponse.json(
        { message: 'Cliente, carro e data/hora são obrigatórios.' },
        { status: 400 }
      );
    }

    // A lógica de verificação de horário continua a mesma
    const agendamentoExistente = await prisma.agendamento.findFirst({
      where: {
        data_hora: dataHoraAgendamento,
      },
    });

    if (agendamentoExistente) {
      return NextResponse.json(
        { message: 'Este horário já está ocupado. Por favor, escolha outro.' },
        { status: 409 } // 409 = Conflict
      );
    }

    // Criamos o agendamento usando os IDs
    const novoAgendamento = await prisma.agendamento.create({
      data: {
        data_hora: dataHoraAgendamento,
        clienteId: clienteId,
        carroId: carroId,
      },
    });

    return NextResponse.json(novoAgendamento, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Erro ao criar agendamento.' },
      { status: 500 }
    );
  }
}