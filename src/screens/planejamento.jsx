// Planejamento: 3 meses (12 semanas com restrições), restrições e semana e dia.

import { useEffect, useRef, useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { folhas, nomeAtividade } from '../lib/cronograma.js'
import { janelaSemanas, restricoesAbertasPorAtividade, estadoRestricao, resumoTarefas, historicoSemanas } from '../lib/planejamento.js'
import { hoje, addDias, inicioSemana, fmtCurta, fmtData, nomeDia } from '../lib/datas.js'
import { TIPOS_RESTRICAO, MOTIVOS_NAO_FEITO } from '../lib/vocabulario.js'
import { Abas, Card, Tag, TOM, Icon, Vazio, Carregando, ErroBloco, Sheet, Campo, Confirmar, useCarregar, useDesktop, useToast } from '../components/index.jsx'

export default function Planejamento({ params = {} }) {
  const [aba, setAba] = useState(params.aba || '3meses')
  const h = hoje()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({
    atividades: dados.listarAtividades(),
    restricoes: dados.listarRestricoes(),
    tarefas: dados.listarTarefas({ de: addDias(inicioSemana(h), -56), ate: addDias(inicioSemana(h), 90) }),
  }))
  return (
    <>
      <Abas abas={[['3meses', '3 meses'], ['restricoes', 'Restrições'], ['semana', 'Semana e dia']]} atual={aba} onTroca={setAba} />
      {erro && <ErroBloco mensagem={erro} tentar={recarregar} />}
      {!erro && (carregando || !d) && <div className="wrap"><div className="card"><Carregando /></div></div>}
      {!erro && d && (
        <div className="wrap stack">
          {aba === '3meses' && <TresMeses d={d} recarregar={recarregar} />}
          {aba === 'restricoes' && <Restricoes d={d} recarregar={recarregar} destaque={params.destaque} />}
          {aba === 'semana' && <SemanaDia d={d} recarregar={recarregar} />}
        </div>
      )}
    </>
  )
}


// ───────────────────────── 3 meses ─────────────────────────

function TresMeses({ d, recarregar }) {
  const { usuario } = useApp()
  const h = hoje()
  const desk = useDesktop()
  const [soComRestricao, setSoComRestricao] = useState(false)
  const [semanaIdx, setSemanaIdx] = useState(0)
  const [aberta, setAberta] = useState(null)
  const [nova, setNova] = useState(null)
  const fl = folhas(d.atividades)
  if (!fl.length) return <div className="card"><Vazio icone="plan" titulo="Sem cronograma" texto="Importe o cronograma para montar a janela de 3 meses." /></div>
  const semanas = janelaSemanas(fl, h)
  const contagem = restricoesAbertasPorAtividade(d.restricoes)
  const filtrar = (lista) => (soComRestricao ? lista.filter((a) => contagem.get(a.id)) : lista)
  const total = semanas.reduce((s, x) => s + x.atividades.length, 0)

  const coluna = (s, i) => {
    const lista = filtrar(s.atividades)
    return (
      <div key={s.inicio} className={`coluna ${i === 0 ? 'atual' : ''}`}>
        <div className="coluna-h">
          <span className="lbl">Sem {i + 1}{i === 0 ? ' · atual' : ''}</span>
          <b>{fmtCurta(s.inicio)} – {fmtCurta(s.fim)}</b>
        </div>
        <div className="cartoes">
          {lista.length === 0 && <span className="info-linha" style={{ padding: 6 }}>Nada previsto</span>}
          {lista.map((a) => {
            const n = contagem.get(a.id) || 0
            return (
              <button key={a.id} type="button" className={`cartao ${n ? 'bad' : ''}`} onClick={() => setAberta(a)}>
                <b>{nomeAtividade(a)}</b>
                <small className={n ? 'r' : ''}>{n ? `${n} restrição${n > 1 ? 'ões' : ''} aberta${n > 1 ? 's' : ''}` : 'Sem restrição'}</small>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const restricoesDa = aberta ? d.restricoes.filter((r) => r.atividade_id === aberta.id) : []
  return (
    <>
      <div className="toolbar">
        <span className="info-linha">{total} atividades nas próximas 12 semanas · vermelho = com restrição aberta</span>
        <button type="button" className={`chip ${soComRestricao ? 'on' : ''}`} onClick={() => setSoComRestricao(!soComRestricao)} aria-pressed={soComRestricao}>Só com restrição</button>
      </div>
      {desk ? (
        <div className="board">{semanas.map(coluna)}</div>
      ) : (
        <>
          <div className="card datenav">
            <button type="button" disabled={semanaIdx === 0} onClick={() => setSemanaIdx(semanaIdx - 1)} aria-label="Semana anterior"><Icon nome="left" tamanho={22} /></button>
            <div className="d"><b>{fmtCurta(semanas[semanaIdx].inicio)} – {fmtCurta(semanas[semanaIdx].fim)}</b><small>Semana {semanaIdx + 1} de 12</small></div>
            <button type="button" disabled={semanaIdx === 11} onClick={() => setSemanaIdx(semanaIdx + 1)} aria-label="Próxima semana"><Icon nome="right" tamanho={22} /></button>
          </div>
          {coluna(semanas[semanaIdx], semanaIdx)}
        </>
      )}
      {aberta && (
        <Sheet aberto titulo={nomeAtividade(aberta)} subtitulo={`EAP ${aberta.eap} · ${fmtCurta(aberta.inicio_previsto)} a ${fmtData(aberta.termino_previsto)}`} onFechar={() => setAberta(null)}
          rodape={pode(usuario, 'editarRestricao') ? <button type="button" className="btn btn-primary" onClick={() => setNova({ atividade_id: aberta.id })}><Icon nome="plus" /> Adicionar restrição</button> : null}>
          {restricoesDa.length === 0 && <div className="aviso-info">Nenhuma restrição nesta atividade.</div>}
          <ul className="list">
            {restricoesDa.map((r) => <LinhaRestricao key={r.id} r={r} recarregar={recarregar} />)}
          </ul>
        </Sheet>
      )}
      {nova && <RestricaoForm inicial={nova} atividades={fl} onFechar={() => setNova(null)} onSalvo={() => { setNova(null); recarregar() }} />}
    </>
  )
}

// ───────────────────────── Restrições ─────────────────────────

function LinhaRestricao({ r, recarregar, nomeAtiv, onEditar, destaque }) {
  const { usuario } = useApp()
  const toast = useToast()
  const [excluir, setExcluir] = useState(false)
  const ref = useRef(null)
  // Veio do Painel tocando nesta restrição: rola até ela.
  useEffect(() => { if (destaque) ref.current?.scrollIntoView({ block: 'center' }) }, [destaque])
  const est = estadoRestricao(r, hoje())
  const cls = est === 'vencida' ? 'is-bad' : est === 'proxima' ? 'is-warn' : est === 'removida' ? 'is-off' : ''
  const tag = est === 'removida' ? ['ok', `Removida ${fmtCurta(r.removida_em)}`]
    : est === 'vencida' ? ['bad', `Venceu ${fmtCurta(r.data_limite)}`]
      : est === 'proxima' ? ['warn', `Vence ${fmtCurta(r.data_limite)}`] : ['idle', `Até ${fmtCurta(r.data_limite)}`]
  async function alternar() {
    const { erro } = await dados.marcarRestricaoRemovida(r.id, r.status === 'Aberta')
    if (erro) return toast(erro, { erro: true })
    toast(r.status === 'Aberta' ? 'Restrição removida' : 'Restrição reaberta')
    recarregar()
  }
  return (
    <li ref={ref} className={`row ${cls} ${destaque ? 'destaque' : ''}`} style={{ flexWrap: 'wrap' }}>
      <span className="t" style={{ minWidth: 200 }}>
        <b>{r.descricao}</b>
        <small>{nomeAtiv ? `${nomeAtiv} · ` : ''}{r.tipo} · {r.responsavel}</small>
      </span>
      <Tag tom={tag[0]}>{tag[1]}</Tag>
      {pode(usuario, 'editarRestricao') && (
        <span className="acoes">
          <button type="button" className={`btn btn-sm ${r.status === 'Aberta' ? 'btn-ok' : ''}`} onClick={alternar}>
            {r.status === 'Aberta' ? <><Icon nome="check" /> Removida</> : 'Reabrir'}
          </button>
          {onEditar && <button type="button" className="btn btn-sm" onClick={() => onEditar(r)} aria-label="Editar"><Icon nome="editar" /></button>}
          {pode(usuario, 'apagar') && <button type="button" className="btn btn-sm btn-ghost-bad" onClick={() => setExcluir(true)} aria-label="Excluir"><Icon nome="lixo" /></button>}
        </span>
      )}
      <Confirmar aberto={excluir} titulo="Excluir restrição" texto={`Excluir "${r.descricao}"? Isso não pode ser desfeito.`}
        onCancelar={() => setExcluir(false)}
        onConfirmar={async () => { const { erro } = await dados.excluirRestricao(r.id); setExcluir(false); if (erro) toast(erro, { erro: true }); else { toast('Restrição excluída'); recarregar() } }} />
    </li>
  )
}

function Restricoes({ d, recarregar, destaque }) {
  const { usuario } = useApp()
  const h = hoje()
  const [situ, setSitu] = useState('Aberta')
  const [tipo, setTipo] = useState('')
  const [resp, setResp] = useState('')
  const [form, setForm] = useState(null)
  const ativ = new Map(d.atividades.map((a) => [a.id, a]))
  const responsaveis = [...new Set(d.restricoes.map((r) => r.responsavel))].sort()
  const lista = d.restricoes
    .filter((r) => (situ === 'Todas' || r.status === situ) && (!tipo || r.tipo === tipo) && (!resp || r.responsavel === resp))
    .sort((a, b) => (a.status === b.status ? a.data_limite.localeCompare(b.data_limite) : a.status === 'Aberta' ? -1 : 1))
  const abertasVencidas = d.restricoes.filter((r) => estadoRestricao(r, h) === 'vencida').length

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          {[['Aberta', 'Abertas'], ['Removida', 'Removidas'], ['Todas', 'Todas']].map(([k, t]) => (
            <button key={k} type="button" className={`chip ${situ === k ? 'on' : ''}`} onClick={() => setSitu(k)}>
              {t}{k === 'Aberta' && abertasVencidas > 0 && <span className="c">{abertasVencidas}</span>}
            </button>
          ))}
        </div>
        {pode(usuario, 'editarRestricao') && (
          <button type="button" className="btn btn-primary" onClick={() => setForm({})}><Icon nome="plus" /> Nova restrição</button>
        )}
      </div>
      <div className="duas-col">
        <Campo rotulo="Tipo" id="f-tipo">
          <select id="f-tipo" className="ipt" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS_RESTRICAO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Responsável" id="f-resp">
          <select id="f-resp" className="ipt" value={resp} onChange={(e) => setResp(e.target.value)}>
            <option value="">Todos</option>
            {responsaveis.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>
      </div>
      <div className="card">
        {lista.length === 0
          ? <Vazio icone="check" titulo={situ === 'Aberta' ? 'Nenhuma restrição aberta. Bom sinal.' : 'Nada por aqui'} texto={situ === 'Aberta' ? 'Quando algo travar uma atividade, registre aqui com responsável e data limite.' : 'Nenhuma restrição neste filtro.'} />
          : <ul className="list">{lista.map((r) => <LinhaRestricao key={r.id} r={r} recarregar={recarregar} nomeAtiv={nomeAtividade(ativ.get(r.atividade_id))} onEditar={setForm} destaque={r.id === destaque} />)}</ul>}
      </div>
      {form && <RestricaoForm inicial={form} atividades={folhas(d.atividades)} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); recarregar() }} />}
    </>
  )
}

function RestricaoForm({ inicial, atividades, onFechar, onSalvo }) {
  const toast = useToast()
  const [r, setR] = useState({ tipo: '', descricao: '', responsavel: '', data_limite: addDias(hoje(), 7), ...inicial })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value })
  async function salvar() {
    setSalvando(true)
    const { erro: falha } = await dados.salvarRestricao(r)
    setSalvando(false)
    if (falha) return setErro(falha)
    toast(r.id ? 'Restrição atualizada' : 'Restrição criada')
    onSalvo()
  }
  return (
    <Sheet aberto titulo={r.id ? 'Editar restrição' : 'Nova restrição'} onFechar={onFechar}
      rodape={<><button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button></>}>
      <div className="form">
        <Campo rotulo="Atividade" id="r-ativ">
          <select id="r-ativ" className="ipt" value={r.atividade_id || ''} onChange={set('atividade_id')}>
            <option value="">Escolha…</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.eap} · {nomeAtividade(a)}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Tipo" id="r-tipo">
          <select id="r-tipo" className="ipt" value={r.tipo} onChange={set('tipo')}>
            <option value="">Escolha…</option>
            {TIPOS_RESTRICAO.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Descrição" id="r-desc">
          <textarea id="r-desc" className="ipt" value={r.descricao} onChange={set('descricao')} placeholder="Ex.: usina sem data de entrega do CBUQ" />
        </Campo>
        <Campo rotulo="Responsável" id="r-resp" dica="Quem vai resolver. Pode ser alguém de fora do sistema.">
          <input id="r-resp" className="ipt" value={r.responsavel} onChange={set('responsavel')} />
        </Campo>
        <Campo rotulo="Data limite" id="r-data">
          <input id="r-data" type="date" className="ipt" value={r.data_limite} onChange={set('data_limite')} />
        </Campo>
        {erro && <div className="aviso-erro">{erro}</div>}
      </div>
    </Sheet>
  )
}

// ───────────────────────── Semana e dia ─────────────────────────

export function MotivoSheet({ aberto, onEscolher, onFechar }) {
  return (
    <Sheet aberto={aberto} titulo="Por que não foi feito?" onFechar={onFechar}>
      <div className="opcoes">
        {MOTIVOS_NAO_FEITO.map((m) => <button key={m} type="button" onClick={() => onEscolher(m)}>{m}</button>)}
      </div>
    </Sheet>
  )
}

function SemanaDia({ d, recarregar }) {
  const { usuario } = useApp()
  const toast = useToast()
  const desk = useDesktop()
  const h = hoje()
  const [ini, setIni] = useState(inicioSemana(h))
  const [diaIdx, setDiaIdx] = useState(() => Math.min(6, Math.max(0, (new Date(`${h}T12:00:00`).getDay() + 6) % 7)))
  const [form, setForm] = useState(null)
  const [motivoDe, setMotivoDe] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const fl = folhas(d.atividades)
  const ativ = new Map(d.atividades.map((a) => [a.id, a]))
  const dias = Array.from({ length: 7 }, (_, i) => addDias(ini, i))
  const daSemana = d.tarefas.filter((t) => t.data >= ini && t.data <= dias[6])
  const r = resumoTarefas(daSemana)
  const hist = historicoSemanas(d.tarefas, h)

  async function marcar(t, situacao, motivo) {
    const { erro } = await dados.marcarTarefa(t.id, situacao, motivo)
    if (erro) return toast(erro, { erro: true })
    recarregar()
  }

  const blocoDia = (data) => {
    const lista = daSemana.filter((t) => t.data === data)
    return (
      <div key={data} className={`coluna ${data === h ? 'atual' : ''}`}>
        <div className="coluna-h"><span className="lbl">{nomeDia(data)}{data === h ? ' · hoje' : ''}</span><b>{fmtCurta(data)}</b></div>
        <div className="cartoes">
          {lista.length === 0 && <span className="info-linha" style={{ padding: 6 }}>Sem tarefas</span>}
          {lista.map((t) => (
            <div key={t.id} className={`tarefa ${t.situacao === 'Feito' ? 'ok' : t.situacao === 'Não feito' ? 'bad' : ''}`}>
              <b>{t.descricao}</b>
              <small>{t.responsavel}{t.atividade_id ? ` · ${nomeAtividade(ativ.get(t.atividade_id))}` : ''}</small>
              <div><Tag tom={TOM[t.situacao]}>{t.situacao}{t.motivo_nao_feito ? ` · ${t.motivo_nao_feito}` : ''}</Tag></div>
              {pode(usuario, 'marcarTarefa') && (
                <div className="botoes2">
                  <button type="button" className={`btn btn-sm ${t.situacao === 'Feito' ? 'btn-ok' : ''}`} onClick={() => marcar(t, t.situacao === 'Feito' ? 'Planejada' : 'Feito')}>Feito</button>
                  <button type="button" className={`btn btn-sm ${t.situacao === 'Não feito' ? 'btn-bad' : ''}`} onClick={() => (t.situacao === 'Não feito' ? marcar(t, 'Planejada') : setMotivoDe(t))}>Não feito</button>
                </div>
              )}
              {pode(usuario, 'planejarSemana') && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-sm" style={{ flex: 1 }} onClick={() => setForm(t)}><Icon nome="editar" /> Editar</button>
                  {pode(usuario, 'apagar') && <button type="button" className="btn btn-sm btn-ghost-bad" onClick={() => setExcluir(t)} aria-label="Excluir"><Icon nome="lixo" /></button>}
                </div>
              )}
            </div>
          ))}
          {pode(usuario, 'planejarSemana') && (
            <button type="button" className="btn btn-sm" onClick={() => setForm({ data })}><Icon nome="plus" /> Nova tarefa</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card datenav">
        <button type="button" onClick={() => setIni(addDias(ini, -7))} aria-label="Semana anterior"><Icon nome="left" tamanho={22} /></button>
        <div className="d">
          <b>{fmtCurta(ini)} – {fmtCurta(dias[6])}</b>
          <small>{r.total ? `${r.feitas} de ${r.total} tarefas feitas (${r.pct}%)` : 'Nenhuma tarefa planejada'}</small>
        </div>
        <button type="button" onClick={() => setIni(addDias(ini, 7))} aria-label="Próxima semana"><Icon nome="right" tamanho={22} /></button>
      </div>
      {desk ? <div className="dias7">{dias.map(blocoDia)}</div> : (
        <>
          <div className="chips">
            {dias.map((x, i) => (
              <button key={x} type="button" className={`chip ${i === diaIdx ? 'on' : ''}`} onClick={() => setDiaIdx(i)}>{nomeDia(x)} {fmtCurta(x)}</button>
            ))}
          </div>
          {blocoDia(dias[diaIdx])}
        </>
      )}
      <Card titulo="Histórico · % de tarefas cumpridas">
        {hist.length === 0 ? <div className="row"><span className="t muted">Ainda não há semanas fechadas.</span></div> : (
          <table className="t">
            <thead><tr><th>Semana</th><th>Planejadas</th><th>Feitas</th><th>%</th></tr></thead>
            <tbody>{hist.map((s) => (
              <tr key={s.inicio}><td>{fmtCurta(s.inicio)} – {fmtCurta(s.fim)}</td><td>{s.total}</td><td>{s.feitas}</td><td><b style={{ color: s.pct >= 80 ? 'var(--ok)' : 'var(--warn)' }}>{s.pct}%</b></td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>
      {form && <TarefaForm inicial={form} atividades={fl} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); recarregar() }} />}
      <MotivoSheet aberto={!!motivoDe} onFechar={() => setMotivoDe(null)} onEscolher={(m) => { const t = motivoDe; setMotivoDe(null); marcar(t, 'Não feito', m) }} />
      <Confirmar aberto={!!excluir} titulo="Excluir tarefa" texto={`Excluir "${excluir?.descricao}"?`} onCancelar={() => setExcluir(null)}
        onConfirmar={async () => { const { erro } = await dados.excluirTarefa(excluir.id); setExcluir(null); if (erro) toast(erro, { erro: true }); else { toast('Tarefa excluída'); recarregar() } }} />
    </>
  )
}

function TarefaForm({ inicial, atividades, onFechar, onSalvo }) {
  const toast = useToast()
  const [t, setT] = useState({ descricao: '', responsavel: '', atividade_id: '', ...inicial })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setT({ ...t, [k]: e.target.value })
  async function salvar() {
    setSalvando(true)
    const { erro: falha } = await dados.salvarTarefa(t)
    setSalvando(false)
    if (falha) return setErro(falha)
    toast(t.id ? 'Tarefa atualizada' : 'Tarefa criada')
    onSalvo()
  }
  return (
    <Sheet aberto titulo={t.id ? 'Editar tarefa' : 'Nova tarefa'} subtitulo={`${nomeDia(t.data)} ${fmtData(t.data)}`} onFechar={onFechar}
      rodape={<><button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button></>}>
      <div className="form">
        <Campo rotulo="Meta da tarefa" id="t-desc">
          <input id="t-desc" className="ipt" value={t.descricao} onChange={set('descricao')} placeholder="Ex.: concretar bloco B" />
        </Campo>
        <Campo rotulo="Responsável" id="t-resp" dica="Equipe ou empresa terceirizada.">
          <input id="t-resp" className="ipt" value={t.responsavel} onChange={set('responsavel')} />
        </Campo>
        <Campo rotulo="Atividade do cronograma (opcional)" id="t-ativ">
          <select id="t-ativ" className="ipt" value={t.atividade_id || ''} onChange={set('atividade_id')}>
            <option value="">Nenhuma</option>
            {atividades.map((a) => <option key={a.id} value={a.id}>{a.eap} · {nomeAtividade(a)}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Dia" id="t-dia">
          <input id="t-dia" type="date" className="ipt" value={t.data} onChange={set('data')} />
        </Campo>
        {erro && <div className="aviso-erro">{erro}</div>}
      </div>
    </Sheet>
  )
}
