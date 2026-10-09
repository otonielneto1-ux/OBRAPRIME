// Acerto inicial do avanço: para obra que começou antes do app. Informa de uma vez
// o avanço que já existia, para o Painel não nascer cheio de falsos atrasos.

import { useMemo, useState } from 'react'
import * as dados from '../lib/dados.js'
import { folhas, candidatasAcerto, planoAcerto, etapaDe, pctPrevisto, chaveLocal, nomeAtividade } from '../lib/cronograma.js'
import { hoje, fmtCurta, fmtData } from '../lib/datas.js'
import { Card, Icon, Vazio, Carregando, ErroBloco, useCarregar, useToast } from '../components/index.jsx'

export default function Acerto({ goto }) {
  const h = hoje()
  const toast = useToast()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({ atividades: dados.listarAtividades() }))
  const [valores, setValores] = useState({})
  const [sel, setSel] = useState(() => new Set())
  const [busca, setBusca] = useState('')
  const [erros, setErros] = useState([])
  const [gravando, setGravando] = useState(false)

  const base = useMemo(() => {
    if (!d) return null
    const porId = new Map(d.atividades.map((a) => [a.id, a]))
    const lista = candidatasAcerto(folhas(d.atividades), h).map((a) => ({ a, etapa: etapaDe(a, porId), prev: pctPrevisto(a, h) }))
    return { porId, lista }
  }, [d, h])

  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !base) return <div className="wrap"><div className="card"><Carregando /></div></div>

  const nome = nomeAtividade
  const termo = chaveLocal(busca)
  const visiveis = base.lista.filter(({ a, etapa }) => !termo || chaveLocal(`${etapa} ${nome(a)} ${a.eap}`).includes(termo))
  const grupos = []
  for (const x of visiveis) {
    let g = grupos.find((y) => y.etapa === x.etapa)
    if (!g) { g = { etapa: x.etapa, itens: [] }; grupos.push(g) }
    g.itens.push(x)
  }
  const plano = planoAcerto(valores, base.porId)
  const alternar = (ids, marcar) => setSel((s) => { const n = new Set(s); ids.forEach((id) => (marcar ? n.add(id) : n.delete(id))); return n })
  const aplicar = (fn) => {
    if (!sel.size) return toast('Marque antes as atividades (a caixinha à esquerda).', { erro: true })
    setValores((v) => { const n = { ...v }; for (const id of sel) n[id] = String(fn(id)); return n })
  }
  const prevDe = (id) => Math.round(base.lista.find((x) => x.a.id === id)?.prev ?? 0)

  async function gravar() {
    if (plano.erros.length) { setErros(plano.erros); return }
    setErros([])
    setGravando(true)
    const { data, erro: falha } = await dados.acertarAvancoInicial(plano.itens, h)
    setGravando(false)
    if (falha) return toast(falha, { erro: true })
    toast(`Acerto gravado em ${data} atividade${data > 1 ? 's' : ''}`)
    goto('painel')
  }

  if (!base.lista.length) {
    return (
      <div className="wrap"><div className="card">
        <Vazio icone="check" titulo="Nada para acertar" texto="Todas as atividades que já deveriam ter começado têm avanço lançado ou estão concluídas."
          acao={<button type="button" className="btn" onClick={() => goto('crono')}>Voltar ao cronograma</button>} />
      </div></div>
    )
  }

  const todasVisiveisMarcadas = visiveis.length > 0 && visiveis.every(({ a }) => sel.has(a.id))
  return (
    <div className="wrap stack">
      <div className="aviso-info">
        <b>A obra começou antes do app?</b> Informe aqui, de uma vez, o avanço que já existia.
        Aparecem as <b>{base.lista.length} atividades</b> que já deveriam ter começado e não estão em 100%.
        Cada acerto fica no histórico com a observação "Acerto inicial do avanço" e a data de hoje ({fmtData(h)}).
      </div>

      <div className="card pad stack" style={{ gap: 10 }}>
        <input className="ipt" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar atividade, etapa ou EAP" aria-label="Buscar atividade" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <label className="check" style={{ minHeight: 44 }}>
            <input type="checkbox" checked={todasVisiveisMarcadas} onChange={(e) => alternar(visiveis.map((x) => x.a.id), e.target.checked)} />
            <span>Marcar todas {busca ? 'da busca' : ''} ({visiveis.length})</span>
          </label>
          <button type="button" className="btn btn-sm btn-dark" onClick={() => aplicar(() => 100)}><Icon nome="check" /> Marcadas = 100%</button>
          <button type="button" className="btn btn-sm" onClick={() => aplicar(prevDe)}>Marcadas = previsto de hoje</button>
          <button type="button" className="btn btn-sm" onClick={() => { setValores({}); setSel(new Set()) }}>Limpar</button>
        </div>
        <span className="info-linha">{sel.size} marcada{sel.size === 1 ? '' : 's'} · {plano.itens.length} com % novo para gravar</span>
      </div>

      {grupos.length === 0 && <div className="card"><Vazio icone="crono" titulo="Nada nesta busca" /></div>}
      {grupos.map((g) => {
        const ids = g.itens.map((x) => x.a.id)
        const todas = ids.every((id) => sel.has(id))
        return (
          <Card key={g.etapa} titulo={`${g.etapa} · ${g.itens.length}`}
            direita={<label className="check" style={{ minHeight: 40, border: 0, padding: 0, background: 'none' }}>
              <input type="checkbox" checked={todas} onChange={(e) => alternar(ids, e.target.checked)} aria-label={`Marcar todas de ${g.etapa}`} /><span className="info-linha">Todas</span>
            </label>}>
            <ul className="list">
              {g.itens.map(({ a, prev }) => {
                const v = valores[a.id] ?? ''
                const mudou = v !== '' && Number(v) !== Number(a.percentual_realizado)
                return (
                  <li key={a.id} className={`row ${mudou ? 'is-warn' : ''}`}>
                    <input type="checkbox" checked={sel.has(a.id)} onChange={(e) => alternar([a.id], e.target.checked)}
                      style={{ width: 24, height: 24, accentColor: 'var(--navy)', flex: 'none' }} aria-label={`Marcar ${a.nome}`} />
                    <span className="t">
                      <b>{nome(a)}</b>
                      <small>EAP {a.eap} · base {fmtCurta(a.inicio_base)}–{fmtCurta(a.termino_base)} · previsto hoje {Math.round(prev)}% · lançado {Math.round(a.percentual_realizado)}%</small>
                    </span>
                    <input className="ipt" style={{ width: 92, minHeight: 48, flex: 'none', textAlign: 'right' }} type="number" inputMode="numeric" min="0" max="100"
                      value={v} placeholder={`${Math.round(a.percentual_realizado)}`} aria-label={`% realizado de ${a.nome}`}
                      onChange={(e) => setValores((x) => ({ ...x, [a.id]: e.target.value }))} />
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })}

      {erros.length > 0 && <div className="aviso-erro">{erros.slice(0, 5).map((e) => <div key={e}>{e}</div>)}</div>}
      <div className="savebar">
        <button type="button" className="btn btn-primary btn-block" onClick={gravar} disabled={gravando || plano.itens.length === 0}>
          <Icon nome="check" /> {gravando ? 'Gravando…' : plano.itens.length ? `Gravar acerto de ${plano.itens.length} atividade${plano.itens.length > 1 ? 's' : ''}` : 'Preencha o % das atividades'}
        </button>
      </div>
    </div>
  )
}
