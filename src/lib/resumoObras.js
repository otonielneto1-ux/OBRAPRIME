// Resumo de uma obra para a "Visão geral das obras" (uma linha por obra).
// Puro: recebe os dados da obra, devolve os números. Testado em tests/resumo-obras.mjs.

import { folhas, avancoObra, atrasadas } from './cronograma.js'
import { estadoRestricao, resumoSemana } from './planejamento.js'
import { totaisEfetivo } from './efetivo.js'

export function resumoObra({ atividades, restricoes, tarefas, efetivo }, hoje) {
  const fl = folhas(atividades)
  const abertas = restricoes.filter((r) => r.status === 'Aberta')
  const efHoje = efetivo.filter((l) => l.data === hoje)
  const av = fl.length ? avancoObra(fl, hoje) : null
  const sem = resumoSemana(tarefas, hoje).ateHoje
  return {
    temCronograma: fl.length > 0,
    previsto: av ? av.previsto : null,
    realizado: av ? av.realizado : null,
    diferenca: av ? Math.round(av.realizado - av.previsto) : null,
    atrasadas: fl.length ? atrasadas(fl, hoje).length : 0,
    restricoesAbertas: abertas.length,
    restricoesVencidas: abertas.filter((r) => estadoRestricao(r, hoje) === 'vencida').length,
    efetivoHoje: efHoje.length ? totaisEfetivo(efHoje).total : null,
    semanaPct: sem.pct,
    semanaFeitas: sem.feitas,
    semanaTotal: sem.total,
  }
}
