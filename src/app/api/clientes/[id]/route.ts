// src/app/api/clientes/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função para BUSCAR clientes (com filtro de nome)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get('nome');

  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        nome: {
          contains: nome || '',
          mode: 'insensitive', // Não diferencia maiúsculas/minúsculas
        },
      },
      include: {
        carros: true, // Inclui a lista de carros de cada cliente
      },
    });
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ message: 'Erro ao buscar clientes.' }, { status: 500 });
  }
}

// Função para CRIAR um novo cliente e seu primeiro carro
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nome, telefone, modelo, placa } = body;

    if (!nome || !modelo) {
      return NextResponse.json({ message: 'Nome e modelo são obrigatórios.' }, { status: 400 });
    }

    // Verifica se o cliente já existe
    const clienteExistente = await prisma.cliente.findUnique({ where: { nome } });
    if(clienteExistente) {
        return NextResponse.json({ message: 'Um cliente com este nome já existe.' }, { status: 409 });
    }

    const novoCliente = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        carros: {
          create: {
            modelo,
            placa,
          },
        },
      },
      include: {
        carros: true,
      },
    });

    return NextResponse.json(novoCliente, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Erro ao criar cliente.' }, { status: 500 });
  }
}