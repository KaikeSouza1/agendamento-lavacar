// src/app/api/agendamentos/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: {
        data_hora: 'asc',
      },
      // === CORREÇÃO APLICADA AQUI ===
      // Agora, além de buscar o cliente, também buscamos
      // a lista de carros associada a ele. Isso corrige o erro de 'map'.
      include: {
        cliente: {
          include: {
            carros: true, 
          }
        },
        carro: true,
        servico: true, 
      }
    });
    return NextResponse.json(agendamentos);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      { message: 'Erro ao buscar agendamentos.' },
      { status: 500 }
    );
  }
}

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

    // Não permite agendar no mesmo horário exato
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
        clienteId: Number(clienteId),
        carroId: Number(carroId),
      },
    });

    return NextResponse.json(novoAgendamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json(
      { message: 'Erro ao criar agendamento.' },
      { status: 500 }
    );
  }
}