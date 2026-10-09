// Acerto inicial do avanço e resumo de cada obra (visão geral).
import { candidatasAcerto, planoAcerto, etapaDe, nomeAtividade } from '../src/lib/cronograma.js'
import { resumoObra } from '../src/lib/resumoObras.js'
import { pode } from '../src/lib/perfis.js'

let ok = 0
let tot = 0
function conferir(descricao, real, esperado) {
  tot++
  if (JSON.stringify(real) === JSON.stringify(esperado)) ok++
  else {
    console.log(`  ✗ ${descricao}`)
    console.log(`     esperado: ${JSON.stringify(esperado)}`)
    console.log(`     veio:     ${JSON.stringify(real)}`)
  }
}

const hoje = '2026-10-09'
const ativs = [
  { id: 'g', nome: 'GERAL', resumo: true, parent_id: null, eap: '2' },
  { id: 's', nome: 'SUBLEITO', resumo: true, parent_id: 'g', eap: '2.1' },
  { id: 'a', nome: 'Subleito Rua 03', resumo: false, parent_id: 's', eap: '2.1.1', inicio_base: '2026-09-14', termino_base: '2026-09-21', percentual_realizado: 0, duracao_dias: 5 },
  { id: 'b', nome: 'Subleito Rua 08', resumo: false, parent_id: 's', eap: '2.1.2', inicio_base: '2026-10-01', termino_base: '2026-10-20', percentual_realizado: 30, duracao_dias: 10 },
  { id: 'c', nome: 'Base Rua 03', resumo: false, parent_id: 's', eap: '2.1.10', inicio_base: '2026-11-01', termino_base: '2026-11-10', percentual_realizado: 0, duracao_dias: 5 },
  { id: 'd', nome: 'Limpeza', resumo: false, parent_id: 's', eap: '2.1.3', inicio_base: '2026-08-01', termino_base: '2026-08-10', percentual_realizado: 100, duracao_dias: 5 },
  { id: 'm', nome: 'Inicio Obra', resumo: false, parent_id: null, eap: '1', inicio_base: '2026-07-01', termino_base: '2026-07-01', percentual_realizado: 0, duracao_dias: 0 },
]
const porId = new Map(ativs.map((a) => [a.id, a]))
const fls = ativs.filter((a) => !a.resumo)

conferir('acerto: só o que já devia ter começado e não está em 100%', candidatasAcerto(fls, hoje).map((a) => a.id), ['m', 'a', 'b'])
conferir('etapa são os dois primeiros níveis acima', etapaDe(porId.get('a'), porId), 'GERAL › SUBLEITO')
conferir('com uma mãe só, a etapa é ela', etapaDe({ parent_id: 'g' }, porId), 'GERAL')
conferir('folha sem mãe fica "Sem etapa"', etapaDe(porId.get('m'), porId), 'Sem etapa')

const plano = planoAcerto({ a: '100', b: '30', m: '', c: '150' }, porId)
conferir('acerto: grava só o que mudou', plano.itens, [{ atividade_id: 'a', percentual: 100 }])
conferir('acerto: % fora de 0–100 vira erro', plano.erros.length, 1)

const r = resumoObra({
  atividades: ativs,
  restricoes: [{ status: 'Aberta', data_limite: '2026-10-01' }, { status: 'Aberta', data_limite: '2026-10-30' }, { status: 'Removida', data_limite: '2026-09-01' }],
  tarefas: [{ data: '2026-10-05', situacao: 'Feito' }, { data: '2026-10-06', situacao: 'Não feito' }],
  efetivo: [{ data: hoje, tipo: 'MO direta', quantidade: 7 }, { data: '2026-10-08', tipo: 'MO direta', quantidade: 9 }],
}, hoje)
conferir('resumo: restrições abertas e vencidas', [r.restricoesAbertas, r.restricoesVencidas], [2, 1])
conferir('resumo: efetivo só de hoje', r.efetivoHoje, 7)
conferir('resumo: % da semana até hoje', [r.semanaPct, r.semanaFeitas, r.semanaTotal], [50, 1, 2])
conferir('resumo: conta as atrasadas (Rua 03, Inicio Obra e Rua 08 com 30% de 42%)', r.atrasadas, 3)
const vazio = resumoObra({ atividades: [], restricoes: [], tarefas: [], efetivo: [] }, hoje)
conferir('resumo: obra sem cronograma não inventa número', [vazio.temCronograma, vazio.realizado, vazio.efetivoHoje, vazio.semanaPct], [false, null, null, null])

conferir('só gerente e coordenador veem a visão geral',
  ['Gerente', 'Coordenador', 'Engenheiro', 'Mestre'].map((role) => pode({ role, ativo: true }, 'verVisaoGeral')), [true, true, false, false])
conferir('mestre não faz acerto inicial', pode({ role: 'Mestre', ativo: true }, 'acertarAvanco'), false)

// Bug achado no XML real: "Beach Lounge › 01.01. SERVIÇOS PRELIMINARES" escondia o nome da atividade.
conferir('nome com " - " já traz o local: mostra o nome inteiro',
  nomeAtividade({ nome: 'Nivelamento e Compactação do Solo - Beach Lounge', local: 'Beach Lounge', servico: '01.01. SERVIÇOS PRELIMINARES - BEACH LOUNGE' }),
  'Nivelamento e Compactação do Solo - Beach Lounge')
conferir('local primeiro: "Quadra A › Drenagem"', nomeAtividade({ nome: 'Drenagem', local: 'Quadra A', servico: 'Drenagem' }), 'Quadra A › Drenagem')
conferir('sem local: o próprio nome', nomeAtividade({ nome: 'Inicio Obra' }), 'Inicio Obra')

console.log(`${ok}/${tot} — acerto e resumo das obras`)
process.exit(ok === tot ? 0 : 1)
