// Leitura do XML do MS Project (Arquivo > Salvar como > XML) e o plano de
// importação/reimportação. Puro: recebe texto, devolve dados. Roda no navegador
// e no Node (os testes), por isso não usa DOMParser.

import { servicosRepetidos, chaveLocal } from './cronograma.js'
import { minData, maxData } from './datas.js'

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

function decodificar(s) {
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(Number(d)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_m, e) => ENTIDADES[e])
}

function campo(bloco, nome) {
  const m = bloco.match(new RegExp(`<${nome}>([\\s\\S]*?)</${nome}>`))
  return m ? decodificar(m[1].trim()) : null
}

/** 'PT3624H0M0S' (ou 'P2DT4H') → horas. */
export function duracaoEmHoras(iso) {
  const m = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(String(iso || '').trim())
  if (!m) return 0
  const [, d = 0, h = 0, min = 0, s = 0] = m
  return Number(d) * 24 + Number(h) + Number(min) / 60 + Number(s) / 3600
}

const BLOCOS_INTERNOS = ['Baseline', 'TimephasedData', 'ExtendedAttribute', 'PredecessorLink', 'OutlineCode']

/**
 * Lê o texto do XML. Devolve { ok, erro } ou { ok, titulo, tarefas, semLinhaBase }.
 * Cada tarefa: uid, nome, eap, nivel, resumo, inicio, termino, inicio_base, termino_base, duracao_dias, tem_base.
 */
export function lerProjectXML(texto) {
  const t = String(texto || '')
  if (!/<Project[\s>]/.test(t) || !t.includes('<Tasks>')) {
    return { ok: false, erro: 'Este arquivo não parece ser um XML do MS Project. No Project: Arquivo > Salvar como > tipo XML.' }
  }
  const cabecalho = t.slice(0, t.indexOf('<Tasks>'))
  const minutosPorDia = Number(campo(cabecalho, 'MinutesPerDay')) || 480
  const titulo = campo(cabecalho, 'Title') || campo(cabecalho, 'Name') || ''
  const corpo = t.slice(t.indexOf('<Tasks>'), t.indexOf('</Tasks>') + 8)

  const tarefas = []
  let semLinhaBase = 0
  for (const m of corpo.matchAll(/<Task>([\s\S]*?)<\/Task>/g)) {
    const bruto = m[1]
    let limpo = bruto
    for (const b of BLOCOS_INTERNOS) limpo = limpo.replace(new RegExp(`<${b}>[\\s\\S]*?</${b}>`, 'g'), '')

    const uid = Number(campo(limpo, 'UID'))
    const nivel = Number(campo(limpo, 'OutlineLevel'))
    if (!Number.isFinite(uid) || nivel === 0 || uid === 0) continue
    if (campo(limpo, 'IsNull') === '1' || campo(limpo, 'Active') === '0') continue
    const inicio = (campo(limpo, 'Start') || '').slice(0, 10)
    const termino = (campo(limpo, 'Finish') || '').slice(0, 10)
    if (!inicio || !termino) continue

    let base = null
    for (const bm of bruto.matchAll(/<Baseline>([\s\S]*?)<\/Baseline>/g)) {
      if (campo(bm[1], 'Number') === '0') {
        const bi = (campo(bm[1], 'Start') || '').slice(0, 10)
        const bf = (campo(bm[1], 'Finish') || '').slice(0, 10)
        if (bi && bf) base = { bi, bf }
      }
    }
    if (!base) semLinhaBase++

    tarefas.push({
      uid,
      nome: campo(limpo, 'Name') || '(sem nome)',
      eap: campo(limpo, 'OutlineNumber') || String(uid),
      nivel,
      resumo: campo(limpo, 'Summary') === '1',
      inicio,
      termino,
      inicio_base: base ? base.bi : inicio,
      termino_base: base ? base.bf : termino,
      duracao_dias: Math.round((duracaoEmHoras(campo(limpo, 'Duration')) / (minutosPorDia / 60)) * 100) / 100,
      tem_base: !!base,
    })
  }
  if (!tarefas.length) {
    return { ok: false, erro: 'O arquivo não tem tarefas. Confira se salvou o cronograma certo.' }
  }
  return { ok: true, titulo, tarefas, semLinhaBase }
}

/**
 * Descobre local e serviço de cada atividade-folha. Dois jeitos de organizar
 * o cronograma, os dois aceitos:
 *  - serviço primeiro: "SUBLEITO > Execução de Subleito - Rua 03, 04 e 06"
 *    → serviço = a mãe; local = o texto depois do último " - " no nome.
 *  - local primeiro:   "Quadra A > Drenagem"
 *    → local = a mãe; serviço = a própria folha.
 */
export function localEServico(nomeFolha, nomeMae) {
  if (!nomeMae) return { local: null, servico: null }
  const i = nomeFolha.lastIndexOf(' - ')
  if (i > 0) return { local: nomeFolha.slice(i + 3).trim(), servico: nomeMae.trim() }
  return { local: nomeMae.trim(), servico: nomeFolha.trim() }
}

/** Tarefas lidas → atividades no formato da tabela (sem id, com eap_mae para ligar a mãe). */
export function montarAtividades(tarefas) {
  const porEap = new Map(tarefas.map((t) => [t.eap, t]))
  return tarefas.map((t) => {
    const eapMae = t.eap.includes('.') ? t.eap.slice(0, t.eap.lastIndexOf('.')) : null
    const mae = eapMae ? porEap.get(eapMae) : null
    const { local, servico } = t.resumo ? { local: null, servico: null } : localEServico(t.nome, mae?.nome)
    return {
      uid_project: t.uid,
      eap: t.eap,
      eap_mae: mae ? eapMae : null,
      nivel: t.nivel,
      nome: t.nome,
      resumo: t.resumo,
      local,
      servico,
      inicio_base: t.inicio_base,
      termino_base: t.termino_base,
      inicio_previsto: t.inicio,
      termino_previsto: t.termino,
      duracao_dias: t.duracao_dias,
    }
  })
}

/**
 * Compara o que já existe na obra com o arquivo novo, casando pelo UID do Project.
 * - nova no arquivo → inserir (a linha de base original nasce igual à atual)
 * - já existia → atualizar nome, EAP, datas e linha de base atual; manter avanço e linha de base original
 * - sumiu do arquivo → marcar "removida na revisão N" (não apagar: tem avanço e efetivo ligados)
 */
export function planejarImportacao(existentes, novas, revisao) {
  const porUid = new Map(existentes.map((a) => [a.uid_project, a]))
  const uidsNovos = new Set(novas.map((n) => n.uid_project))
  const inserir = []
  const atualizar = []
  for (const n of novas) {
    const e = porUid.get(n.uid_project)
    const { eap_mae, ...campos } = n
    if (!e) {
      inserir.push({
        ...campos, eap_mae,
        inicio_base_original: n.inicio_base, termino_base_original: n.termino_base,
        percentual_realizado: 0, inicio_real: null, termino_real: null,
        revisao_importada: revisao, removida_na_revisao: null,
      })
    } else {
      atualizar.push({ id: e.id, eap_mae, campos: { ...campos, revisao_importada: revisao, removida_na_revisao: null } })
    }
  }
  const remover = existentes.filter((e) => e.removida_na_revisao == null && !uidsNovos.has(e.uid_project)).map((e) => e.id)

  const fls = novas.filter((n) => !n.resumo)
  const repetidos = servicosRepetidos(fls)
  const nomesRep = new Set(repetidos.map((s) => s.nome.trim().toUpperCase()))
  const locais = new Set(fls.filter((a) => a.servico && nomesRep.has(a.servico.trim().toUpperCase())).map((a) => chaveLocal(a.local)))

  return {
    inserir, atualizar, remover,
    resumo: {
      total: novas.length,
      folhas: fls.length,
      novas: inserir.length,
      atualizadas: atualizar.length,
      removidas: remover.length,
      servicosRepetidos: repetidos,
      qtdLocais: locais.size,
      inicioBase: minData(novas.map((n) => n.inicio_base)),
      terminoBase: maxData(novas.map((n) => n.termino_base)),
      reimportacao: existentes.length > 0,
    },
  }
}
