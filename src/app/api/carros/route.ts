// src/app/api/carros/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para CRIAR um novo carro para um cliente existente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelo, placa, clienteId } = body;

    if (!modelo || !placa || !clienteId) {
      return NextResponse.json({ message: 'Modelo, placa e ID do cliente são obrigatórios.' }, { status: 400 });
    }

    const novoCarro = await prisma.carro.create({
      data: {
        modelo,
        placa,
        clienteId,
      },
    });

    return NextResponse.json(novoCarro, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Erro ao criar carro.' }, { status: 500 });
  }
}