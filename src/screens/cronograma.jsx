// Cronograma: lista em árvore (EAP), linha de balanço e lançar avanço.

import { useMemo, useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { folhas, situacao, pctPrevisto, linhaBalanco, servicosRepetidos, ativa, chaveLocal, nomeAtividade } from '../lib/cronograma.js'
import { hoje, inicioSemana, addDias, difDias, fmtCurta, fmtData, minData, maxData } from '../lib/datas.js'
import { Abas, Card, Tag, TOM, Icon, Vazio, Carregando, ErroBloco, useCarregar } from '../components/index.jsx'
import { LinhaBalanco, CORES_SERVICO } from '../components/graficos.jsx'
import { AtividadeSheet } from './atividade.jsx'

function useCronograma() {
  return useCarregar(() => ({
    atividades: dados.listarAtividades(),
    avancos: dados.listarAvancos(),
    restricoes: dados.listarRestricoes(),
    nomes: dados.nomesDasPessoas(),
  }))
}

export default function Cronograma({ goto, params = {} }) {
  const { usuario, obra } = useApp()
  const [aba, setAba] = useState(params.aba || 'lista')
  const [aberta, setAberta] = useState(params.abrir || null)
  const { d, erro, carregando, recarregar } = useCronograma()

  const temCronograma = d && d.atividades.length > 0
  return (
    <>
      {temCronograma && (
        <Abas abas={[['lista', 'Lista'], ['lob', 'Linha de balanço'], ['avanco', 'Lançar avanço']]} atual={aba} onTroca={setAba} />
      )}
      {erro && <ErroBloco mensagem={erro} tentar={recarregar} />}
      {!erro && (carregando || !d) && <div className="wrap"><div className="card"><Carregando /></div></div>}
      {!erro && d && !temCronograma && (
        <div className="wrap"><div className="card">
          <Vazio icone="file" titulo="Nenhum cronograma importado"
            texto="Exporte do MS Project em XML (Arquivo › Salvar como › XML) e importe aqui."
            acao={pode(usuario, 'importarCronograma') && <button type="button" className="btn btn-primary" onClick={() => goto('importar')}><Icon nome="upload" /> Importar o primeiro cronograma</button>} />
        </div></div>
      )}
      {!erro && temCronograma && (
        <div className="wrap stack">
          <div className="toolbar">
            <span className="info-linha">Revisão {obra.revisao_atual} · importado em {fmtData(obra.importado_em)} · {d.atividades.filter(ativa).length} atividades</span>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pode(usuario, 'acertarAvanco') && (
                <button type="button" className="btn btn-sm" onClick={() => goto('acerto')}><Icon nome="avanco" /> Acertar avanço</button>
              )}
              {pode(usuario, 'importarCronograma') && (
                <button type="button" className="btn btn-sm" onClick={() => goto('importar')}><Icon nome="upload" /> Importar cronograma</button>
              )}
            </span>
          </div>
          {aba === 'lista' && <Lista d={d} filtroInicial={params.filtro} abrir={(a) => setAberta(a.id)} />}
          {aba === 'lob' && <AbaLinhaBalanco d={d} abrir={(id) => setAberta(id)} />}
          {aba === 'avanco' && <ListaAvanco dadosProntos={d} aoSalvar={recarregar} />}
        </div>
      )}
      {d && aberta && (
        <AtividadeSheet atividade={d.atividades.find((a) => a.id === aberta)} avancos={d.avancos} restricoes={d.restricoes}
          nomes={d.nomes} onFechar={() => setAberta(null)} onSalvo={recarregar} />
      )}
    </>
  )
}

// ───────────────────────── Lista em árvore ─────────────────────────

const FILTROS = [['todas', 'Todas'], ['atrasadas', 'Atrasadas'], ['semana', 'Desta semana'], ['mes', 'Do mês']]

function Lista({ d, filtroInicial, abrir }) {
  const h = hoje()
  const [filtro, setFiltro] = useState(filtroInicial || 'todas')
  const grande = d.atividades.length > 120
  const [fechados, setFechados] = useState(() =>
    new Set(grande ? d.atividades.filter((a) => a.resumo && a.nivel >= 1).map((a) => a.id) : []))
  const fl = folhas(d.atividades)
  const ini = minData(fl.map((a) => a.inicio_base))
  const fim = maxData(fl.map((a) => a.termino_base))
  const totalDias = Math.max(1, difDias(ini, fim))
  const pos = (data) => `${Math.max(0, Math.min(100, (difDias(ini, data) / totalDias) * 100))}%`
  const semIni = inicioSemana(h)
  const semFim = addDias(semIni, 6)
  const mesIni = `${h.slice(0, 7)}-01`
  const mesFim = `${h.slice(0, 7)}-31`
  const nAtr = fl.filter((a) => situacao(a, h) === 'Atrasada').length

  const passa = (a) => {
    if (filtro === 'atrasadas') return situacao(a, h) === 'Atrasada'
    if (filtro === 'semana') return Number(a.percentual_realizado) < 100 && a.inicio_previsto <= semFim && a.termino_previsto >= semIni
    if (filtro === 'mes') return a.inicio_previsto <= mesFim && a.termino_previsto >= mesIni
    return true
  }

  const filhos = useMemo(() => {
    const m = new Map()
    for (const a of d.atividades) {
      const k = a.parent_id || 'raiz'
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(a)
    }
    return m
  }, [d.atividades])

  const linhaFolha = (a, comCaminho) => {
    const sit = situacao(a, h)
    const prev = pctPrevisto(a, h)
    const real = Number(a.percentual_realizado || 0)
    const removida = !ativa(a)
    return (
      <li key={a.id}>
        <button type="button" className={`row ${sit === 'Atrasada' ? 'is-bad' : ''} ${removida ? 'is-off' : ''} ${comCaminho ? '' : `nivel-${Math.min(a.nivel, 4)}`}`} onClick={() => abrir(a)}>
          <span className="t">
            <b className={removida ? 'riscado' : ''}>{comCaminho ? nomeAtividade(a) : a.nome}</b>
            <small>EAP {a.eap} · base {fmtCurta(a.inicio_base)}–{fmtCurta(a.termino_base)}{a.inicio_real ? ` · real ${fmtCurta(a.inicio_real)}–${a.termino_real ? fmtCurta(a.termino_real) : ''}` : ''}</small>
            {!removida && <span className="barra"><i style={{ width: `${real}%` }} /><u style={{ left: `calc(${prev}% - 1px)` }} /></span>}
          </span>
          {!removida && (
            <span className="gbar" aria-hidden="true">
              <i className="g-base" style={{ left: pos(a.inicio_base), width: `calc(${pos(a.termino_base)} - ${pos(a.inicio_base)} + 2px)` }} />
              <i className="g-prev" style={{ left: pos(a.inicio_previsto), width: `calc(${pos(a.termino_previsto)} - ${pos(a.inicio_previsto)} + 2px)` }} />
              {a.inicio_real && <i className="g-real" style={{ left: pos(a.inicio_real), width: `calc((${pos(a.termino_previsto)} - ${pos(a.inicio_previsto)} + 2px) * ${real / 100})` }} />}
              <i className="g-hoje" style={{ left: pos(h) }} />
            </span>
          )}
          <span className="pct">
            <b>{removida ? '—' : `${Math.round(real)}%`}</b>
            <Tag tom={TOM[sit]}>{removida ? `Removida na rev. ${a.removida_na_revisao}` : sit}</Tag>
          </span>
        </button>
      </li>
    )
  }

  const arvore = (paiId) => (filhos.get(paiId) || []).map((a) => {
    if (!a.resumo) return linhaFolha(a, false)
    const fechado = fechados.has(a.id)
    const descendentes = fl.filter((f) => f.eap.startsWith(`${a.eap}.`))
    const pct = descendentes.length
      ? Math.round(descendentes.reduce((s, f) => s + Number(f.percentual_realizado) * (Number(f.duracao_dias) || 1), 0) /
        descendentes.reduce((s, f) => s + (Number(f.duracao_dias) || 1), 0))
      : 0
    return (
      <li key={a.id}>
        <button type="button" className={`grp ${fechado ? 'closed' : ''} nivel-${Math.min(a.nivel, 4)}`} aria-expanded={!fechado}
          onClick={() => setFechados((s) => { const n = new Set(s); if (n.has(a.id)) n.delete(a.id); else n.add(a.id); return n })}>
          <Icon nome="chev" tamanho={20} /><b>{a.eap} · {a.nome}</b><span className="mono">{pct}% realizado</span>
        </button>
        {!fechado && <ul className="list">{arvore(a.id)}</ul>}
      </li>
    )
  })

  const lista = filtro === 'todas' ? null : fl.filter(passa)
  return (
    <>
      <div className="chips">
        {FILTROS.map(([k, t]) => (
          <button key={k} type="button" className={`chip ${filtro === k ? 'on' : ''}`} onClick={() => setFiltro(k)}>
            {t}{k === 'atrasadas' && nAtr > 0 && <span className="c">{nAtr}</span>}
          </button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        {lista && lista.length === 0 && <Vazio icone="check" titulo="Nada por aqui" texto="Nenhuma atividade neste filtro." />}
        <ul className="list">{lista ? lista.map((a) => linhaFolha(a, true)) : arvore('raiz')}</ul>
      </div>
      <p className="info-linha" style={{ margin: 0 }}>Barra: azul = realizado · traço dourado = previsto hoje</p>
    </>
  )
}

// ───────────────────────── Linha de balanço ─────────────────────────

function AbaLinhaBalanco({ d, abrir }) {
  const h = hoje()
  const fl = folhas(d.atividades)
  const repetidos = servicosRepetidos(fl, 2)
  const maxLocais = Math.max(0, ...repetidos.map((s) => s.qtdLocais))
  const limiar = Math.max(2, Math.ceil(maxLocais * 0.75))
  const [escolhidos, setEscolhidos] = useState(() => new Set(repetidos.filter((s) => s.qtdLocais >= limiar).map((s) => s.nome)))
  if (!repetidos.length) {
    return (
      <div className="card">
        <Vazio icone="crono" titulo="Sem serviços repetidos por local"
          texto="A linha de balanço serve para obras como loteamento, em que o mesmo serviço passa por vários trechos ou quadras." />
      </div>
    )
  }
  const cores = Object.fromEntries(repetidos.map((s, i) => [s.nome, CORES_SERVICO[i % CORES_SERVICO.length]]))
  const lob = linhaBalanco(fl, h, { servicos: [...escolhidos] })
  const alternar = (nome) => setEscolhidos((s) => { const n = new Set(s); if (n.has(nome)) n.delete(nome); else n.add(nome); return n })
  return (
    <>
      <div className="chips">
        {repetidos.map((s) => (
          <button key={s.nome} type="button" className={`chip ${escolhidos.has(s.nome) ? 'on' : ''}`} onClick={() => alternar(s.nome)} aria-pressed={escolhidos.has(s.nome)}>
            <span className="dot" style={{ background: cores[s.nome], outline: '2px solid #fff' }} />{s.nome} · {s.qtdLocais}
          </button>
        ))}
      </div>
      <Card titulo={`Linha de balanço · ${lob.locais.length} locais × semanas`}
        direita={lob.colisoes.length > 0 ? <Tag tom="warn">{lob.colisoes.length} possível colisão{lob.colisoes.length > 1 ? 'ões' : ''}</Tag> : null}>
        {lob.locais.length === 0
          ? <Vazio icone="crono" titulo="Escolha os serviços" texto="Marque acima os serviços que quer ver no gráfico." />
          : <div className="chart scroll-x"><LinhaBalanco dados={lob} hoje={h} cores={cores} onPonto={abrir} /></div>}
        <div className="legend">
          {lob.servicos.map((s) => <span key={s.nome}><i style={{ background: cores[s.nome] }} />{s.nome}</span>)}
          <span><i style={{ background: '#C62828' }} />Atrasado</span>
        </div>
        <div className="legend" style={{ textTransform: 'none', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500, letterSpacing: 0 }}>
          Tracejado = previsto (linha de base) · Cheio = realizado · Toque num trecho para abrir a atividade
        </div>
      </Card>
      {lob.colisoes.length > 0 && (
        <Card titulo="Possíveis colisões de equipes">
          <ul className="list">
            {lob.colisoes.map((c) => (
              <li key={`${c.local}${c.servico1}${c.servico2}`} className="row is-warn">
                <span className="t"><b>{c.nomeLocal}</b><small>{c.servico1} e {c.servico2} se cruzam no previsto</small></span>
                <Tag tom="warn">Atenção</Tag>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

// ───────────────────────── Lançar avanço (também a tela do Mestre) ─────────────────────────

/** Atividades em andamento ou previstas até o fim desta semana, as de hoje primeiro. */
export function ListaAvanco({ dadosProntos, aoSalvar }) {
  const proprio = useCronograma()
  const d = dadosProntos || proprio.d
  const [local, setLocal] = useState('todos')
  const [aberta, setAberta] = useState(null)
  if (!dadosProntos) {
    if (proprio.erro) return <ErroBloco mensagem={proprio.erro} tentar={proprio.recarregar} />
    if (proprio.carregando || !d) return <div className="card"><Carregando /></div>
  }
  const recarregar = aoSalvar || proprio.recarregar
  const h = hoje()
  const fimSem = addDias(inicioSemana(h), 6)
  const lista = folhas(d.atividades)
    .filter((a) => Number(a.percentual_realizado) < 100 && a.inicio_previsto <= fimSem)
    .map((a) => ({ a, prev: pctPrevisto(a, h), hojeSim: a.inicio_previsto <= h && a.termino_previsto >= h, sit: situacao(a, h) }))
    .sort((x, y) => Number(y.hojeSim) - Number(x.hojeSim) || Number(y.sit === 'Atrasada') - Number(x.sit === 'Atrasada') || x.a.inicio_previsto.localeCompare(y.a.inicio_previsto))
  const locais = [...new Map(lista.filter((x) => x.a.local).map((x) => [chaveLocal(x.a.local), x.a.local])).entries()]
  const visiveis = local === 'todos' ? lista : lista.filter((x) => chaveLocal(x.a.local) === local)

  return (
    <div className="stack">
      {!d.atividades.length && <div className="card"><Vazio icone="file" titulo="Esta obra ainda não tem cronograma" texto="Peça ao engenheiro para importar o cronograma do MS Project." /></div>}
      {locais.length > 1 && (
        <div className="chips">
          <button type="button" className={`chip ${local === 'todos' ? 'on' : ''}`} onClick={() => setLocal('todos')}>Todos</button>
          {locais.map(([k, nome]) => (
            <button key={k} type="button" className={`chip ${local === k ? 'on' : ''}`} onClick={() => setLocal(k)}>{nome}</button>
          ))}
        </div>
      )}
      {d.atividades.length > 0 && (
        <Card titulo={`${visiveis.length} atividade${visiveis.length === 1 ? '' : 's'} em andamento ou previstas até ${fmtCurta(fimSem)}`}>
          <ul className="list">
            {visiveis.length === 0 && <li className="row"><span className="t muted">Nenhuma atividade em andamento esta semana.</span></li>}
            {visiveis.map(({ a, prev, sit }) => (
              <li key={a.id}>
                <button type="button" className={`row ${sit === 'Atrasada' ? 'is-bad' : ''}`} onClick={() => setAberta(a.id)}>
                  <span className="t">
                    <b>{local === 'todos' ? nomeAtividade(a) : a.nome}</b>
                    <small>Previsto hoje {Math.round(prev)}% · base {fmtCurta(a.inicio_base)}–{fmtCurta(a.termino_base)}</small>
                    <span className="barra"><i style={{ width: `${a.percentual_realizado}%` }} /><u style={{ left: `calc(${prev}% - 1px)` }} /></span>
                  </span>
                  <span className="pct"><b>{Math.round(a.percentual_realizado)}%</b><small>lançar ›</small></span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {aberta && (
        <AtividadeSheet atividade={d.atividades.find((a) => a.id === aberta)} avancos={d.avancos} restricoes={d.restricoes}
          nomes={d.nomes} onFechar={() => setAberta(null)} onSalvo={recarregar} />
      )}
    </div>
  )
}
