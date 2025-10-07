// src/app/api/avaliacoes/all/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      include: {
        servico: {
          include: {
            agendamento: {
              include: {
                cliente: true,
                carro: true,
              },
            },
          },
        },
      },
      orderBy: {
        criado_em: 'desc',
      },
    });
    return NextResponse.json(avaliacoes);
  } catch (error) {
    console.error("Erro ao buscar avaliações:", error);
    return NextResponse.json({ message: 'Erro ao buscar avaliações.' }, { status: 500 });
  }
}