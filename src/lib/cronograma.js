// Regras do cronograma: o que é previsto, o que é realizado, o que está atrasado,
// a curva S e a linha de balanço. Puro: sem React, sem banco. Testado em tests/cronograma.mjs.

import { addDias, difDias, inicioSemana, maxData, minData } from './datas.js'

const arred = (n) => Math.round(n * 10) / 10

export const ativa = (a) => a.removida_na_revisao == null

/** Atividades que recebem avanço: não são resumo e não foram removidas numa revisão. */
export function folhas(atividades) {
  return atividades.filter((a) => !a.resumo && ativa(a))
}

/** % previsto de uma atividade numa data: linha reta entre início e término da linha de base. */
export function pctPrevisto(a, data) {
  const ib = a.inicio_base
  const tb = a.termino_base
  if (!ib || !tb) return 0
  if (data >= tb) return 100
  if (data < ib) return 0
  const total = difDias(ib, tb)
  if (total <= 0) return 100
  return arred((difDias(ib, data) / total) * 100)
}

function ordenar(avancos) {
  return [...avancos].sort((x, y) =>
    x.data === y.data ? String(x.created_at || '').localeCompare(String(y.created_at || '')) : x.data.localeCompare(y.data))
}

/** Avanços agrupados por atividade, cada lista em ordem de data. */
export function agruparAvancos(avancos) {
  const m = new Map()
  for (const av of avancos) {
    if (!m.has(av.atividade_id)) m.set(av.atividade_id, [])
    m.get(av.atividade_id).push(av)
  }
  for (const [k, v] of m) m.set(k, ordenar(v))
  return m
}

/** % realizado numa data: o último lançamento até aquela data (0 se não houver). */
export function pctRealizadoEm(avancosDaAtividade, data) {
  let pct = 0
  for (const av of avancosDaAtividade || []) {
    if (av.data <= data) pct = Number(av.percentual)
    else break
  }
  return pct
}

/**
 * O que o banco mantém na atividade a cada avanço gravado (o gatilho do PRD-BACKEND):
 * % = o lançamento mais recente; início real = primeiro > 0; término real = primeiro = 100.
 */
export function aplicarAvanco(avancosDaAtividade) {
  const lista = ordenar(avancosDaAtividade || [])
  const ultimo = lista[lista.length - 1]
  const primeiroIniciado = lista.find((av) => Number(av.percentual) > 0)
  const primeiroCompleto = lista.find((av) => Number(av.percentual) >= 100)
  return {
    percentual_realizado: ultimo ? Number(ultimo.percentual) : 0,
    inicio_real: primeiroIniciado ? primeiroIniciado.data : null,
    termino_real: primeiroCompleto && Number(ultimo.percentual) >= 100 ? primeiroCompleto.data : null,
  }
}

/** Situação de uma atividade hoje. Os textos são os do vocabulário. */
export function situacao(a, hoje) {
  if (!ativa(a)) return 'Removida'
  const real = Number(a.percentual_realizado || 0)
  const prev = pctPrevisto(a, hoje)
  if (real >= 100) return 'Concluída'
  if (real < prev) return 'Atrasada'
  if (real === 0 && prev === 0) return 'Não iniciada'
  return 'No prazo'
}

function peso(a) {
  return Number(a.duracao_dias) || 0
}

/**
 * Avanço da obra numa data: média dos % das folhas, ponderada pela duração.
 * `avancosPorAtividade` (Map) é usado para o realizado em datas passadas;
 * sem ele, usa o % atual de cada atividade.
 */
export function avancoObra(listaFolhas, data, avancosPorAtividade) {
  let soma = listaFolhas.reduce((s, a) => s + peso(a), 0)
  const p = soma > 0 ? peso : () => 1
  if (soma <= 0) soma = listaFolhas.length
  if (!soma) return { previsto: 0, realizado: 0 }
  let prev = 0
  let real = 0
  for (const a of listaFolhas) {
    prev += p(a) * pctPrevisto(a, data)
    const r = avancosPorAtividade ? pctRealizadoEm(avancosPorAtividade.get(a.id), data) : Number(a.percentual_realizado || 0)
    real += p(a) * r
  }
  return { previsto: arred(prev / soma), realizado: arred(real / soma) }
}

/**
 * Curva S semana a semana. Previsto calculado no domingo de cada semana;
 * realizado só até hoje (na semana atual, usa o valor de hoje).
 */
export function curvaS(listaFolhas, avancos, hoje) {
  if (!listaFolhas.length) return []
  const ini = inicioSemana(minData(listaFolhas.map((a) => a.inicio_base)))
  const fim = maxData(listaFolhas.map((a) => a.termino_base))
  const porAtiv = agruparAvancos(avancos)
  const pontos = []
  for (let s = ini; s <= fim; s = addDias(s, 7)) {
    const fimSem = addDias(s, 6)
    const previsto = avancoObra(listaFolhas, fimSem).previsto
    let realizado = null
    if (fimSem <= hoje) realizado = avancoObra(listaFolhas, fimSem, porAtiv).realizado
    else if (s <= hoje) realizado = avancoObra(listaFolhas, hoje, porAtiv).realizado
    pontos.push({ inicio: s, fim: fimSem, previsto, realizado })
  }
  return pontos
}

/** Folhas atrasadas hoje, as de maior diferença primeiro. */
export function atrasadas(listaFolhas, hoje) {
  return listaFolhas
    .filter((a) => situacao(a, hoje) === 'Atrasada')
    .map((a) => ({ ...a, previsto_hoje: pctPrevisto(a, hoje) }))
    .sort((x, y) => (y.previsto_hoje - y.percentual_realizado) - (x.previsto_hoje - x.percentual_realizado))
}

// ───────────────────────── Linha de balanço ─────────────────────────

/**
 * Chave para comparar locais escritos de jeitos diferentes:
 * "Rua 03, Rua 04 e Rua 06" e "Rua 03, 04 e 06" viram a mesma chave.
 */
export function chaveLocal(local) {
  return String(local || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\bruas?\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function chaveServico(servico) {
  return String(servico || '').trim().toUpperCase()
}

/** Serviços que se repetem em pelo menos `minLocais` locais diferentes. */
export function servicosRepetidos(listaFolhas, minLocais = 2) {
  const locaisPorServ = new Map()
  for (const a of listaFolhas) {
    if (!a.servico || !a.local) continue
    const k = chaveServico(a.servico)
    if (!locaisPorServ.has(k)) locaisPorServ.set(k, { nome: a.servico, locais: new Set() })
    locaisPorServ.get(k).locais.add(chaveLocal(a.local))
  }
  return [...locaisPorServ.values()]
    .filter((s) => s.locais.size >= minLocais)
    .map((s) => ({ nome: s.nome, qtdLocais: s.locais.size }))
}

/**
 * Dados da linha de balanço. Locais na ordem em que aparecem na EAP.
 * Colisão: num mesmo local, o serviço que começa depois termina antes do outro
 * (as linhas se cruzam), ou a ordem dos dois troca de um local para o seguinte.
 */
export function linhaBalanco(listaFolhas, hoje, { servicos: filtro, minLocais = 2 } = {}) {
  const repetidos = new Set(servicosRepetidos(listaFolhas, minLocais).map((s) => chaveServico(s.nome)))
  const quer = filtro ? new Set(filtro.map(chaveServico)) : null
  const usadas = [...listaFolhas]
    .filter((a) => a.servico && a.local && repetidos.has(chaveServico(a.servico)))
    .filter((a) => !quer || quer.has(chaveServico(a.servico)))
    .sort((x, y) => compararEap(x.eap, y.eap))

  const locais = []
  const idxLocal = new Map()
  const servs = new Map()
  for (const a of usadas) {
    const kl = chaveLocal(a.local)
    if (!idxLocal.has(kl)) { idxLocal.set(kl, locais.length); locais.push({ chave: kl, nome: a.local }) }
    const ks = chaveServico(a.servico)
    if (!servs.has(ks)) servs.set(ks, { nome: a.servico, pontos: new Map() })
    const pts = servs.get(ks).pontos
    const atual = pts.get(kl)
    const pct = Number(a.percentual_realizado || 0)
    if (!atual) {
      pts.set(kl, {
        local: kl, atividade_id: a.id, ib: a.inicio_base, tb: a.termino_base,
        ir: a.inicio_real, tr: a.termino_real, pct, peso: peso(a) || 1,
      })
    } else {
      // Mais de uma atividade do mesmo serviço no mesmo local: junta numa só.
      const pw = peso(a) || 1
      atual.pct = (atual.pct * atual.peso + pct * pw) / (atual.peso + pw)
      atual.peso += pw
      atual.ib = minData([atual.ib, a.inicio_base])
      atual.tb = maxData([atual.tb, a.termino_base])
      atual.ir = minData([atual.ir, a.inicio_real])
      atual.tr = atual.tr && a.termino_real ? maxData([atual.tr, a.termino_real]) : null
    }
  }

  const servicos = [...servs.values()].map((s) => ({
    nome: s.nome,
    pontos: [...s.pontos.values()]
      .sort((x, y) => idxLocal.get(x.local) - idxLocal.get(y.local))
      .map((p) => {
        const previstoHoje = pctPrevisto({ inicio_base: p.ib, termino_base: p.tb }, hoje)
        return {
          local: p.local, atividade_id: p.atividade_id, ib: p.ib, tb: p.tb, ir: p.ir, tr: p.tr,
          pct: arred(p.pct), atrasada: p.pct < 100 && p.pct < previstoHoje,
        }
      }),
  }))

  const colisoes = []
  const vistos = new Set()
  for (let i = 0; i < servicos.length; i++) {
    for (let j = i + 1; j < servicos.length; j++) {
      const a = new Map(servicos[i].pontos.map((p) => [p.local, p]))
      const b = new Map(servicos[j].pontos.map((p) => [p.local, p]))
      let ordemAnterior = null
      for (const l of locais) {
        const pa = a.get(l.chave)
        const pb = b.get(l.chave)
        if (!pa || !pb) continue
        const cruzaNoLocal = (pa.ib < pb.ib && pa.tb > pb.tb) || (pb.ib < pa.ib && pb.tb > pa.tb)
        const ordem = pa.ib === pb.ib ? 0 : pa.ib < pb.ib ? -1 : 1
        const trocou = ordemAnterior != null && ordem !== 0 && ordemAnterior !== 0 && ordem !== ordemAnterior
        if (ordem !== 0) ordemAnterior = ordem
        if (cruzaNoLocal || trocou) {
          const k = `${l.chave}|${i}|${j}`
          if (!vistos.has(k)) {
            vistos.add(k)
            colisoes.push({ local: l.chave, nomeLocal: l.nome, servico1: servicos[i].nome, servico2: servicos[j].nome })
          }
        }
      }
    }
  }

  const todas = servicos.flatMap((s) => s.pontos)
  return {
    locais,
    servicos,
    colisoes,
    inicio: minData(todas.map((p) => p.ib)),
    fim: maxData(todas.map((p) => p.tb)),
  }
}

/**
 * Nome de uma atividade para mostrar em listas, sem ambiguidade:
 * - nome que já traz o local ("Execução de Subleito - Rua 03") → o próprio nome;
 * - "local primeiro" (folha "Drenagem" na "Quadra A") → "Quadra A › Drenagem";
 * - o resto → o próprio nome.
 */
export function nomeAtividade(a) {
  if (!a) return ''
  if (a.nome?.includes(' - ')) return a.nome
  if (a.local && a.servico) return `${a.local} › ${a.servico}`
  return a.nome
}

// ───────────────────────── Acerto inicial do avanço ─────────────────────────

export const OBS_ACERTO = 'Acerto inicial do avanço'

/**
 * A etapa de uma atividade: os dois primeiros níveis acima dela
 * (ex.: 'FASE 01 - LOTEAMENTO › BEACH LOUNGE - FASE 01', ou só 'Quadra A').
 */
export function etapaDe(a, porId) {
  const ancestrais = []
  let atual = a
  let guarda = 0
  while (atual?.parent_id && guarda++ < 20) {
    const mae = porId.get(atual.parent_id)
    if (!mae) break
    ancestrais.unshift(mae.nome)
    atual = mae
  }
  return ancestrais.length ? ancestrais.slice(0, 2).join(' › ') : 'Sem etapa'
}

/**
 * Atividades que precisam de acerto quando a obra começou antes do app:
 * folhas que já deveriam ter começado (início da linha de base até hoje) e não estão em 100%.
 */
export function candidatasAcerto(listaFolhas, hoje) {
  return listaFolhas
    .filter((a) => a.inicio_base && a.inicio_base <= hoje && Number(a.percentual_realizado || 0) < 100)
    .sort((x, y) => compararEap(x.eap, y.eap))
}

/**
 * Transforma o que foi preenchido na tela ({ id: '80' }) nos lançamentos a gravar.
 * Ignora campo vazio e % igual ao atual. Recusa % fora de 0–100.
 * Devolve { itens, erros }.
 */
export function planoAcerto(preenchidos, porId) {
  const itens = []
  const erros = []
  for (const [id, valor] of Object.entries(preenchidos)) {
    if (valor === '' || valor == null) continue
    const a = porId.get(id)
    if (!a || a.resumo) continue
    const pct = Number(valor)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) { erros.push(`${a.nome}: o % precisa estar entre 0 e 100.`); continue }
    if (pct === Number(a.percentual_realizado || 0)) continue
    itens.push({ atividade_id: id, percentual: pct })
  }
  return { itens, erros }
}

/** Compara '1.2.10' e '1.2.9' como números, não como texto. */
export function compararEap(x, y) {
  const a = String(x).split('.').map(Number)
  const b = String(y).split('.').map(Number)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? -1) - (b[i] ?? -1)
    if (d) return d
  }
  return 0
}
