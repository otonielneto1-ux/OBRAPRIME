// Gaveta de uma atividade: previsto x realizado, lançar avanço, histórico e restrições.

import { useEffect, useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { pctPrevisto, situacao } from '../lib/cronograma.js'
import { estadoRestricao } from '../lib/planejamento.js'
import { hoje, fmtData, fmtCurta } from '../lib/datas.js'
import { Sheet, Tag, TOM, Foto, Campo, Icon, useToast } from '../components/index.jsx'

export function AtividadeSheet({ atividade, avancos = [], restricoes = [], nomes = {}, onFechar, onSalvo }) {
  const { usuario } = useApp()
  const toast = useToast()
  const [pct, setPct] = useState('')
  const [obs, setObs] = useState('')
  const [foto, setFoto] = useState(null)
  const [erro, setErro] = useState(null)
  const [confirmarMenor, setConfirmarMenor] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { setPct(''); setObs(''); setFoto(null); setErro(null); setConfirmarMenor(false) }, [atividade?.id])

  if (!atividade) return null
  const a = atividade
  const h = hoje()
  const sit = situacao(a, h)
  const prev = pctPrevisto(a, h)
  const real = Number(a.percentual_realizado || 0)
  const historico = avancos.filter((x) => x.atividade_id === a.id).sort((x, y) => y.data.localeCompare(x.data) || String(y.created_at).localeCompare(String(x.created_at)))
  const minhas = restricoes.filter((r) => r.atividade_id === a.id)
  const podeLancar = pode(usuario, 'lancarAvanco') && !a.resumo && a.removida_na_revisao == null

  async function salvar() {
    setErro(null)
    const n = Number(pct)
    if (pct === '' || !Number.isFinite(n) || n < 0 || n > 100) return setErro('Informe um % entre 0 e 100.')
    if (n < real && !confirmarMenor) { setConfirmarMenor(true); return }
    setSalvando(true)
    const { erro: falha } = await dados.lancarAvanco({ atividade_id: a.id, data: h, percentual: n, observacao: obs, foto_url: foto?.url })
    setSalvando(false)
    if (falha) return setErro(falha)
    toast(`Avanço salvo: ${a.nome} em ${n}%`)
    onSalvo?.()
    onFechar()
  }

  function escolherFoto(e) {
    const arq = e.target.files?.[0]
    if (!arq) return
    // No modo demonstração a foto fica só neste aparelho; com o banco, vai para o Storage.
    setFoto({ nome: arq.name, url: URL.createObjectURL(arq) })
  }

  return (
    <Sheet aberto titulo={a.nome} subtitulo={`EAP ${a.eap}${a.local ? ` · ${a.servico} @ ${a.local}` : ''}`} onFechar={onFechar}>
      <div className="kpis">
        <div className="kpi"><span className="lbl">Previsto</span><div className="n" style={{ fontSize: 34 }}>{Math.round(prev)}%</div></div>
        <div className={`kpi ${sit === 'Atrasada' ? 'bad' : 'ok'}`}><span className="lbl">Realizado</span><div className="n" style={{ fontSize: 34 }}>{Math.round(real)}%</div></div>
        <div className="kpi"><span className="lbl">Situação</span><div style={{ marginTop: 12 }}><Tag tom={TOM[sit]}>{sit}</Tag></div></div>
      </div>
      <div className="info-linha">
        Base {fmtCurta(a.inicio_base)} – {fmtData(a.termino_base)}
        {a.inicio_real ? ` · Real ${fmtCurta(a.inicio_real)} – ${a.termino_real ? fmtData(a.termino_real) : 'em andamento'}` : ''}
        {a.termino_base_original && a.termino_base_original !== a.termino_base ? ` · Base original termina ${fmtData(a.termino_base_original)}` : ''}
      </div>

      {podeLancar && (
        <div className="card form" style={{ padding: 14, background: 'var(--soft)' }}>
          <span className="lbl">Lançar avanço · hoje, {fmtCurta(h)}</span>
          <div className="quick">
            {[25, 50, 75, 100].map((v) => (
              <button key={v} type="button" className={Number(pct) === v ? 'on' : ''} disabled={v <= real && real < 100} onClick={() => { setPct(String(v)); setConfirmarMenor(false) }}>{v}%</button>
            ))}
          </div>
          <Campo rotulo="Novo % realizado" id="pct" erro={erro}>
            <input id="pct" className="ipt" type="number" inputMode="numeric" min="0" max="100" value={pct}
              onChange={(e) => { setPct(e.target.value); setConfirmarMenor(false) }} placeholder={`Hoje: ${Math.round(real)}%`} />
          </Campo>
          <Campo rotulo="Observação (opcional)" id="obs">
            <textarea id="obs" className="ipt" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: trecho 3 concluído, falta caixa de inspeção" />
          </Campo>
          <label className="btn" style={{ cursor: 'pointer' }}>
            <Icon nome="camera" /> {foto ? `Foto: ${foto.nome}` : 'Tirar foto'}
            <input type="file" accept="image/*" capture="environment" onChange={escolherFoto} style={{ display: 'none' }} />
          </label>
          {confirmarMenor && (
            <div className="aviso-erro">O novo % é menor que o anterior ({Math.round(real)}%). Toque em salvar de novo para confirmar.</div>
          )}
          <button type="button" className="btn btn-primary btn-block" onClick={salvar} disabled={salvando}>
            <Icon nome="check" /> {salvando ? 'Salvando…' : confirmarMenor ? 'Confirmar e salvar' : 'Salvar avanço'}
          </button>
        </div>
      )}

      <div>
        <span className="lbl">Histórico de avanço</span>
        <ul className="list" style={{ marginTop: 6 }}>
          {historico.length === 0 && <li className="row"><span className="t muted">Nenhum avanço lançado ainda.</span></li>}
          {historico.map((x) => (
            <li key={x.id} className="row" style={{ padding: '10px 0' }}>
              {x.foto_url && <Foto url={x.foto_url} legenda={`Foto de ${fmtData(x.data)}`} />}
              <span className="t">
                <b style={{ fontSize: 18 }}>{x.percentual}%</b>
                <small>{fmtData(x.data)}{nomes[x.lancado_por] ? ` · ${nomes[x.lancado_por]}` : ''}</small>
                {x.observacao && <p>{x.observacao}</p>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {minhas.length > 0 && (
        <div>
          <span className="lbl">Restrições</span>
          <ul className="list" style={{ marginTop: 6 }}>
            {minhas.map((r) => {
              const est = estadoRestricao(r, h)
              return (
                <li key={r.id} className={`row ${est === 'vencida' ? 'is-bad' : est === 'proxima' ? 'is-warn' : est === 'removida' ? 'is-off' : ''}`}>
                  <span className="t"><b>{r.descricao}</b><small>{r.tipo} · {r.responsavel} · até {fmtCurta(r.data_limite)}</small></span>
                  <Tag tom={est === 'removida' ? 'ok' : est === 'vencida' ? 'bad' : 'warn'}>{est === 'removida' ? 'Removida' : 'Aberta'}</Tag>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Sheet>
  )
}
