// src/app/api/dashboard/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

// ✅ TIPO ATUALIZADO PARA INCLUIR O CLIENTE
import type { Agendamento, Cliente } from '@prisma/client';
type AgendamentoComCliente = Agendamento & { cliente: Cliente };

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
      // ✅ 1. ADICIONADO PARA BUSCAR DADOS DO CLIENTE
      include: {
        cliente: true,
      },
      orderBy: {
        data_hora: 'asc',
      },
    });
    
    const proximoCliente = agendamentosHoje.find((ag: AgendamentoComCliente) => new Date(ag.data_hora) > new Date()) as AgendamentoComCliente | undefined;

    // Objeto de resposta simplificado
    const dadosDashboard = {
      agendamentosHoje: agendamentosHoje.length,
      proximoCliente: proximoCliente 
        // ✅ 2. CORRIGIDO PARA ACESSAR O NOME CORRETAMENTE
        ? { nome: proximoCliente.cliente.nome, horario: proximoCliente.data_hora }
        : null,
    };

    return NextResponse.json(dadosDashboard);

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}