// CAMADA DE DADOS — a única porta de entrada dos dados. Nenhuma tela busca ou
// grava em outro lugar. Toda função devolve { data, erro }.
//
// Hoje (USAR_MOCK = true) o miolo trabalha numa cópia em memória dos dados de
// exemplo, aplicando as mesmas regras de acesso que o banco vai aplicar (RLS).
// Na etapa do Supabase, troca-se o miolo de cada função; as telas não mudam.
//
// A obra atual é injetada aqui dentro (definirObraAtual): as telas não passam
// obra_id, e por isso não conseguem esquecer o filtro.

import { USAR_MOCK } from './config.js'
import {
  mockObras, mockProfiles, mockMembros, mockFuncoes, mockAtividades, mockAvancos,
  mockRestricoes, mockTarefas, mockEfetivos, mockAvisos,
} from './mockData.js'
import { pode, obrasVisiveis, ordenarObras } from './perfis.js'
import { aplicarAvanco, avancoObra, folhas, compararEap, OBS_ACERTO } from './cronograma.js'
import { resumoObra } from './resumoObras.js'
import { validarLinhaEfetivo } from './efetivo.js'
import { hoje } from './datas.js'
import { MOTIVOS_NAO_FEITO, SITUACOES_TAREFA, TIPOS_RESTRICAO, TIPOS_OBRA, STATUS_OBRA, PERFIS } from './vocabulario.js'

const db = {
  obras: structuredClone(mockObras),
  profiles: structuredClone(mockProfiles),
  membros: structuredClone(mockMembros),
  funcoes: structuredClone(mockFuncoes),
  atividades: structuredClone(mockAtividades),
  avancos: structuredClone(mockAvancos),
  restricoes: structuredClone(mockRestricoes),
  tarefas: structuredClone(mockTarefas),
  efetivos: structuredClone(mockEfetivos),
  avisos: structuredClone(mockAvisos),
}

let usuario = null
let obraAtualId = null

const esperar = () => new Promise((r) => setTimeout(r, 120))
const novoId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const agoraIso = () => new Date().toISOString()

async function resposta(fn) {
  await esperar()
  if (!USAR_MOCK) return { data: null, erro: 'O banco ainda não foi ligado (etapa do Supabase).' }
  try {
    return { data: fn(), erro: null }
  } catch (e) {
    return { data: null, erro: e.message }
  }
}

function exigir(acao) {
  if (!pode(usuario, acao)) throw new Error('Você não tem permissão para fazer isso.')
}

function obraDaVez() {
  if (!obraAtualId) throw new Error('Nenhuma obra selecionada.')
  if (!obrasVisiveis(usuario, db.obras, db.membros).some((o) => o.id === obraAtualId)) {
    throw new Error('Você não tem acesso a esta obra.')
  }
  return obraAtualId
}

const daObra = (lista) => {
  const id = obraDaVez()
  return lista.filter((x) => x.obra_id === id)
}

// ───────────────────────── Login ─────────────────────────

/** Perfis de exemplo para o botão "entrar como" do modo demonstração. */
export const perfisDemonstracao = () => resposta(() => db.profiles.map((p) => ({ ...p })))

export const entrarComoDemo = (id) => resposta(() => {
  const p = db.profiles.find((x) => x.id === id)
  if (!p) throw new Error('Perfil não encontrado.')
  usuario = p
  obraAtualId = null
  return { ...p }
})

export const entrar = () => resposta(() => {
  throw new Error('O login com senha entra junto com o banco. No modo demonstração, use os botões "Entrar como".')
})

/** Cadastro: entra como Pendente. O primeiro cadastro do sistema vira Gerente. */
export const cadastrar = ({ nome, email }) => resposta(() => {
  if (!String(nome || '').trim() || !String(email || '').includes('@')) throw new Error('Preencha nome e email.')
  if (db.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) throw new Error('Já existe uma conta com este email.')
  const semGerente = !db.profiles.some((p) => p.role === 'Gerente')
  const p = { id: novoId('u'), nome: nome.trim(), email: email.trim(), role: semGerente ? 'Gerente' : 'Pendente', ativo: true }
  db.profiles.push(p)
  usuario = p
  return { ...p }
})

export const sair = () => resposta(() => {
  usuario = null
  obraAtualId = null
  return true
})

/** Recarrega o perfil de quem está logado (o gerente pode ter mudado o perfil dele). */
export const meuPerfil = () => resposta(() => (usuario ? { ...db.profiles.find((p) => p.id === usuario.id) } : null))

export const atualizarMeuNome = (nome) => resposta(() => {
  if (!String(nome || '').trim()) throw new Error('O nome não pode ficar vazio.')
  const p = db.profiles.find((x) => x.id === usuario?.id)
  p.nome = nome.trim()
  usuario = p
  return { ...p }
})

// ───────────────────────── Obras ─────────────────────────

export function definirObraAtual(id) {
  obraAtualId = id
}

export const listarObras = () => resposta(() => ordenarObras(obrasVisiveis(usuario, db.obras, db.membros)).map((o) => ({ ...o })))

/** Avanço previsto e realizado de cada obra visível (uma consulta só, uma linha por obra). */
export const resumoDasObras = () => resposta(() => {
  const h = hoje()
  const out = {}
  for (const o of obrasVisiveis(usuario, db.obras, db.membros)) {
    const fl = folhas(db.atividades.filter((a) => a.obra_id === o.id))
    out[o.id] = fl.length ? avancoObra(fl, h) : null
  }
  return out
})

export const salvarObra = (obra) => resposta(() => {
  exigir('editarObra')
  if (!String(obra.nome || '').trim()) throw new Error('Informe o nome da obra.')
  if (!TIPOS_OBRA.includes(obra.tipo)) throw new Error('Escolha o tipo da obra.')
  if (!STATUS_OBRA.includes(obra.status)) throw new Error('Escolha a situação da obra.')
  const campos = {
    nome: obra.nome.trim(), cliente: obra.cliente || null, tipo: obra.tipo, cidade: obra.cidade || null,
    data_inicio: obra.data_inicio || null, data_termino_prevista: obra.data_termino_prevista || null, status: obra.status,
  }
  if (obra.id) {
    const o = db.obras.find((x) => x.id === obra.id)
    Object.assign(o, campos)
    return { ...o }
  }
  const nova = { id: novoId('o'), ...campos, revisao_atual: 0, importado_em: null, created_at: agoraIso() }
  db.obras.push(nova)
  return { ...nova }
})

export const excluirObra = (id) => resposta(() => {
  exigir('apagar')
  db.obras = db.obras.filter((o) => o.id !== id)
  for (const t of ['membros', 'atividades', 'avancos', 'restricoes', 'tarefas', 'efetivos', 'avisos']) {
    db[t] = db[t].filter((x) => x.obra_id !== id)
  }
  return true
})

/** Pessoas vinculadas a uma obra (ids). */
export const pessoasDaObra = (obraId) => resposta(() => {
  exigir('editarObra')
  return db.membros.filter((m) => m.obra_id === obraId).map((m) => m.profile_id)
})

export const definirPessoasDaObra = (obraId, profileIds) => resposta(() => {
  exigir('editarObra')
  db.membros = db.membros.filter((m) => m.obra_id !== obraId)
  for (const pid of profileIds) db.membros.push({ id: novoId('m'), obra_id: obraId, profile_id: pid, created_at: agoraIso() })
  return true
})

// ───────────────────────── Pessoas ─────────────────────────

/** Nome de cada pessoa, para mostrar "lançado por". */
export const nomesDasPessoas = () => resposta(() => Object.fromEntries(db.profiles.map((p) => [p.id, p.nome])))

export const listarUsuarios = () => resposta(() => {
  exigir('gerenciarUsuarios')
  return db.profiles.map((p) => ({
    ...p,
    obras: db.membros.filter((m) => m.profile_id === p.id).map((m) => m.obra_id),
  }))
})

export const atualizarUsuario = (id, { role, ativo, obras }) => resposta(() => {
  exigir('gerenciarUsuarios')
  const p = db.profiles.find((x) => x.id === id)
  if (!p) throw new Error('Pessoa não encontrada.')
  if (id === usuario.id && (role !== p.role || ativo !== p.ativo)) {
    throw new Error('Você não pode mudar o seu próprio perfil nem se bloquear.')
  }
  if (role !== 'Pendente' && !PERFIS.includes(role)) throw new Error('Escolha um perfil.')
  p.role = role
  p.ativo = ativo
  if (obras) {
    db.membros = db.membros.filter((m) => m.profile_id !== id)
    for (const oid of obras) db.membros.push({ id: novoId('m'), obra_id: oid, profile_id: id, created_at: agoraIso() })
  }
  return { ...p }
})

// ───────────────────────── Cronograma ─────────────────────────

export const listarAtividades = () => resposta(() =>
  daObra(db.atividades).map((a) => ({ ...a })).sort((x, y) => compararEap(x.eap, y.eap)))

/** Avanços da obra. O cliente recebe só atividade, data, % e foto (a visão avancos_cliente). */
export const listarAvancos = () => resposta(() => {
  const lista = daObra(db.avancos)
  if (usuario?.role === 'Cliente') {
    return lista.map(({ id, obra_id, atividade_id, data, percentual, foto_url, created_at }) =>
      ({ id, obra_id, atividade_id, data, percentual, foto_url, created_at }))
  }
  if (!pode(usuario, 'verPainelEquipe')) throw new Error('Você não tem permissão para ver isto.')
  return lista.map((a) => ({ ...a }))
})

export const lancarAvanco = ({ atividade_id, data, percentual, observacao, foto_url }) => resposta(() => {
  exigir('lancarAvanco')
  const obra = obraDaVez()
  const ativ = db.atividades.find((a) => a.id === atividade_id && a.obra_id === obra)
  if (!ativ || ativ.resumo) throw new Error('Escolha uma atividade do cronograma.')
  const pct = Number(percentual)
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error('O % precisa estar entre 0 e 100.')
  const novo = {
    id: novoId('av'), obra_id: obra, atividade_id, data: data || hoje(), percentual: pct,
    observacao: observacao?.trim() || null, foto_url: foto_url || null, lancado_por: usuario.id, created_at: agoraIso(),
  }
  db.avancos.push(novo)
  // O que o gatilho do banco vai fazer: atualizar o %, o início e o término reais.
  Object.assign(ativ, aplicarAvanco(db.avancos.filter((a) => a.atividade_id === atividade_id)))
  return { avanco: { ...novo }, atividade: { ...ativ } }
})

/**
 * Acerto inicial: grava vários avanços de uma vez, todos com a observação
 * "Acerto inicial do avanço". Ou todos, ou nenhum.
 */
export const acertarAvancoInicial = (itens, data) => resposta(() => {
  exigir('acertarAvanco')
  const obra = obraDaVez()
  if (!itens.length) throw new Error('Nenhuma atividade com % novo para gravar.')
  for (const it of itens) {
    const a = db.atividades.find((x) => x.id === it.atividade_id && x.obra_id === obra)
    if (!a || a.resumo) throw new Error('Atividade não encontrada nesta obra.')
    if (!(it.percentual >= 0 && it.percentual <= 100)) throw new Error(`${a.nome}: o % precisa estar entre 0 e 100.`)
  }
  const agora = agoraIso()
  for (const it of itens) {
    db.avancos.push({
      id: novoId('av'), obra_id: obra, atividade_id: it.atividade_id, data: data || hoje(), percentual: it.percentual,
      observacao: OBS_ACERTO, foto_url: null, lancado_por: usuario.id, created_at: agora,
    })
    const a = db.atividades.find((x) => x.id === it.atividade_id)
    Object.assign(a, aplicarAvanco(db.avancos.filter((x) => x.atividade_id === it.atividade_id)))
  }
  return itens.length
})

/**
 * Visão geral: uma linha por obra visível que não está concluída
 * (no banco, vira uma consulta agregada — nunca um laço chamando obra por obra).
 */
export const resumoGeralObras = () => resposta(() => {
  exigir('verVisaoGeral')
  const h = hoje()
  return ordenarObras(obrasVisiveis(usuario, db.obras, db.membros))
    .filter((o) => o.status !== 'Concluída')
    .map((o) => ({
      obra: { ...o },
      ...resumoObra({
        atividades: db.atividades.filter((a) => a.obra_id === o.id),
        restricoes: db.restricoes.filter((r) => r.obra_id === o.id),
        tarefas: db.tarefas.filter((t) => t.obra_id === o.id),
        efetivo: db.efetivos.filter((l) => l.obra_id === o.id && l.data === h),
      }, h),
    }))
})

/**
 * Grava o plano de importação (de planejarImportacao) de uma vez: ou tudo, ou nada.
 * Sobe a revisão da obra.
 */
export const importarCronograma = (plano, revisao) => resposta(() => {
  exigir('importarCronograma')
  const obraId = obraDaVez()
  const copia = structuredClone(db.atividades)
  const daObraCopia = copia.filter((a) => a.obra_id === obraId)
  const porEap = new Map()
  for (const n of plano.inserir) {
    const { eap_mae, ...campos } = n
    const nova = { id: novoId('a'), obra_id: obraId, parent_id: null, ...campos, created_at: agoraIso(), _eapMae: eap_mae }
    copia.push(nova)
    daObraCopia.push(nova)
  }
  for (const up of plano.atualizar) {
    const a = copia.find((x) => x.id === up.id && x.obra_id === obraId)
    if (!a) throw new Error('Atividade não encontrada na reimportação.')
    Object.assign(a, up.campos, { _eapMae: up.eap_mae })
  }
  for (const id of plano.remover) {
    const a = copia.find((x) => x.id === id && x.obra_id === obraId)
    if (a) a.removida_na_revisao = revisao
  }
  for (const a of daObraCopia) if (a.removida_na_revisao == null) porEap.set(a.eap, a.id)
  for (const a of daObraCopia) {
    if ('_eapMae' in a) {
      a.parent_id = a._eapMae ? porEap.get(a._eapMae) ?? null : null
      delete a._eapMae
    }
  }
  db.atividades = copia
  const obra = db.obras.find((o) => o.id === obraId)
  obra.revisao_atual = revisao
  obra.importado_em = agoraIso()
  return { ...obra }
})

// ───────────────────────── Restrições ─────────────────────────

export const listarRestricoes = () => resposta(() => {
  exigir('verPlanejamento')
  return daObra(db.restricoes).map((r) => ({ ...r }))
})

export const salvarRestricao = (r) => resposta(() => {
  exigir('editarRestricao')
  const obra = obraDaVez()
  if (!r.atividade_id) throw new Error('Escolha a atividade.')
  if (!TIPOS_RESTRICAO.includes(r.tipo)) throw new Error('Escolha o tipo.')
  if (!String(r.descricao || '').trim()) throw new Error('Descreva a restrição.')
  if (!String(r.responsavel || '').trim()) throw new Error('Informe o responsável.')
  if (!r.data_limite) throw new Error('Informe a data limite.')
  const campos = { atividade_id: r.atividade_id, tipo: r.tipo, descricao: r.descricao.trim(), responsavel: r.responsavel.trim(), data_limite: r.data_limite }
  if (r.id) {
    const x = db.restricoes.find((y) => y.id === r.id && y.obra_id === obra)
    Object.assign(x, campos)
    return { ...x }
  }
  const nova = { id: novoId('r'), obra_id: obra, ...campos, status: 'Aberta', removida_em: null, criado_por: usuario.id, created_at: agoraIso() }
  db.restricoes.push(nova)
  return { ...nova }
})

export const marcarRestricaoRemovida = (id, removida = true) => resposta(() => {
  exigir('editarRestricao')
  const x = db.restricoes.find((y) => y.id === id && y.obra_id === obraDaVez())
  x.status = removida ? 'Removida' : 'Aberta'
  x.removida_em = removida ? hoje() : null
  return { ...x }
})

export const excluirRestricao = (id) => resposta(() => {
  exigir('apagar')
  db.restricoes = db.restricoes.filter((r) => r.id !== id)
  return true
})

// ───────────────────────── Tarefas ─────────────────────────

export const listarTarefas = ({ de, ate } = {}) => resposta(() => {
  exigir('verPlanejamento')
  return daObra(db.tarefas)
    .filter((t) => (!de || t.data >= de) && (!ate || t.data <= ate))
    .map((t) => ({ ...t }))
    .sort((a, b) => a.data.localeCompare(b.data) || a.created_at.localeCompare(b.created_at))
})

export const salvarTarefa = (t) => resposta(() => {
  exigir('planejarSemana')
  const obra = obraDaVez()
  if (!t.data) throw new Error('Escolha o dia.')
  if (!String(t.descricao || '').trim()) throw new Error('Descreva a meta da tarefa.')
  if (!String(t.responsavel || '').trim()) throw new Error('Informe o responsável.')
  const campos = { data: t.data, descricao: t.descricao.trim(), responsavel: t.responsavel.trim(), atividade_id: t.atividade_id || null }
  if (t.id) {
    const x = db.tarefas.find((y) => y.id === t.id && y.obra_id === obra)
    Object.assign(x, campos)
    return { ...x }
  }
  const nova = { id: novoId('t'), obra_id: obra, ...campos, situacao: 'Planejada', motivo_nao_feito: null, criado_por: usuario.id, created_at: agoraIso() }
  db.tarefas.push(nova)
  return { ...nova }
})

export const marcarTarefa = (id, situacao, motivo = null) => resposta(() => {
  exigir('marcarTarefa')
  if (!SITUACOES_TAREFA.includes(situacao)) throw new Error('Situação inválida.')
  if (situacao === 'Não feito' && !MOTIVOS_NAO_FEITO.includes(motivo)) throw new Error('Escolha o motivo.')
  const x = db.tarefas.find((y) => y.id === id && y.obra_id === obraDaVez())
  x.situacao = situacao
  x.motivo_nao_feito = situacao === 'Não feito' ? motivo : null
  return { ...x }
})

export const excluirTarefa = (id) => resposta(() => {
  exigir('apagar')
  db.tarefas = db.tarefas.filter((t) => t.id !== id)
  return true
})

// ───────────────────────── Efetivo ─────────────────────────

export const listarFuncoes = () => resposta(() => db.funcoes.map((f) => ({ ...f })))

export const salvarFuncao = (f) => resposta(() => {
  exigir('editarFuncoes')
  const nome = String(f.nome || '').trim()
  if (!nome) throw new Error('Informe o nome da função.')
  if (db.funcoes.some((x) => x.nome.toLowerCase() === nome.toLowerCase() && x.id !== f.id)) throw new Error('Já existe uma função com este nome.')
  if (f.id) {
    const x = db.funcoes.find((y) => y.id === f.id)
    Object.assign(x, { nome, tipo: f.tipo, ativo: f.ativo })
    return { ...x }
  }
  const nova = { id: novoId('f'), nome, tipo: f.tipo, ativo: true, created_at: agoraIso() }
  db.funcoes.push(nova)
  return { ...nova }
})

export const listarEfetivo = ({ de, ate } = {}) => resposta(() => {
  exigir('verEfetivo')
  return daObra(db.efetivos)
    .filter((l) => (!de || l.data >= de) && (!ate || l.data <= ate))
    .map((l) => ({ ...l }))
})

/** Substitui o efetivo de um dia pelas linhas informadas. */
export const salvarEfetivoDia = (data, linhas) => resposta(() => {
  exigir('lancarEfetivo')
  if (data !== hoje() && !pode(usuario, 'editarEfetivoAnterior')) {
    throw new Error('Só o gerente edita o efetivo de dias anteriores.')
  }
  linhas.forEach((l, i) => {
    const erro = validarLinhaEfetivo(l)
    if (erro) throw new Error(`Linha ${i + 1}: ${erro}`)
  })
  const obra = obraDaVez()
  db.efetivos = db.efetivos.filter((l) => !(l.obra_id === obra && l.data === data))
  const novas = linhas.map((l) => ({
    id: novoId('e'), obra_id: obra, data, tipo: l.tipo, funcao_id: l.funcao_id,
    atividade_id: l.tipo === 'MO indireta' ? null : l.atividade_id, empresa: l.tipo === 'Terceirizado' ? l.empresa.trim() : null,
    quantidade: Number(l.quantidade), lancado_por: usuario.id, created_at: agoraIso(),
  }))
  db.efetivos.push(...novas)
  return novas.map((n) => ({ ...n }))
})

// ───────────────────────── Avisos ─────────────────────────

export const listarAvisos = () => resposta(() => {
  exigir('verAvisos')
  const nomes = Object.fromEntries(db.profiles.map((p) => [p.id, p.nome]))
  return daObra(db.avisos)
    .map((a) => ({ ...a, autor_nome: nomes[a.autor_id] || '' }))
    .sort((a, b) => Number(b.fixado) - Number(a.fixado) || b.created_at.localeCompare(a.created_at))
})

export const salvarAviso = (a) => resposta(() => {
  exigir('criarAviso')
  const obra = obraDaVez()
  if (!String(a.titulo || '').trim() || !String(a.texto || '').trim()) throw new Error('Preencha título e texto.')
  if (a.id) {
    const x = db.avisos.find((y) => y.id === a.id && y.obra_id === obra)
    if (x.autor_id !== usuario.id && !pode(usuario, 'fixarAviso')) throw new Error('Só o autor ou o gerente edita este aviso.')
    Object.assign(x, { titulo: a.titulo.trim(), texto: a.texto.trim() })
    return { ...x }
  }
  const novo = { id: novoId('v'), obra_id: obra, titulo: a.titulo.trim(), texto: a.texto.trim(), fixado: false, autor_id: usuario.id, created_at: agoraIso() }
  db.avisos.push(novo)
  return { ...novo }
})

export const fixarAviso = (id, fixado) => resposta(() => {
  exigir('fixarAviso')
  const x = db.avisos.find((y) => y.id === id && y.obra_id === obraDaVez())
  x.fixado = fixado
  return { ...x }
})

export const excluirAviso = (id) => resposta(() => {
  exigir('apagar')
  db.avisos = db.avisos.filter((a) => a.id !== id)
  return true
})
