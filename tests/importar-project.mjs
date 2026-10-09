// Leitura do XML do MS Project e plano de reimportação.
import { lerProjectXML, montarAtividades, planejarImportacao, duracaoEmHoras, localEServico } from '../src/lib/importarProject.js'

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

// Recorte no formato do XML real (Baseline 0 e 1, TimephasedData com <Start> dentro).
const xml = `<?xml version="1.0"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Title>LOTEAMENTO TESTE</Title>
  <MinutesPerDay>480</MinutesPerDay>
  <Tasks>
    <Task><UID>0</UID><Name>LOTEAMENTO TESTE</Name><OutlineNumber>0</OutlineNumber><OutlineLevel>0</OutlineLevel><Summary>1</Summary><Start>2026-07-01T09:00:00</Start><Finish>2027-01-01T18:00:00</Finish></Task>
    <Task><UID>5</UID><Name>PAVIMENTA&#199;&#195;O</Name><OutlineNumber>1</OutlineNumber><OutlineLevel>1</OutlineLevel><Summary>1</Summary><Start>2026-09-14T09:00:00</Start><Finish>2026-10-09T18:00:00</Finish><Duration>PT160H0M0S</Duration></Task>
    <Task><UID>6</UID><Name>SUBLEITO</Name><OutlineNumber>1.1</OutlineNumber><OutlineLevel>2</OutlineLevel><Summary>1</Summary><Start>2026-09-14T09:00:00</Start><Finish>2026-10-09T18:00:00</Finish><Duration>PT160H0M0S</Duration></Task>
    <Task><UID>7</UID><Name>Execução de Subleito - Rua 03 &amp; Rua 04</Name><OutlineNumber>1.1.1</OutlineNumber><OutlineLevel>3</OutlineLevel><Summary>0</Summary>
      <Start>2026-09-15T09:00:00</Start><Finish>2026-09-22T18:00:00</Finish><Duration>PT48H0M0S</Duration>
      <ExtendedAttribute><FieldID>1</FieldID><Value>2017-08-07T09:00:00</Value></ExtendedAttribute>
      <Baseline><Number>1</Number><Start>2024-01-01T09:00:00</Start><Finish>2024-01-05T18:00:00</Finish></Baseline>
      <Baseline><Number>0</Number><Start>2026-09-14T09:00:00</Start><Finish>2026-09-21T18:00:00</Finish></Baseline>
      <TimephasedData><Type>9</Type><UID>7</UID><Start>2020-01-01T09:00:00</Start><Finish>2020-01-02T09:00:00</Finish></TimephasedData>
    </Task>
    <Task><UID>8</UID><Name>Execução de Subleito - Rua 08</Name><OutlineNumber>1.1.2</OutlineNumber><OutlineLevel>3</OutlineLevel><Summary>0</Summary><Start>2026-10-01T09:00:00</Start><Finish>2026-10-02T18:00:00</Finish><Duration>PT16H0M0S</Duration></Task>
    <Task><UID>9</UID><Name>Tarefa inativa</Name><OutlineNumber>1.1.3</OutlineNumber><OutlineLevel>3</OutlineLevel><Active>0</Active><Summary>0</Summary><Start>2026-10-01T09:00:00</Start><Finish>2026-10-02T18:00:00</Finish></Task>
  </Tasks>
</Project>`

const lido = lerProjectXML(xml)
conferir('lê o XML', lido.ok, true)
conferir('ignora a tarefa 0 (o projeto) e a inativa', lido.tarefas.map((t) => t.uid), [5, 6, 7, 8])
conferir('decodifica acento e &amp;', [lido.tarefas[0].nome, lido.tarefas[2].nome], ['PAVIMENTAÇÃO', 'Execução de Subleito - Rua 03 & Rua 04'])
const t7 = lido.tarefas[2]
conferir('usa a linha de base 0, não a 1', [t7.inicio_base, t7.termino_base], ['2026-09-14', '2026-09-21'])
conferir('datas atuais não pegam as do TimephasedData', [t7.inicio, t7.termino], ['2026-09-15', '2026-09-22'])
conferir('duração em dias de trabalho (48h / 8h)', t7.duracao_dias, 6)
conferir('tarefa sem linha de base usa as datas atuais e é contada', [lido.semLinhaBase, lido.tarefas[3].inicio_base], [3, '2026-10-01'])

conferir('arquivo que não é do Project é recusado', lerProjectXML('<html></html>').ok, false)
conferir('XML do Project sem tarefas é recusado', lerProjectXML('<Project><Tasks></Tasks></Project>').ok, false)
conferir('duração ISO com dias', duracaoEmHoras('P1DT4H'), 28)

conferir('serviço primeiro: serviço é a mãe, local vem depois do " - "',
  localEServico('Execução de Base - Rua 03, 04 e 06', 'BASE'), { local: 'Rua 03, 04 e 06', servico: 'BASE' })
conferir('local primeiro: local é a mãe, serviço é a folha',
  localEServico('Drenagem', 'Quadra A'), { local: 'Quadra A', servico: 'Drenagem' })

const ativs = montarAtividades(lido.tarefas)
const a7 = ativs.find((a) => a.uid_project === 7)
conferir('folha ganha local, serviço e a EAP da mãe', [a7.local, a7.servico, a7.eap_mae], ['Rua 03 & Rua 04', 'SUBLEITO', '1.1'])
conferir('resumo não tem local nem serviço', [ativs[0].local, ativs[0].servico], [null, null])

// Reimportação
const existentes = [
  { id: 'x7', uid_project: 7, percentual_realizado: 60, inicio_base_original: '2026-09-10', termino_base_original: '2026-09-18', removida_na_revisao: null },
  { id: 'x99', uid_project: 99, percentual_realizado: 20, removida_na_revisao: null },
]
const plano = planejarImportacao(existentes, ativs, 2)
conferir('reimportação: novas entram', plano.inserir.map((a) => a.uid_project), [5, 6, 8])
conferir('reimportação: existente é atualizada pelo UID', plano.atualizar.map((a) => a.id), ['x7'])
conferir('reimportação: atualizar NÃO mexe no avanço nem na base original',
  ['percentual_realizado', 'inicio_base_original', 'termino_base_original'].some((k) => k in plano.atualizar[0].campos), false)
conferir('reimportação: a que sumiu é marcada como removida, não apagada', plano.remover, ['x99'])
conferir('nova nasce com a base original igual à atual', [plano.inserir[2].inicio_base_original, plano.inserir[2].revisao_importada], ['2026-10-01', 2])
conferir('resumo conta serviços repetidos e locais', [plano.resumo.servicosRepetidos.length, plano.resumo.qtdLocais], [1, 2])

console.log(`${ok}/${tot} — importar-project`)
process.exit(ok === tot ? 0 : 1)
