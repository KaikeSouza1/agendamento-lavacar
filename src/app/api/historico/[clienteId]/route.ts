// src/app/api/historico/[clienteId]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { clienteId: string } }
) {
  const { searchParams } = new URL(request.url);
  const servicoAtualId = searchParams.get('servicoAtualId');

  if (!servicoAtualId) {
    return NextResponse.json({ message: 'ID do serviço atual é obrigatório' }, { status: 400 });
  }

  try {
    const historico = await prisma.servico.findMany({
      where: {
        status: 'Concluído',
        id: {
          not: Number(servicoAtualId),
        },
        agendamento: {
          clienteId: Number(params.clienteId),
        },
        galleryId: {
          not: null,
        },
      },
      include: {
        agendamento: {
          include: {
            carro: true,
          },
        },
      },
      orderBy: {
        finalizado_em: 'desc',
      },
      take: 5,
    });
    return NextResponse.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json({ message: 'Erro ao buscar histórico.' }, { status: 500 });
  }
}