// src/app/api/servicos/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função GET (sem alterações, mas incluída para garantir)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const servico = await prisma.servico.findUnique({
      where: { id },
      include: {
        agendamento: true,
      },
    });

    if (!servico) {
      return NextResponse.json({ message: 'Serviço não encontrado.' }, { status: 404 });
    }
    return NextResponse.json(servico);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    return NextResponse.json({ message: 'Erro ao buscar serviço.' }, { status: 500 });
  }
}

// Função PUT (Revisada)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const { status, observacoes, checklist, fotos } = body;

    // Garante que 'fotos' seja um array, mesmo que venha nulo
    const fotosParaSalvar = Array.isArray(fotos) ? fotos : [];

    const servicoAtualizado = await prisma.servico.update({
      where: { id },
      data: {
        status,
        observacoes,
        checklist,
        fotos: fotosParaSalvar, // Salva o array de fotos
        ...(status === 'Concluído' && { finalizado_em: new Date() }),
      },
    });

    return NextResponse.json(servicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    return NextResponse.json({ message: 'Erro ao atualizar serviço' }, { status: 500 });
  }
}