// src/app/api/carros/[id]/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para DELETAR (DELETE) um carro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    // Verifica se o carro possui agendamentos associados
    const agendamentos = await prisma.agendamento.findMany({
      where: { carroId: id },
    });

    if (agendamentos.length > 0) {
      return NextResponse.json(
        { message: 'Não é possível excluir o carro, pois ele possui agendamentos vinculados.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Se não houver agendamentos, prossegue com a exclusão
    await prisma.carro.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 }); // 204 No Content
  } catch (error) {
    console.error('Erro ao deletar carro:', error);
    return NextResponse.json({ message: 'Erro ao deletar carro' }, { status: 500 });
  }
}