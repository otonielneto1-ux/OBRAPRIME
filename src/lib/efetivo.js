// Regras do efetivo diário. Puro e testado (tests/efetivo.mjs).
// As obrigatoriedades daqui são as mesmas do CHECK do banco (PRD-BACKEND.md).

import { TIPOS_EFETIVO } from './vocabulario.js'

/** Devolve a mensagem de erro da linha, ou null se ela pode ser salva. */
export function validarLinhaEfetivo(l) {
  if (!TIPOS_EFETIVO.includes(l.tipo)) return 'Escolha o tipo.'
  if (!l.funcao_id) return 'Escolha a função.'
  if (!Number.isInteger(Number(l.quantidade)) || Number(l.quantidade) <= 0) return 'A quantidade precisa ser maior que zero.'
  if (l.tipo !== 'MO indireta' && !l.atividade_id) return 'Escolha a atividade em que trabalharam.'
  if (l.tipo === 'Terceirizado' && !String(l.empresa || '').trim()) return 'Informe a empresa terceirizada.'
  return null
}

/** Total do dia e total por tipo. */
export function totaisEfetivo(linhas) {
  const porTipo = Object.fromEntries(TIPOS_EFETIVO.map((t) => [t, 0]))
  let total = 0
  for (const l of linhas) {
    const q = Number(l.quantidade) || 0
    total += q
    if (l.tipo in porTipo) porTipo[l.tipo] += q
  }
  return { total, porTipo }
}

/** As `n` funções com mais gente no dia. */
export function topFuncoes(linhas, nomeDaFuncao, n = 3) {
  const m = new Map()
  for (const l of linhas) m.set(l.funcao_id, (m.get(l.funcao_id) || 0) + (Number(l.quantidade) || 0))
  return [...m.entries()]
    .map(([id, q]) => ({ nome: nomeDaFuncao(id), quantidade: q }))
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, n)
}

/** Copia as linhas de um dia para outro (sem id, para virar lançamento novo). */
export function copiarLinhas(linhas, data) {
  return linhas.map((l) => ({
    tipo: l.tipo, funcao_id: l.funcao_id, atividade_id: l.atividade_id || null,
    empresa: l.empresa || null, quantidade: l.quantidade, data,
  }))
}

/** Pessoas × dias por atividade (a "pergunta de um ano"). */
export function pessoasPorAtividade(linhas) {
  const m = new Map()
  for (const l of linhas) {
    if (!l.atividade_id) continue
    m.set(l.atividade_id, (m.get(l.atividade_id) || 0) + (Number(l.quantidade) || 0))
  }
  return m
}
