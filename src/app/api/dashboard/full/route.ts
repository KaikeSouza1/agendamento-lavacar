// src/app/api/dashboard/full/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// ✅ ESTA É A LINHA QUE RESOLVE TUDO!
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agora = new Date();

    const hojeInicio = startOfDay(agora);
    const hojeFim = endOfDay(agora);
    const semanaInicio = startOfWeek(agora, { weekStartsOn: 0 });
    const semanaFim = endOfWeek(agora, { weekStartsOn: 0 });
    const mesInicio = startOfMonth(agora);
    const mesFim = endOfMonth(agora);

    const servicosConcluidosNoMes = await prisma.servico.findMany({
      where: {
        status: 'Concluído',
        finalizado_em: {
          gte: mesInicio,
          lte: mesFim,
        },
      },
      include: {
        agendamento: {
            include: {
                cliente: true,
                carro: true,
            }
        }
      },
      orderBy: {
        finalizado_em: 'desc',
      }
    });

    const servicosHoje = servicosConcluidosNoMes.filter(s => s.finalizado_em! >= hojeInicio && s.finalizado_em! <= hojeFim);
    const servicosSemana = servicosConcluidosNoMes.filter(s => s.finalizado_em! >= semanaInicio && s.finalizado_em! <= semanaFim);

    const somarValores = (servicos: any[]) => 
      servicos.reduce((acc, servico) => acc + (Number(servico.valor) || 0), 0);

    const faturamentoHoje = somarValores(servicosHoje);
    const faturamentoSemana = somarValores(servicosSemana);
    const faturamentoMes = somarValores(servicosConcluidosNoMes);

    const totalServicosHoje = servicosHoje.length;
    const totalServicosSemana = servicosSemana.length;
    const totalServicosMes = servicosConcluidosNoMes.length;

    const atividadesRecentes = servicosConcluidosNoMes.slice(0, 5).map(s => ({
        id: s.id,
        nomeCliente: s.agendamento.cliente.nome,
        modeloCarro: s.agendamento.carro.modelo,
        valor: Number(s.valor) || 0,
        finalizado_em: s.finalizado_em,
    }));

    return NextResponse.json({
      faturamentoHoje,
      faturamentoSemana,
      faturamentoMes,
      totalServicosHoje,
      totalServicosSemana,
      totalServicosMes,
      atividadesRecentes
    });

  } catch (error) {
    console.error("Erro ao buscar dados do dashboard completo:", error);
    return NextResponse.json({ message: 'Erro interno do servidor.' }, { status: 500 });
  }
}