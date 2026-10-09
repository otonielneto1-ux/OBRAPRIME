// Dados de exemplo (modo demonstração). Mesmos nomes de campo das tabelas do
// PRD-BACKEND.md — na etapa do banco, isto vira o seed.
// Duas obras DIFERENTES de propósito: o Loteamento tem linha de balanço, avisos
// e efetivo sem lançar hoje; o Stand não tem serviços repetidos nem avisos.

import { aplicarAvanco } from './cronograma.js'
import { addDias, diaDaSemana, difDias, maxData, minData } from './datas.js'

export const mockObras = [
  { id: 'o1', nome: 'Loteamento Jardim das Palmeiras', cliente: 'Construtora Horizonte', tipo: 'Loteamento', cidade: 'Itu/SP', data_inicio: '2026-08-03', data_termino_prevista: '2027-01-30', status: 'Em andamento', revisao_atual: 2, importado_em: '2026-10-05T08:30:00', created_at: '2026-07-20T10:00:00' },
  { id: 'o2', nome: 'Stand de Vendas Residencial Aurora', cliente: 'Aurora Incorporadora', tipo: 'Stand de vendas', cidade: 'Sorocaba/SP', data_inicio: '2026-09-14', data_termino_prevista: '2026-12-20', status: 'Em andamento', revisao_atual: 1, importado_em: '2026-09-10T17:00:00', created_at: '2026-09-01T10:00:00' },
  { id: 'o3', nome: 'Loteamento Vale Verde', cliente: 'Vale Verde Empreendimentos', tipo: 'Loteamento', cidade: 'Salto/SP', data_inicio: '2025-03-02', data_termino_prevista: '2026-06-30', status: 'Concluída', revisao_atual: 0, importado_em: null, created_at: '2025-02-10T10:00:00' },
]

export const mockProfiles = [
  { id: 'u-gerente', nome: 'Carlos Andrade', email: 'carlos@obraprime.com.br', role: 'Gerente', ativo: true },
  { id: 'u-coord', nome: 'Fernanda Lima', email: 'fernanda@obraprime.com.br', role: 'Coordenador', ativo: true },
  { id: 'u-eng', nome: 'Rafael Souza', email: 'rafael@obraprime.com.br', role: 'Engenheiro', ativo: true },
  { id: 'u-eng2', nome: 'Juliana Prado', email: 'juliana@obraprime.com.br', role: 'Engenheiro', ativo: true },
  { id: 'u-mestre', nome: 'José Ribamar', email: 'jose.ribamar@obraprime.com.br', role: 'Mestre', ativo: true },
  { id: 'u-cliente', nome: 'Marina Costa (Construtora Horizonte)', email: 'marina@horizonte.com.br', role: 'Cliente', ativo: true },
  { id: 'u-pend', nome: 'Pedro Alves', email: 'pedro.alves@gmail.com', role: 'Pendente', ativo: true },
  { id: 'u-bloq', nome: 'Antônio Mendes', email: 'antonio@obraprime.com.br', role: 'Mestre', ativo: false },
]

export const mockMembros = [
  { id: 'm1', obra_id: 'o1', profile_id: 'u-eng' },
  { id: 'm2', obra_id: 'o1', profile_id: 'u-mestre' },
  { id: 'm3', obra_id: 'o1', profile_id: 'u-cliente' },
  { id: 'm4', obra_id: 'o2', profile_id: 'u-eng2' },
  { id: 'm5', obra_id: 'o3', profile_id: 'u-bloq' },
]

export const mockFuncoes = [
  ['Pedreiro', 'MO direta'], ['Servente', 'MO direta'], ['Carpinteiro', 'MO direta'], ['Armador', 'MO direta'],
  ['Eletricista', 'MO direta'], ['Encanador', 'MO direta'], ['Pintor', 'MO direta'], ['Operador de máquina', 'MO direta'],
  ['Motorista', 'MO direta'], ['Engenheiro', 'MO indireta'], ['Mestre', 'MO indireta'], ['Encarregado', 'MO indireta'],
  ['Técnico de segurança', 'MO indireta'], ['Almoxarife', 'MO indireta'], ['Apontador', 'MO indireta'], ['Vigia', 'MO indireta'],
].map(([nome, tipo], i) => ({ id: `f${i + 1}`, nome, tipo, ativo: true }))
const F = Object.fromEntries(mockFuncoes.map((f) => [f.nome, f.id]))

// ───────────── Cronogramas ─────────────

function resumo(obra, id, uid, eap, nome) {
  return { id, obra_id: obra, uid_project: uid, parent_id: null, eap, nivel: 1, nome, resumo: true, local: null, servico: null }
}
function folha(obra, id, uid, mae, eap, nome, local, servico, ib, tb) {
  return {
    id, obra_id: obra, uid_project: uid, parent_id: mae, eap, nivel: 2, nome, resumo: false, local, servico,
    inicio_base: ib, termino_base: tb, inicio_previsto: ib, termino_previsto: tb,
    duracao_dias: Math.max(1, Math.round((difDias(ib, tb) + 1) * 5 / 7)),
  }
}

// Obra 1 — loteamento organizado "local primeiro" (Quadra > serviço)
const quadras = ['Quadra A', 'Quadra B', 'Quadra C', 'Quadra D']
const servicosLot = ['Drenagem', 'Rede de água', 'Meio-fio', 'Pavimentação']
const datasLot = {
  'Quadra A': [['2026-08-03', '2026-08-28'], ['2026-08-24', '2026-09-18'], ['2026-09-14', '2026-10-02'], ['2026-10-05', '2026-10-30']],
  'Quadra B': [['2026-08-31', '2026-09-25'], ['2026-09-21', '2026-10-16'], ['2026-10-12', '2026-10-30'], ['2026-11-02', '2026-11-27']],
  'Quadra C': [['2026-09-28', '2026-10-23'], ['2026-10-19', '2026-11-13'], ['2026-11-02', '2026-11-10'], ['2026-11-30', '2026-12-23']],
  'Quadra D': [['2026-10-26', '2026-11-20'], ['2026-11-16', '2026-12-11'], ['2026-12-07', '2026-12-23'], ['2026-12-28', '2027-01-15']],
}
const ativObra1 = []
quadras.forEach((q, qi) => {
  const idQ = `o1-q${qi + 1}`
  ativObra1.push(resumo('o1', idQ, 100 + qi * 10, String(qi + 1), q))
  servicosLot.forEach((s, si) => {
    const [ib, tb] = datasLot[q][si]
    ativObra1.push(folha('o1', `o1-q${qi + 1}s${si + 1}`, 101 + qi * 10 + si, idQ, `${qi + 1}.${si + 1}`, s, q, s, ib, tb))
  })
})
// Uma atividade que saiu na revisão 2 (fica no histórico, riscada)
ativObra1.push({ ...folha('o1', 'o1-q3s9', 139, 'o1-q3', '3.5', 'Muro de divisa', 'Quadra C', 'Muro de divisa', '2026-10-05', '2026-10-23'), removida_na_revisao: 2 })

// Obra 2 — stand de vendas: nada se repete por local
const estruturaStand = [
  ['Fundação', [['Locação da obra', '2026-09-14', '2026-09-16'], ['Escavação das sapatas', '2026-09-17', '2026-09-23'], ['Concretagem das sapatas', '2026-09-24', '2026-10-02']]],
  ['Estrutura', [['Pilares', '2026-10-05', '2026-10-16'], ['Vigas e laje', '2026-10-19', '2026-11-06']]],
  ['Vedação', [['Alvenaria', '2026-11-09', '2026-11-27']]],
  ['Instalações', [['Instalações elétricas', '2026-11-16', '2026-12-04'], ['Instalações hidráulicas', '2026-11-16', '2026-12-04']]],
  ['Acabamento', [['Piso e revestimento', '2026-11-30', '2026-12-15'], ['Pintura', '2026-12-07', '2026-12-18']]],
  ['Paisagismo', [['Jardim e calçada', '2026-12-14', '2026-12-20']]],
]
const ativObra2 = []
estruturaStand.forEach(([etapa, filhas], ei) => {
  const idE = `o2-e${ei + 1}`
  ativObra2.push(resumo('o2', idE, 10 + ei * 10, String(ei + 1), etapa))
  filhas.forEach(([nome, ib, tb], fi) => {
    // No stand, a folha não tem " - " e a mãe é a etapa: local = etapa, serviço = folha.
    // Como nenhum serviço se repete em dois locais, não há linha de balanço.
    ativObra2.push(folha('o2', `o2-e${ei + 1}a${fi + 1}`, 11 + ei * 10 + fi, idE, `${ei + 1}.${fi + 1}`, nome, etapa, nome, ib, tb))
  })
})

// ───────────── Avanços (histórico) ─────────────

let seqAv = 0
function av(obra, atividade, data, percentual, autor, observacao = null, foto = false) {
  seqAv++
  return {
    id: `av${seqAv}`, obra_id: obra, atividade_id: atividade, data, percentual, observacao,
    foto_url: foto ? `demo:${atividade}:${data}` : null, lancado_por: autor, created_at: `${data}T17:${String(seqAv % 60).padStart(2, '0')}:00`,
  }
}
export const mockAvancos = [
  av('o1', 'o1-q1s1', '2026-08-05', 10, 'u-eng'), av('o1', 'o1-q1s1', '2026-08-14', 40, 'u-mestre'),
  av('o1', 'o1-q1s1', '2026-08-21', 70, 'u-mestre', null, true), av('o1', 'o1-q1s1', '2026-09-02', 100, 'u-eng'),
  av('o1', 'o1-q1s2', '2026-09-04', 20, 'u-eng'), av('o1', 'o1-q1s2', '2026-09-18', 50, 'u-mestre', null, true),
  av('o1', 'o1-q1s2', '2026-10-02', 80, 'u-mestre', 'Faltou tubo DN100'),
  av('o1', 'o1-q1s3', '2026-09-28', 15, 'u-mestre'), av('o1', 'o1-q1s3', '2026-10-06', 40, 'u-mestre', null, true),
  av('o1', 'o1-q2s1', '2026-09-09', 30, 'u-eng'), av('o1', 'o1-q2s1', '2026-09-16', 70, 'u-mestre'),
  av('o1', 'o1-q2s1', '2026-09-24', 100, 'u-eng', null, true),
  av('o1', 'o1-q2s2', '2026-09-30', 40, 'u-eng'), av('o1', 'o1-q2s2', '2026-10-07', 75, 'u-eng', 'Trecho 3 em execução', true),
  av('o1', 'o1-q3s1', '2026-10-02', 15, 'u-mestre'), av('o1', 'o1-q3s1', '2026-10-08', 45, 'u-eng', null, true),
  av('o2', 'o2-e1a1', '2026-09-16', 100, 'u-eng2', null, true),
  av('o2', 'o2-e1a2', '2026-09-21', 50, 'u-eng2'), av('o2', 'o2-e1a2', '2026-09-23', 100, 'u-eng2'),
  av('o2', 'o2-e1a3', '2026-09-28', 60, 'u-eng2'), av('o2', 'o2-e1a3', '2026-10-02', 100, 'u-eng2', 'Concreto fck 25', true),
  av('o2', 'o2-e2a1', '2026-10-08', 30, 'u-eng2', 'Aço chegou com 2 dias de atraso', true),
]

// O % e as datas reais de cada atividade saem dos avanços pela mesma regra do banco.
function comAvanco(a) {
  if (a.resumo) return { ...a, percentual_realizado: 0, inicio_real: null, termino_real: null }
  return { ...a, ...aplicarAvanco(mockAvancos.filter((x) => x.atividade_id === a.id)) }
}
function completar(a, revisao) {
  return {
    inicio_base_original: a.inicio_base ?? null, termino_base_original: a.termino_base ?? null,
    inicio_base: null, termino_base: null, inicio_previsto: null, termino_previsto: null, duracao_dias: 0,
    revisao_importada: revisao, removida_na_revisao: null, created_at: '2026-09-10T17:00:00',
    ...a,
  }
}
export const mockAtividades = [
  ...ativObra1.map((a) => completar(comAvanco(a), 2)),
  ...ativObra2.map((a) => completar(comAvanco(a), 1)),
]
// As atividades-resumo levam as datas das filhas, como no MS Project.
for (const r of mockAtividades.filter((a) => a.resumo)) {
  const filhas = mockAtividades.filter((a) => a.parent_id === r.id && a.removida_na_revisao == null)
  for (const campo of ['inicio_base', 'inicio_previsto', 'inicio_base_original']) r[campo] = minData(filhas.map((f) => f[campo]))
  for (const campo of ['termino_base', 'termino_previsto', 'termino_base_original']) r[campo] = maxData(filhas.map((f) => f[campo]))
  r.duracao_dias = Math.round((difDias(r.inicio_base, r.termino_base) + 1) * 5 / 7)
}

// ───────────── Restrições ─────────────

export const mockRestricoes = [
  { id: 'r1', obra_id: 'o1', atividade_id: 'o1-q1s4', tipo: 'Material', descricao: 'Usina sem data de entrega de CBUQ', responsavel: 'Rafael Souza', data_limite: '2026-10-03', status: 'Aberta', removida_em: null, criado_por: 'u-eng', created_at: '2026-09-25T10:00:00' },
  { id: 'r2', obra_id: 'o1', atividade_id: 'o1-q2s3', tipo: 'Mão de obra', descricao: 'Contratar segunda equipe de meio-fio', responsavel: 'Carlos Andrade', data_limite: '2026-10-13', status: 'Aberta', removida_em: null, criado_por: 'u-gerente', created_at: '2026-10-01T10:00:00' },
  { id: 'r3', obra_id: 'o1', atividade_id: 'o1-q3s2', tipo: 'Licença/liberação', descricao: 'Aprovação do projeto na SAAE', responsavel: 'Fernanda Lima', data_limite: '2026-10-30', status: 'Aberta', removida_em: null, criado_por: 'u-coord', created_at: '2026-09-20T10:00:00' },
  { id: 'r4', obra_id: 'o1', atividade_id: 'o1-q1s2', tipo: 'Material', descricao: 'Tubo DN100', responsavel: 'Rafael Souza', data_limite: '2026-10-01', status: 'Removida', removida_em: '2026-10-03', criado_por: 'u-eng', created_at: '2026-09-22T10:00:00' },
  { id: 'r5', obra_id: 'o1', atividade_id: 'o1-q2s4', tipo: 'Projeto', descricao: 'Revisão do greide', responsavel: 'Rafael Souza', data_limite: '2026-10-20', status: 'Aberta', removida_em: null, criado_por: 'u-eng', created_at: '2026-10-02T10:00:00' },
  { id: 'r6', obra_id: 'o2', atividade_id: 'o2-e2a2', tipo: 'Material', descricao: 'Entrega do aço CA-50 para as vigas', responsavel: 'Juliana Prado', data_limite: '2026-10-14', status: 'Aberta', removida_em: null, criado_por: 'u-eng2', created_at: '2026-10-06T10:00:00' },
]

// ───────────── Tarefas (semana e dia) ─────────────

let seqT = 0
function tarefa(obra, data, descricao, responsavel, atividade, situacao, motivo = null, autor = 'u-eng') {
  seqT++
  return { id: `t${seqT}`, obra_id: obra, atividade_id: atividade, data, descricao, responsavel, situacao, motivo_nao_feito: motivo, criado_por: autor, created_at: `${data}T07:00:00` }
}
const ok = 'Feito'
const nf = 'Não feito'
const pl = 'Planejada'
export const mockTarefas = [
  // obra 1 — semana de 14/09: 100%
  ...['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19'].map((d, i) =>
    tarefa('o1', d, `Rede de água Quadra A, trecho ${i + 1}`, 'Hidro Itu Ltda', 'o1-q1s2', ok)),
  // semana de 21/09: 5 de 7
  tarefa('o1', '2026-09-21', 'Drenagem Quadra B, PV 4 a 6', 'Equipe própria', 'o1-q2s1', ok),
  tarefa('o1', '2026-09-22', 'Drenagem Quadra B, PV 7 a 9', 'Equipe própria', 'o1-q2s1', ok),
  tarefa('o1', '2026-09-22', 'Locação meio-fio Quadra A', 'Equipe Silva', 'o1-q1s3', nf, 'Mão de obra'),
  tarefa('o1', '2026-09-23', 'Rede de água Quadra A, trecho 7', 'Hidro Itu Ltda', 'o1-q1s2', ok),
  tarefa('o1', '2026-09-24', 'Rede de água Quadra B, trecho 1', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-09-25', 'Fechar vala Quadra B', 'Equipe própria', 'o1-q2s1', ok),
  tarefa('o1', '2026-09-26', 'Assentar meio-fio Quadra A, rua 1', 'Equipe Silva', 'o1-q1s3', nf, 'Clima'),
  // semana de 28/09: 6 de 8 (75%)
  tarefa('o1', '2026-09-28', 'Assentar meio-fio Quadra A, rua 1', 'Equipe Silva', 'o1-q1s3', ok),
  tarefa('o1', '2026-09-29', 'Rede de água Quadra B, trecho 2', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-09-29', 'Escavação drenagem Quadra C', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-09-30', 'Rede de água Quadra A, trecho 8', 'Hidro Itu Ltda', 'o1-q1s2', nf, 'Material'),
  tarefa('o1', '2026-10-01', 'Drenagem Quadra C, PV 1 a 3', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-10-01', 'Rede de água Quadra B, trecho 3', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-10-02', 'Assentar meio-fio Quadra A, rua 2', 'Equipe Silva', 'o1-q1s3', ok),
  tarefa('o1', '2026-10-03', 'Drenagem Quadra C, PV 4', 'Equipe própria', 'o1-q3s1', nf, 'Clima'),
  // semana atual (05/10)
  tarefa('o1', '2026-10-05', 'Drenagem Quadra C, PV 5 a 7', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-10-05', 'Rede de água Quadra B, trecho 3', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-10-05', 'Assentar meio-fio Quadra A, rua 2', 'Equipe Silva', 'o1-q1s3', ok),
  tarefa('o1', '2026-10-06', 'Rede de água Quadra A, trecho 8', 'Hidro Itu Ltda', 'o1-q1s2', nf, 'Material'),
  tarefa('o1', '2026-10-06', 'Drenagem Quadra C, PV 8', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-10-06', 'Assentar meio-fio Quadra A, rua 3', 'Equipe Silva', 'o1-q1s3', ok),
  tarefa('o1', '2026-10-07', 'Rede de água Quadra B, trecho 4', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-10-07', 'Drenagem Quadra C, PV 9', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-10-08', 'Drenagem Quadra C, PV 10 e 11', 'Equipe própria', 'o1-q3s1', ok),
  tarefa('o1', '2026-10-08', 'Assentar meio-fio Quadra A, rua 4', 'Equipe Silva', 'o1-q1s3', nf, 'Mão de obra'),
  tarefa('o1', '2026-10-08', 'Rede de água Quadra B, trecho 5', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-10-09', 'Assentar meio-fio Quadra A, rua 2', 'Equipe Silva', 'o1-q1s3', pl),
  tarefa('o1', '2026-10-09', 'Rede de água Quadra B, trecho 3', 'Hidro Itu Ltda', 'o1-q2s2', ok),
  tarefa('o1', '2026-10-09', 'Escavação drenagem Quadra C', 'Equipe própria', 'o1-q3s1', nf, 'Clima'),
  tarefa('o1', '2026-10-10', 'Limpeza de valas Quadra C', 'Equipe própria', 'o1-q3s1', pl),
  tarefa('o1', '2026-10-10', 'Rede de água Quadra B, trecho 6', 'Hidro Itu Ltda', 'o1-q2s2', pl),
  // obra 2
  tarefa('o2', '2026-09-28', 'Concretar sapatas S1 a S6', 'Concreteira Sorocaba', 'o2-e1a3', ok, null, 'u-eng2'),
  tarefa('o2', '2026-09-30', 'Concretar sapatas S7 a S12', 'Concreteira Sorocaba', 'o2-e1a3', ok, null, 'u-eng2'),
  tarefa('o2', '2026-10-02', 'Desforma das sapatas', 'Equipe própria', 'o2-e1a3', nf, 'Clima', 'u-eng2'),
  tarefa('o2', '2026-10-05', 'Armação pilares P1 a P4', 'Equipe própria', 'o2-e2a1', ok, null, 'u-eng2'),
  tarefa('o2', '2026-10-07', 'Forma pilares P1 a P4', 'Equipe própria', 'o2-e2a1', ok, null, 'u-eng2'),
  tarefa('o2', '2026-10-09', 'Concretar pilares P1 a P4', 'Concreteira Sorocaba', 'o2-e2a1', pl, null, 'u-eng2'),
]

// ───────────── Efetivo ─────────────

let seqE = 0
function linha(obra, data, tipo, funcao, quantidade, atividade = null, empresa = null) {
  seqE++
  return { id: `e${seqE}`, obra_id: obra, data, tipo, funcao_id: F[funcao], atividade_id: atividade, empresa, quantidade, lancado_por: 'u-mestre', created_at: `${data}T08:15:00` }
}
function diasUteis(de, ate) {
  const out = []
  for (let d = de; d <= ate; d = addDias(d, 1)) if (diaDaSemana(d) !== 0) out.push(d)
  return out
}
const varia = (d, base, amp) => base + ((Number(d.slice(8, 10)) * 7) % (amp * 2 + 1)) - amp

export const mockEfetivos = [
  ...diasUteis('2026-09-21', '2026-10-08').flatMap((d) => {
    const sabado = diaDaSemana(d) === 6
    return [
      linha('o1', d, 'MO direta', 'Pedreiro', sabado ? 2 : varia(d, 4, 1), 'o1-q1s3'),
      linha('o1', d, 'MO direta', 'Servente', sabado ? 4 : varia(d, 8, 2), 'o1-q3s1'),
      linha('o1', d, 'MO direta', 'Operador de máquina', sabado ? 1 : 2, 'o1-q3s1'),
      linha('o1', d, 'MO indireta', 'Mestre', 1),
      linha('o1', d, 'MO indireta', 'Encarregado', sabado ? 1 : 2),
      linha('o1', d, 'MO indireta', 'Vigia', 1),
      linha('o1', d, 'Terceirizado', 'Encanador', sabado ? 3 : 5, 'o1-q2s2', 'Hidro Itu Ltda'),
    ]
  }),
  ...diasUteis('2026-10-05', '2026-10-09').flatMap((d) => [
    linha('o2', d, 'MO direta', 'Armador', 4, 'o2-e2a1'),
    linha('o2', d, 'MO direta', 'Carpinteiro', 3, 'o2-e2a1'),
    linha('o2', d, 'MO direta', 'Servente', 2, 'o2-e2a1'),
    linha('o2', d, 'MO indireta', 'Encarregado', 1),
  ]),
]

// ───────────── Avisos ─────────────

export const mockAvisos = [
  { id: 'v1', obra_id: 'o1', titulo: 'DDS toda segunda às 7h', texto: 'Diálogo diário de segurança no contêiner da obra, com toda a equipe e terceirizados.', fixado: true, autor_id: 'u-gerente', created_at: '2026-10-01T07:30:00' },
  { id: 'v2', obra_id: 'o1', titulo: 'Visita da prefeitura na quinta 15/10', texto: 'Fiscalização da drenagem das Quadras A e B. Deixar as caixas de inspeção abertas.', fixado: false, autor_id: 'u-coord', created_at: '2026-10-07T14:00:00' },
  { id: 'v3', obra_id: 'o1', titulo: 'Chuva prevista para sábado', texto: 'Proteger as valas abertas da Quadra C na sexta à tarde.', fixado: false, autor_id: 'u-eng', created_at: '2026-10-08T16:20:00' },
]
