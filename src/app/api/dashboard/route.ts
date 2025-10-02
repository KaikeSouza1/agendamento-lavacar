// src/app/api/dashboard/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';
import type { Agendamento } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hoje = searchParams.get('date') ? parseISO(searchParams.get('date')!) : new Date();

    const inicioDoDia = startOfDay(hoje);
    const fimDoDia = endOfDay(hoje);

    const agendamentosHoje = await prisma.agendamento.findMany({
      where: {
        data_hora: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
      },
      orderBy: {
        data_hora: 'asc',
      },
    });
    
    const proximoCliente = agendamentosHoje.find((ag: Agendamento) => new Date(ag.data_hora) > new Date());

    // Objeto de resposta simplificado
    const dadosDashboard = {
      agendamentosHoje: agendamentosHoje.length,
      proximoCliente: proximoCliente 
        ? { nome: proximoCliente.nome_cliente, horario: proximoCliente.data_hora }
        : null,
    };

    return NextResponse.json(dadosDashboard);

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}