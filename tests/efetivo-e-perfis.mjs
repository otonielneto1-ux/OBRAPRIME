// Efetivo diário e a matriz de permissões.
import { validarLinhaEfetivo, totaisEfetivo, copiarLinhas, topFuncoes, pessoasPorAtividade } from '../src/lib/efetivo.js'
import { pode, shellDoPerfil, obrasVisiveis, ordenarObras } from '../src/lib/perfis.js'

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

const base = { tipo: 'MO direta', funcao_id: 'f1', atividade_id: 'a1', quantidade: 4 }
conferir('linha completa passa', validarLinhaEfetivo(base), null)
conferir('MO direta sem atividade não passa', validarLinhaEfetivo({ ...base, atividade_id: null }) !== null, true)
conferir('MO indireta sem atividade passa', validarLinhaEfetivo({ ...base, tipo: 'MO indireta', atividade_id: null }), null)
conferir('terceirizado sem empresa não passa', validarLinhaEfetivo({ ...base, tipo: 'Terceirizado', empresa: '  ' }) !== null, true)
conferir('quantidade zero não passa', validarLinhaEfetivo({ ...base, quantidade: 0 }) !== null, true)
conferir('quantidade quebrada não passa', validarLinhaEfetivo({ ...base, quantidade: 2.5 }) !== null, true)
conferir('tipo fora da lista não passa', validarLinhaEfetivo({ ...base, tipo: 'mo direta' }) !== null, true)

const dia = [
  { tipo: 'MO direta', funcao_id: 'pedreiro', atividade_id: 'a1', quantidade: 4 },
  { tipo: 'MO direta', funcao_id: 'servente', atividade_id: 'a2', quantidade: 8 },
  { tipo: 'MO indireta', funcao_id: 'mestre', quantidade: 1 },
  { tipo: 'Terceirizado', funcao_id: 'encanador', empresa: 'Hidro', atividade_id: 'a1', quantidade: 5 },
]
conferir('totais por tipo', totaisEfetivo(dia), { total: 18, porTipo: { 'MO direta': 12, 'MO indireta': 1, Terceirizado: 5 } })
conferir('funções com mais gente', topFuncoes(dia, (id) => id, 2).map((f) => f.nome), ['servente', 'encanador'])
conferir('copiar de ontem troca a data e tira o id', copiarLinhas([{ ...dia[0], id: 'x', data: '2026-10-08' }], '2026-10-09')[0],
  { tipo: 'MO direta', funcao_id: 'pedreiro', atividade_id: 'a1', empresa: null, quantidade: 4, data: '2026-10-09' })
conferir('pessoas por atividade (pergunta de um ano)', pessoasPorAtividade(dia).get('a1'), 9)

const g = { id: 'g', role: 'Gerente', ativo: true }
const m = { id: 'm', role: 'Mestre', ativo: true }
const cl = { id: 'c', role: 'Cliente', ativo: true }
const e = { id: 'e', role: 'Engenheiro', ativo: true }
conferir('só o gerente apaga', [pode(g, 'apagar'), pode(e, 'apagar'), pode(m, 'apagar')], [true, false, false])
conferir('mestre lança avanço e efetivo, mas não cria restrição nem planeja', [pode(m, 'lancarAvanco'), pode(m, 'lancarEfetivo'), pode(m, 'editarRestricao'), pode(m, 'planejarSemana')], [true, true, false, false])
conferir('cliente não vê planejamento nem efetivo', [pode(cl, 'verPlanejamento'), pode(cl, 'verEfetivo')], [false, false])
conferir('bloqueado não pode nada', pode({ ...g, ativo: false }, 'apagar'), false)
conferir('cada perfil entra na sua shell', [g, m, cl, { role: 'Pendente', ativo: true }].map(shellDoPerfil), ['equipe', 'mestre', 'cliente', 'aguardando'])

const obras = [{ id: 1, nome: 'B', status: 'Concluída' }, { id: 2, nome: 'A', status: 'Em andamento' }, { id: 3, nome: 'C', status: 'Em andamento' }]
const membros = [{ obra_id: 2, profile_id: 'e' }]
conferir('engenheiro só vê a obra vinculada', obrasVisiveis(e, obras, membros).map((o) => o.id), [2])
conferir('gerente vê todas', obrasVisiveis(g, obras, membros).length, 3)
conferir('pendente não vê nenhuma', obrasVisiveis({ role: 'Pendente', ativo: true }, obras, membros).length, 0)
conferir('em andamento primeiro', ordenarObras(obras).map((o) => o.id), [2, 3, 1])

console.log(`${ok}/${tot} — efetivo e perfis`)
process.exit(ok === tot ? 0 : 1)
