// src/app/api/agendamentos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: {
        data_hora: 'asc',
      },
      // === PONTO CRÍTICO 1 ===
      // A linha "servico: true" é essencial.
      // Ela manda o Prisma buscar o status do serviço.
      include: {
        cliente: true,
        carro: true,
        servico: true, 
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

// O restante do arquivo (função POST) continua igual...
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clienteId, carroId, data_hora } = body; 
    
    if (!data_hora || !clienteId || !carroId) {
      return NextResponse.json(
        { message: 'Cliente, carro e data/hora são obrigatórios.' },
        { status: 400 }
      );
    }

    const dataHoraAgendamento = new Date(data_hora);

    const agendamentoExistente = await prisma.agendamento.findFirst({
      where: {
        data_hora: dataHoraAgendamento,
      },
    });

    if (agendamentoExistente) {
      return NextResponse.json(
        { message: 'Este horário já está ocupado. Por favor, escolha outro.' },
        { status: 409 }
      );
    }

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

//////////////////