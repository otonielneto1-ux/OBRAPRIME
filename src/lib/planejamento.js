// Regras do planejamento: janela de 3 meses, restrições, semana e dia,
// % de tarefas cumpridas e o alerta de efetivo. Puro e testado (tests/planejamento.mjs).

import { addDias, difDias, diaDaSemana, inicioSemana } from './datas.js'

/** Janela de `n` semanas a partir da semana de hoje, com as folhas não concluídas que passam por cada semana. */
export function janelaSemanas(listaFolhas, hoje, n = 12) {
  const ini = inicioSemana(hoje)
  const semanas = []
  for (let i = 0; i < n; i++) {
    const inicio = addDias(ini, i * 7)
    const fim = addDias(inicio, 6)
    const atividades = listaFolhas.filter((a) =>
      Number(a.percentual_realizado || 0) < 100 &&
      a.inicio_previsto <= fim && a.termino_previsto >= inicio)
    semanas.push({ inicio, fim, atividades })
  }
  return semanas
}

/** 'removida' | 'vencida' | 'proxima' (vence em até 7 dias) | 'aberta' */
export function estadoRestricao(r, hoje) {
  if (r.status === 'Removida') return 'removida'
  if (r.data_limite < hoje) return 'vencida'
  if (difDias(hoje, r.data_limite) <= 7) return 'proxima'
  return 'aberta'
}

/** Quantas restrições abertas cada atividade tem. */
export function restricoesAbertasPorAtividade(restricoes) {
  const m = new Map()
  for (const r of restricoes) {
    if (r.status !== 'Aberta') continue
    m.set(r.atividade_id, (m.get(r.atividade_id) || 0) + 1)
  }
  return m
}

/** % de tarefas cumpridas: feitas ÷ planejadas. As que ficaram 'Planejada' contam como não feitas. */
export function resumoTarefas(tarefas) {
  const total = tarefas.length
  const feitas = tarefas.filter((t) => t.situacao === 'Feito').length
  const naoFeitas = tarefas.filter((t) => t.situacao === 'Não feito').length
  return {
    total, feitas, naoFeitas, pendentes: total - feitas - naoFeitas,
    pct: total ? Math.round((feitas / total) * 100) : null,
  }
}

export function tarefasEntre(tarefas, de, ate) {
  return tarefas.filter((t) => t.data >= de && t.data <= ate)
}

/** A semana atual dia a dia (seg a sáb por padrão) e o % cumprido de segunda até hoje. */
export function resumoSemana(tarefas, hoje, dias = 6) {
  const ini = inicioSemana(hoje)
  const lista = []
  for (let i = 0; i < dias; i++) {
    const data = addDias(ini, i)
    const r = resumoTarefas(tarefas.filter((t) => t.data === data))
    lista.push({ data, ...r, hoje: data === hoje, futuro: data > hoje })
  }
  const ateHoje = resumoTarefas(tarefasEntre(tarefas, ini, hoje))
  const depois = tarefasEntre(tarefas, addDias(hoje, 1), addDias(ini, 6)).length
  return { inicio: ini, fim: addDias(ini, 6), dias: lista, ateHoje, restantes: depois }
}

/** % cumprido da semana passada (segunda a domingo antes da semana de hoje). */
export function semanaPassada(tarefas, hoje) {
  const ini = addDias(inicioSemana(hoje), -7)
  return { inicio: ini, fim: addDias(ini, 6), ...resumoTarefas(tarefasEntre(tarefas, ini, addDias(ini, 6))) }
}

/** Histórico das `n` semanas anteriores à atual, a mais recente primeiro. */
export function historicoSemanas(tarefas, hoje, n = 8) {
  const out = []
  for (let i = 1; i <= n; i++) {
    const ini = addDias(inicioSemana(hoje), -7 * i)
    const r = resumoTarefas(tarefasEntre(tarefas, ini, addDias(ini, 6)))
    if (r.total) out.push({ inicio: ini, fim: addDias(ini, 6), ...r })
  }
  return out
}

/** Alerta de efetivo: segunda a sábado, a partir das 10h, sem efetivo lançado hoje. */
export function alertaEfetivo(hoje, hora, temEfetivoHoje) {
  const dow = diaDaSemana(hoje)
  return dow >= 1 && dow <= 6 && hora >= 10 && !temEfetivoHoje
}
