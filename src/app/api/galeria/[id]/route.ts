// src/app/api/galeria/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const servico = await prisma.servico.findUnique({
      where: { galleryId: params.id },
      include: {
        agendamento: {
          include: {
            cliente: true,
            carro: true,
          },
        },
        avaliacao: true, // Inclui a avaliação
      },
    });

    if (!servico) {
      return NextResponse.json({ message: 'Galeria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao buscar dados da galeria:', error);
    return NextResponse.json({ message: 'Erro ao buscar dados da galeria.' }, { status: 500 });
  }
}