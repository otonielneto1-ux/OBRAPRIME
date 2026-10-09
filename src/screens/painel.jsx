// Painel da obra — a tela do dia a dia. No celular, avanço e semana vêm antes de rolar.
// Cada bloco depende do seu próprio dado: se um falhar, só ele avisa e o resto continua.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { folhas, avancoObra, atrasadas as listarAtrasadas, curvaS, nomeAtividade } from '../lib/cronograma.js'
import { resumoSemana, semanaPassada, estadoRestricao, alertaEfetivo } from '../lib/planejamento.js'
import { totaisEfetivo } from '../lib/efetivo.js'
import { hoje, addDias, inicioSemana, fmtCurta, fmtData, nomeDia, maxData } from '../lib/datas.js'
import { Abas, Card, Tag, TOM, Icon, Vazio, Carregando, ErroBloco, FalhaBloco, useCarregar } from '../components/index.jsx'
import { CurvaS } from '../components/graficos.jsx'
import { AtividadeSheet } from './atividade.jsx'
import VisaoGeral from './visaoGeral.jsx'

/** Gerente e Coordenador têm duas abas: esta obra e todas as obras. Abre sempre em "Esta obra". */
export default function Painel({ goto }) {
  const { usuario, obras } = useApp()
  const [aba, setAba] = useState('obra')
  const comVisaoGeral = pode(usuario, 'verVisaoGeral') && obras.length > 1
  return (
    <>
      {comVisaoGeral && <Abas abas={[['obra', 'Esta obra'], ['todas', 'Todas as obras']]} atual={aba} onTroca={setAba} />}
      {comVisaoGeral && aba === 'todas' ? <VisaoGeral /> : <PainelObra goto={goto} />}
    </>
  )
}

function PainelObra({ goto }) {
  const { usuario, obra } = useApp()
  const h = hoje()
  const ini = inicioSemana(h)
  const [aberta, setAberta] = useState(null)
  const { d, erros, carregando, recarregar } = useCarregar(() => ({
    atividades: dados.listarAtividades(),
    avancos: dados.listarAvancos(),
    restricoes: dados.listarRestricoes(),
    tarefas: dados.listarTarefas({ de: addDias(ini, -7), ate: addDias(ini, 6) }),
    efetivo: dados.listarEfetivo({ de: addDias(h, -10), ate: h }),
    avisos: dados.listarAvisos(),
    nomes: dados.nomesDasPessoas(),
  }), [], { parcial: true })

  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando linhas={6} /></div></div>
  // Sem cronograma não há painel: esses dois são essenciais.
  if (erros.atividades || erros.avancos) return <ErroBloco mensagem={erros.atividades || erros.avancos} tentar={recarregar} />

  const fl = folhas(d.atividades)
  if (!fl.length) {
    return (
      <div className="wrap"><div className="card">
        <Vazio icone="file" titulo="Esta obra ainda não tem cronograma"
          texto="Importe o cronograma do MS Project e o painel se monta sozinho: avanço, curva S, atrasos e restrições."
          acao={pode(usuario, 'importarCronograma') && (
            <button type="button" className="btn btn-primary" onClick={() => goto('importar')}><Icon nome="upload" /> Importar o primeiro cronograma</button>
          )}
          extra={<div className="how"><b>Como gerar o arquivo:</b> no MS Project, vá em Arquivo › Salvar como › tipo <b>XML</b>. O arquivo .mpp não é lido.</div>} />
      </div></div>
    )
  }

  const tarefas = d.tarefas || []
  const efetivo = d.efetivo || []
  const restricoes = d.restricoes || []
  const avisos = d.avisos || []

  const av = avancoObra(fl, h)
  const dif = Math.round(av.realizado - av.previsto)
  const semana = resumoSemana(tarefas, h)
  const passada = semanaPassada(tarefas, h)
  const efHoje = efetivo.filter((l) => l.data === h)
  const temEfetivo = efHoje.length > 0
  const ultimoDia = maxData(efetivo.filter((l) => l.data < h).map((l) => l.data))
  const totalOntem = totaisEfetivo(efetivo.filter((l) => l.data === ultimoDia)).total
  const barras = [...new Set(efetivo.map((l) => l.data))].sort().slice(-7)
    .map((dia) => totaisEfetivo(efetivo.filter((l) => l.data === dia)).total)
  const maxBarra = Math.max(1, ...barras)
  // Sem conseguir ler o efetivo, o alerta não aparece (melhor calar do que acusar errado).
  const alerta = !erros.efetivo && pode(usuario, 'lancarEfetivo') && alertaEfetivo(h, new Date().getHours(), temEfetivo)
  const atr = listarAtrasadas(fl, h)
  const abertas = restricoes.filter((r) => r.status === 'Aberta')
  const urgentes = abertas.filter((r) => ['vencida', 'proxima'].includes(estadoRestricao(r, h)))
    .sort((a, b) => a.data_limite.localeCompare(b.data_limite))
  const vencidas = abertas.filter((r) => estadoRestricao(r, h) === 'vencida').length
  const curva = curvaS(fl, d.avancos, h)
  const terminoBase = maxData(fl.map((a) => a.termino_base))
  const terminoPrevisto = maxData(fl.map((a) => a.termino_previsto))
  const ativPorId = new Map(d.atividades.map((a) => [a.id, a]))
  const nomeAtiv = (id) => nomeAtividade(ativPorId.get(id))
  const tarefasHoje = tarefas.filter((t) => t.data === h)
  const irSemana = () => (usuario.role === 'Mestre' ? goto('hoje') : goto('plan', { aba: 'semana' }))
  const irRestricao = (id) => goto('plan', { aba: 'restricoes', destaque: id })

  // Obra recém-importada que começou antes do app: tudo em 0% vira falso atraso.
  const precisaAcerto = pode(usuario, 'acertarAvanco') && d.avancos.length === 0 && atr.length > 0

  return (
    <div className="wrap stack">
      {precisaAcerto && (
        <div className="aviso-info" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderColor: 'var(--warn-line)', background: 'var(--warn-bg)' }}>
          <span style={{ flex: 1, minWidth: 220 }}>
            <b>A obra começou antes do app?</b> {atr.length} atividade{atr.length > 1 ? 's aparecem' : ' aparece'} atrasada{atr.length > 1 ? 's' : ''} porque ainda não {atr.length > 1 ? 'têm' : 'tem'} avanço lançado.
          </span>
          <button type="button" className="btn btn-dark" onClick={() => goto('acerto')}>Acertar avanço inicial</button>
        </div>
      )}
      {alerta && (
        <div className="alert">
          <Icon nome="alert" />
          <p>Efetivo de hoje não lançado<small>{nomeDia(h)} {fmtCurta(h)} · passou das 10h</small></p>
          <button type="button" className="btn" onClick={() => goto('efetivo')}>Lançar</button>
        </div>
      )}

      <div className="grid2 top2">
        <div className="card av">
          <div className="av-top">
            <span className="lbl">Avanço físico · hoje</span>
            <Tag tom={dif >= 0 ? 'ok' : 'bad'}>{dif >= 0 ? `+${dif}` : `−${Math.abs(dif)}`} pts do previsto</Tag>
          </div>
          <div className="av-big av-hero" style={{ marginTop: 8 }}>
            <b>{Math.round(av.realizado)}%</b><span>realizado<br />previsto {Math.round(av.previsto)}%</span>
          </div>
          <div className="track">
            <div className="fill" style={{ width: `${Math.min(100, av.realizado)}%` }} />
            <div className="goal" style={{ left: `calc(${Math.min(100, av.previsto)}% - 2px)` }} />
          </div>
          <div className="steps">
            <span>Cronograma revisão {obra.revisao_atual}</span>
            <span>{obra.importado_em ? `importado em ${fmtData(obra.importado_em)}` : ''}</span>
          </div>
        </div>

        <Card titulo={`Planejamento da semana · ${fmtCurta(semana.inicio)}–${fmtCurta(semana.fim)}`}
          direita={<button type="button" className="link" onClick={irSemana}>Ver semana</button>}>
          {erros.tarefas ? <FalhaBloco oque="o planejamento da semana" /> : (
            <>
              {semana.ateHoje.total > 0 ? (
                <div className="wk-top">
                  <div className="av-big"><b>{semana.ateHoje.pct}%</b><span>das tarefas cumpridas<br />até hoje</span></div>
                  <Tag tom={semana.ateHoje.pct >= 80 ? 'ok' : 'warn'}>{semana.ateHoje.feitas} de {semana.ateHoje.total}</Tag>
                </div>
              ) : (
                <div className="wk-top"><span className="muted">Nenhuma tarefa planejada até hoje nesta semana.</span></div>
              )}
              <div className="week" style={{ gridTemplateColumns: `repeat(${semana.dias.length}, 1fr)` }}>
                {semana.dias.map((x) => {
                  const cls = x.futuro ? 'fut' : x.naoFeitas ? 'bad' : x.pendentes ? '' : x.total ? 'ok' : ''
                  return (
                    <div key={x.data} className={`day ${cls} ${x.hoje ? 'hoje' : ''}`}>
                      <small>{nomeDia(x.data)}</small>
                      <b>{x.futuro || !x.total ? x.total || '–' : `${x.feitas}/${x.total}`}</b>
                      <em>{fmtCurta(x.data)}</em>
                      <span className="seg">
                        {x.total > 0 && <><i className="f" style={{ flex: x.feitas }} /><i className="n" style={{ flex: x.naoFeitas }} /><i className="p" style={{ flex: x.pendentes }} /></>}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="wk-sub">
                <span className="lbl">Hoje · {nomeDia(h)} {fmtCurta(h)}</span>
                {semana.restantes > 0 && <span className="info-linha">+{semana.restantes} até domingo</span>}
              </div>
              <ul className="list">
                {tarefasHoje.length === 0 && <li className="row"><span className="t muted">Nenhuma tarefa planejada para hoje.</span></li>}
                {tarefasHoje.map((t) => (
                  <li key={t.id}>
                    <button type="button" className={`row ${t.situacao === 'Não feito' ? 'is-bad' : ''}`} onClick={irSemana}>
                      <span className="t"><b>{t.descricao}</b><small>{t.responsavel}{t.motivo_nao_feito ? ` · motivo: ${t.motivo_nao_feito}` : ''}</small></span>
                      <Tag tom={TOM[t.situacao]}>{t.situacao}</Tag>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="kpis">
        <button type="button" className={`kpi ${temEfetivo || erros.efetivo ? '' : 'warn'}`} onClick={() => goto('efetivo')}>
          <span className="lbl">Efetivo</span>
          <div className="n">{temEfetivo ? totaisEfetivo(efHoje).total : '—'}</div>
          <span className="s">{erros.efetivo ? 'não carregou' : temEfetivo ? 'pessoas hoje' : ultimoDia ? `${fmtCurta(ultimoDia)}: ${totalOntem}` : 'sem lançamento'}</span>
          <div className="bars">{barras.map((v, i) => <i key={i} style={{ height: `${(v / maxBarra) * 18}px` }} className={i === barras.length - 1 ? 'last' : ''} />)}</div>
        </button>
        <button type="button" className={`kpi ${atr.length ? 'bad' : 'ok'}`} onClick={() => goto(usuario.role === 'Mestre' ? 'avanco' : 'crono', { filtro: 'atrasadas' })}>
          <span className="lbl">Atrasadas</span>
          <div className="n">{atr.length}</div>
          <span className="s">atividades</span>
        </button>
        <button type="button" className={`kpi ${erros.restricoes ? '' : vencidas ? 'bad' : abertas.length ? 'warn' : 'ok'}`} onClick={() => goto('plan', { aba: 'restricoes' })}>
          <span className="lbl">Restrições</span>
          <div className="n">{erros.restricoes ? '—' : abertas.length}</div>
          <span className="s">{erros.restricoes ? 'não carregou' : vencidas ? `${vencidas} vencida${vencidas > 1 ? 's' : ''}` : 'abertas'}</span>
        </button>
      </div>

      <div className="grid2">
        <div className="stack">
          <Card titulo="Curva S · previsto × realizado">
            <div className="chart"><CurvaS pontos={curva} hoje={h} /></div>
            <div className="legend">
              <span><i style={{ background: '#01152E' }} />Previsto</span>
              <span><i style={{ background: '#E49B2C', height: 5 }} />Realizado</span>
              <span style={{ textTransform: 'none', fontFamily: 'var(--sans)', fontWeight: 500, letterSpacing: 0 }}>Toque num ponto para ver a semana</span>
            </div>
          </Card>
          <Card titulo={`Atividades atrasadas · ${atr.length}`}
            direita={atr.length > 5 && usuario.role !== 'Mestre' ? <button type="button" className="link" onClick={() => goto('crono', { filtro: 'atrasadas' })}>Ver todas</button> : null}>
            <ul className="list">
              {atr.length === 0 && <li className="row"><span className="t muted">Nenhuma atividade atrasada. Bom sinal.</span></li>}
              {atr.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <button type="button" className="row is-bad" onClick={() => setAberta(a)}>
                    <span className="t"><b>{nomeAtiv(a.id)}</b><small>Base termina {fmtCurta(a.termino_base)} · previsto hoje {Math.round(a.previsto_hoje)}%</small></span>
                    <span className="pct"><b style={{ color: 'var(--bad)' }}>{Math.round(a.percentual_realizado)}%</b><small>de {Math.round(a.previsto_hoje)}%</small></span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="stack">
          <div className="minis">
            <div className="mini">
              <span className="lbl">Semana passada</span>
              {erros.tarefas ? <span className="info-linha">não carregou</span> : (
                <>
                  <b>{passada.pct == null ? '—' : `${passada.pct}%`}</b>
                  {passada.pct == null
                    ? <span className="info-linha">sem tarefas planejadas</span>
                    : <Tag tom={passada.pct >= 80 ? 'ok' : 'warn'}>{passada.feitas} de {passada.total} tarefas</Tag>}
                </>
              )}
            </div>
            <div className="mini">
              <span className="lbl">Término previsto</span>
              <b>{fmtData(terminoPrevisto)}</b>
              <span className="info-linha">{terminoPrevisto > terminoBase ? `base: ${fmtData(terminoBase)}` : 'linha de base'}</span>
            </div>
          </div>

          <Card titulo="Restrições · vencidas e próximas" direita={<button type="button" className="link" onClick={() => goto('plan', { aba: 'restricoes' })}>Ver todas</button>}>
            {erros.restricoes ? <FalhaBloco oque="as restrições" /> : (
              <>
                <ul className="list">
                  {urgentes.length === 0 && <li className="row"><span className="t muted">Nenhuma restrição vencida ou vencendo nos próximos 7 dias.</span></li>}
                  {urgentes.map((r) => {
                    const venc = estadoRestricao(r, h) === 'vencida'
                    return (
                      <li key={r.id}>
                        <button type="button" className={`row ${venc ? 'is-bad' : 'is-warn'}`} onClick={() => irRestricao(r.id)}>
                          <span className="t"><b>{r.descricao}</b><small>{nomeAtiv(r.atividade_id)} · {r.tipo} · {r.responsavel}</small></span>
                          <Tag tom={venc ? 'bad' : 'warn'}>{venc ? `Venceu ${fmtCurta(r.data_limite)}` : `Vence ${fmtCurta(r.data_limite)}`}</Tag>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {abertas.length > urgentes.length && <div className="more">+ {abertas.length - urgentes.length} restrições abertas sem urgência</div>}
              </>
            )}
          </Card>

          <Card titulo="Quadro de avisos" direita={<button type="button" className="link" onClick={() => goto('avisos')}>Ver todos</button>}>
            {erros.avisos ? <FalhaBloco oque="os avisos" /> : (
              <ul className="list">
                {avisos.length === 0 && <li className="row"><span className="t muted">Nenhum aviso nesta obra.</span></li>}
                {avisos.slice(0, 5).map((a) => (
                  <li key={a.id} className="row">
                    {a.fixado && <span title="Fixado" style={{ color: 'var(--navy)' }}><Icon nome="pin" tamanho={20} /></span>}
                    <span className="t"><b>{a.titulo}</b><small>{a.autor_nome} · {fmtCurta(a.created_at)}</small></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {aberta && (
        <AtividadeSheet atividade={aberta} avancos={d.avancos} restricoes={restricoes} nomes={d.nomes || {}}
          onFechar={() => setAberta(null)} onSalvo={recarregar} />
      )}
    </div>
  )
}
