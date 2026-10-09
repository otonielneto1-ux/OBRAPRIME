// Datas do app: sempre texto 'AAAA-MM-DD' (o mesmo formato da coluna `date`
// do banco). As contas usam UTC por dentro para não pular dia por fuso.

import { DATA_FIXA_DEMO } from './config.js'

const DIA_MS = 86400000
export const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function partes(s) {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  return [y, m, d]
}

function utc(s) {
  const [y, m, d] = partes(s)
  return Date.UTC(y, m - 1, d)
}

function deUtc(ms) {
  const d = new Date(ms)
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${d.getUTCFullYear()}-${mm}-${dd}`
}

/** Data local de um objeto Date, sem passar por UTC (toISOString pula dia no Brasil). */
export function isoLocal(dt) {
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}

/** Hoje, como 'AAAA-MM-DD'. No modo demonstração, a data fica fixa para os exemplos fazerem sentido. */
export function hoje() {
  return DATA_FIXA_DEMO || isoLocal(new Date())
}

export function addDias(s, n) {
  return deUtc(utc(s) + n * DIA_MS)
}

/** Quantos dias de `a` até `b` (b - a). */
export function difDias(a, b) {
  return Math.round((utc(b) - utc(a)) / DIA_MS)
}

/** 0 = domingo ... 6 = sábado */
export function diaDaSemana(s) {
  return new Date(utc(s)).getUTCDay()
}

/** Segunda-feira da semana de `s` (a semana começa na segunda). */
export function inicioSemana(s) {
  const dow = diaDaSemana(s)
  return addDias(s, dow === 0 ? -6 : 1 - dow)
}

export function fmtData(s) {
  if (!s) return ''
  const [y, m, d] = partes(s)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`
}

export function fmtCurta(s) {
  if (!s) return ''
  const [, m, d] = partes(s)
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

export function nomeDia(s) {
  return DIAS_SEMANA[diaDaSemana(s)]
}

export function minData(lista) {
  return lista.filter(Boolean).reduce((m, s) => (m == null || s < m ? s : m), null)
}

export function maxData(lista) {
  return lista.filter(Boolean).reduce((m, s) => (m == null || s > m ? s : m), null)
}
