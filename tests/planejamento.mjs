// Planejamento: janela de 3 meses, restrições, semana, % cumprido e alerta de efetivo.
import {
  janelaSemanas, estadoRestricao, restricoesAbertasPorAtividade, resumoTarefas,
  resumoSemana, semanaPassada, alertaEfetivo,
} from '../src/lib/planejamento.js'
import { inicioSemana, addDias, difDias, fmtData } from '../src/lib/datas.js'

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

const hoje = '2026-10-09' // sexta
conferir('semana começa na segunda', inicioSemana(hoje), '2026-10-05')
conferir('domingo pertence à semana que começou na segunda anterior', inicioSemana('2026-10-11'), '2026-10-05')
conferir('somar dias atravessa o mês', addDias('2026-10-30', 3), '2026-11-02')
conferir('diferença de dias', difDias('2026-10-05', '2026-10-30'), 25)
conferir('data no formato brasileiro', fmtData('2026-10-09'), '09/10/2026')

const fls = [
  { id: 'a', inicio_previsto: '2026-10-01', termino_previsto: '2026-10-20', percentual_realizado: 40 },
  { id: 'b', inicio_previsto: '2026-12-20', termino_previsto: '2027-01-10', percentual_realizado: 0 },
  { id: 'c', inicio_previsto: '2026-10-01', termino_previsto: '2026-10-20', percentual_realizado: 100 },
]
const jan = janelaSemanas(fls, hoje)
conferir('janela tem 12 semanas', jan.length, 12)
conferir('atividade aparece em toda semana que atravessa', jan.filter((s) => s.atividades.some((a) => a.id === 'a')).length, 3)
conferir('concluída não aparece na janela', jan.some((s) => s.atividades.some((a) => a.id === 'c')), false)
conferir('fora dos 3 meses... a 12ª semana ainda alcança 20/12', jan[11].atividades.map((a) => a.id), ['b'])

conferir('restrição vencida', estadoRestricao({ status: 'Aberta', data_limite: '2026-10-03' }, hoje), 'vencida')
conferir('restrição que vence em 4 dias = próxima', estadoRestricao({ status: 'Aberta', data_limite: '2026-10-13' }, hoje), 'proxima')
conferir('restrição longe = aberta', estadoRestricao({ status: 'Aberta', data_limite: '2026-10-30' }, hoje), 'aberta')
conferir('removida é removida mesmo vencida', estadoRestricao({ status: 'Removida', data_limite: '2026-10-01' }, hoje), 'removida')
const porAtiv = restricoesAbertasPorAtividade([
  { atividade_id: 'a', status: 'Aberta' }, { atividade_id: 'a', status: 'Aberta' }, { atividade_id: 'a', status: 'Removida' },
])
conferir('conta só restrições abertas por atividade', porAtiv.get('a'), 2)

const tarefas = [
  { data: '2026-09-29', situacao: 'Feito' }, { data: '2026-09-30', situacao: 'Não feito' },
  { data: '2026-10-01', situacao: 'Planejada' }, { data: '2026-10-02', situacao: 'Feito' },
  { data: '2026-10-05', situacao: 'Feito' }, { data: '2026-10-06', situacao: 'Não feito' },
  { data: '2026-10-09', situacao: 'Planejada' }, { data: '2026-10-10', situacao: 'Planejada' },
]
conferir('% cumprido: feitas ÷ planejadas (pendente conta como não feita)', resumoTarefas(tarefas.slice(0, 4)).pct, 50)
conferir('semana sem tarefas não vira 0%', resumoTarefas([]).pct, null)
const sem = resumoSemana(tarefas, hoje)
conferir('semana atual: até hoje (seg a sex)', [sem.ateHoje.total, sem.ateHoje.feitas, sem.ateHoje.pct], [3, 1, 33])
conferir('semana atual: sábado é futuro e conta como restante', [sem.dias[5].futuro, sem.restantes], [true, 1])
conferir('semana passada', [semanaPassada(tarefas, hoje).inicio, semanaPassada(tarefas, hoje).pct], ['2026-09-28', 50])

conferir('alerta: sexta 11h sem efetivo', alertaEfetivo(hoje, 11, false), true)
conferir('alerta: antes das 10h não', alertaEfetivo(hoje, 9, false), false)
conferir('alerta: domingo não', alertaEfetivo('2026-10-11', 15, false), false)
conferir('alerta: com efetivo lançado não', alertaEfetivo(hoje, 15, true), false)

console.log(`${ok}/${tot} — planejamento`)
process.exit(ok === tot ? 0 : 1)
