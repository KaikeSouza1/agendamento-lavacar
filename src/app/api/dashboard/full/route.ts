// src/app/api/dashboard/full/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
// import { ptBR } from 'date-fns/locale'; // Não é mais necessário para o cálculo da semana

export async function GET() {
  try {
    const agora = new Date();

    // Definição dos períodos de tempo
    const hojeInicio = startOfDay(agora);
    const hojeFim = endOfDay(agora);
    // ✅ AJUSTE: Forçando a semana a começar no Domingo (0)
    const semanaInicio = startOfWeek(agora, { weekStartsOn: 0 });
    const semanaFim = endOfWeek(agora, { weekStartsOn: 0 });
    const mesInicio = startOfMonth(agora);
    const mesFim = endOfMonth(agora);

    // Busca todos os serviços concluídos no mês atual
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

    // Filtra os serviços por período
    const servicosHoje = servicosConcluidosNoMes.filter(s => s.finalizado_em! >= hojeInicio && s.finalizado_em! <= hojeFim);
    const servicosSemana = servicosConcluidosNoMes.filter(s => s.finalizado_em! >= semanaInicio && s.finalizado_em! <= semanaFim);

    // Função auxiliar para somar valores
    const somarValores = (servicos: any[]) => 
      servicos.reduce((acc, servico) => acc + (Number(servico.valor) || 0), 0);

    // Calcula as métricas
    const faturamentoHoje = somarValores(servicosHoje);
    const faturamentoSemana = somarValores(servicosSemana);
    const faturamentoMes = somarValores(servicosConcluidosNoMes);

    const totalServicosHoje = servicosHoje.length;
    const totalServicosSemana = servicosSemana.length;
    const totalServicosMes = servicosConcluidosNoMes.length;

    // Busca os últimos 5 serviços concluídos para a lista de atividades recentes
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