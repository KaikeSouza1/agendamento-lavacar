// src/app/api/anotacoes/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const anotacoes = await prisma.anotacao.findMany({
    orderBy: { criado_em: 'desc' },
  });
  return NextResponse.json(anotacoes);
}

export async function POST(request: Request) {
  const { conteudo } = await request.json();
  const novaAnotacao = await prisma.anotacao.create({
    data: { conteudo },
  });
  return NextResponse.json(novaAnotacao, { status: 201 });
}

export async function PUT(request: Request) {
  const { id, conteudo } = await request.json();
  const anotacaoAtualizada = await prisma.anotacao.update({
    where: { id },
    data: { conteudo },
  });
  return NextResponse.json(anotacaoAtualizada);
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  await prisma.anotacao.delete({
    where: { id },
  });
  return new NextResponse(null, { status: 204 });
}