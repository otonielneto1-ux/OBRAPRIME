// Regras do cronograma: previsto, realizado, situação, curva S, linha de balanço.
import {
  pctPrevisto, pctRealizadoEm, aplicarAvanco, situacao, avancoObra, curvaS,
  chaveLocal, linhaBalanco, compararEap, folhas, atrasadas,
} from '../src/lib/cronograma.js'

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

const pav = { inicio_base: '2026-10-05', termino_base: '2026-10-30' }
conferir('antes do início, previsto 0', pctPrevisto(pav, '2026-10-04'), 0)
conferir('no meio, linha reta (4 de 25 dias = 16%)', pctPrevisto(pav, '2026-10-09'), 16)
conferir('no dia do término, 100', pctPrevisto(pav, '2026-10-30'), 100)
conferir('marco (início = término) vira 100 no dia', pctPrevisto({ inicio_base: '2026-07-01', termino_base: '2026-07-01' }, '2026-07-01'), 100)
conferir('sem linha de base, previsto 0', pctPrevisto({}, '2026-10-09'), 0)

const avs = [
  { data: '2026-09-18', percentual: 50, created_at: '1' },
  { data: '2026-10-02', percentual: 80, created_at: '2' },
]
conferir('realizado é o último lançamento até a data', pctRealizadoEm(avs, '2026-09-30'), 50)
conferir('antes do primeiro lançamento, 0', pctRealizadoEm(avs, '2026-09-01'), 0)
conferir('banco: % = último, início real = primeiro > 0, sem término', aplicarAvanco(avs),
  { percentual_realizado: 80, inicio_real: '2026-09-18', termino_real: null })
conferir('banco: chegou a 100 grava término real',
  aplicarAvanco([...avs, { data: '2026-10-07', percentual: 100, created_at: '3' }]).termino_real, '2026-10-07')
conferir('banco: lançamento corrigido para baixo depois do 100 tira o término',
  aplicarAvanco([...avs, { data: '2026-10-07', percentual: 100, created_at: '3' }, { data: '2026-10-08', percentual: 90, created_at: '4' }]).termino_real, null)

const hoje = '2026-10-09'
conferir('real abaixo do previsto = Atrasada', situacao({ ...pav, percentual_realizado: 0 }, hoje), 'Atrasada')
conferir('real acima do previsto = No prazo', situacao({ ...pav, percentual_realizado: 20 }, hoje), 'No prazo')
conferir('100% = Concluída', situacao({ ...pav, percentual_realizado: 100 }, hoje), 'Concluída')
conferir('ainda não começou = Não iniciada', situacao({ inicio_base: '2026-11-01', termino_base: '2026-11-10', percentual_realizado: 0 }, hoje), 'Não iniciada')
conferir('removida numa revisão = Removida', situacao({ ...pav, removida_na_revisao: 2 }, hoje), 'Removida')

const fls = [
  { id: 'a', resumo: false, duracao_dias: 30, inicio_base: '2026-09-01', termino_base: '2026-09-30', percentual_realizado: 100 },
  { id: 'b', resumo: false, duracao_dias: 10, inicio_base: '2026-10-01', termino_base: '2026-10-11', percentual_realizado: 0 },
  { id: 'r', resumo: true, duracao_dias: 40 },
  { id: 'x', resumo: false, duracao_dias: 99, removida_na_revisao: 2 },
]
conferir('folhas: sem resumo e sem removidas', folhas(fls).map((a) => a.id), ['a', 'b'])
const av = avancoObra(folhas(fls), '2026-10-11')
conferir('avanço da obra ponderado pela duração', av, { previsto: 100, realizado: 75 })
conferir('atrasadas: só a que está abaixo do previsto', atrasadas(folhas(fls), '2026-10-06').map((a) => a.id), ['b'])

const curva = curvaS(folhas(fls), [{ atividade_id: 'a', data: '2026-09-30', percentual: 100 }], '2026-10-09')
conferir('curva S começa na segunda da primeira semana', curva[0].inicio, '2026-08-31')
const curvaAntes = curvaS(folhas(fls), [], '2026-09-20')
conferir('curva S: semana futura sem realizado', curvaAntes[curvaAntes.length - 1].realizado, null)
conferir('curva S: semana atual usa o realizado de hoje', curva.find((p) => p.inicio === '2026-10-05').realizado, 75)

conferir('chave do local junta jeitos diferentes de escrever',
  chaveLocal('Rua 03, Rua 04 e Rua 06'), chaveLocal('Rua 03, 04 e 06'))
conferir('chave do local ignora acento e caixa', chaveLocal('Área Comum'), chaveLocal('AREA COMUM'))
conferir('EAP compara como número', ['1.10', '1.9', '1.2.1'].sort(compararEap), ['1.2.1', '1.9', '1.10'])

// Serviço primeiro (o XML real): SUBLEITO e BASE em dois trechos cada.
const lob = linhaBalanco([
  { id: 1, eap: '2.9.1.1.1', servico: 'SUBLEITO', local: 'Rua 03, Rua 04 e Rua 06', inicio_base: '2026-09-14', termino_base: '2026-09-21', percentual_realizado: 100, termino_real: '2026-09-22' },
  { id: 2, eap: '2.9.1.1.2', servico: 'SUBLEITO', local: 'Rua 08', inicio_base: '2026-10-01', termino_base: '2026-10-02', percentual_realizado: 0 },
  { id: 3, eap: '2.9.2.1.1', servico: 'BASE', local: 'Rua 03, 04 e 06', inicio_base: '2026-10-05', termino_base: '2026-10-09', percentual_realizado: 0 },
  { id: 4, eap: '2.9.2.1.2', servico: 'BASE', local: 'Rua 08', inicio_base: '2026-09-25', termino_base: '2026-09-28', percentual_realizado: 0 },
  { id: 5, eap: '9.1', servico: 'PISCINA', local: 'Beach Lounge', inicio_base: '2026-10-05', termino_base: '2026-10-09', percentual_realizado: 0 },
], '2026-10-09')
conferir('LOB: dois locais, escrita diferente vira o mesmo trecho', lob.locais.map((l) => l.nome), ['Rua 03, Rua 04 e Rua 06', 'Rua 08'])
conferir('LOB: serviço que só aparece num local fica de fora', lob.servicos.map((s) => s.nome), ['SUBLEITO', 'BASE'])
conferir('LOB: trecho atrasado marcado', lob.servicos[0].pontos[1].atrasada, true)
conferir('LOB: ordem trocada entre trechos = colisão', lob.colisoes.length, 1)

console.log(`${ok}/${tot} — cronograma`)
process.exit(ok === tot ? 0 : 1)
