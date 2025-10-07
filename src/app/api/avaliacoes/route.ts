// src/app/api/avaliacoes/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { servicoId, estrelas, comentario } = body;

    if (!servicoId || !estrelas) {
      return NextResponse.json({ message: 'Serviço e estrelas são obrigatórios.' }, { status: 400 });
    }

    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        servicoId: Number(servicoId),
        estrelas,
        comentario,
      },
    });

    return NextResponse.json(novaAvaliacao, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar avaliação:", error);
    return NextResponse.json(
      { message: 'Erro ao criar avaliação.' },
      { status: 500 }
    );
  }
}