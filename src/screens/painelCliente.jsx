// Painel do cliente: avanço, curva S e fotos. Nada de restrição, planejamento, efetivo ou custo.

import * as dados from '../lib/dados.js'
import { folhas, avancoObra, curvaS } from '../lib/cronograma.js'
import { hoje, fmtData } from '../lib/datas.js'
import { Card, Tag, Foto, Vazio, Carregando, ErroBloco, useCarregar } from '../components/index.jsx'
import { CurvaS } from '../components/graficos.jsx'

export default function PainelCliente() {
  const h = hoje()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({
    atividades: dados.listarAtividades(),
    avancos: dados.listarAvancos(),
  }))
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>
  const fl = folhas(d.atividades)
  if (!fl.length) return <div className="wrap"><div className="card"><Vazio icone="obras" titulo="O acompanhamento desta obra ainda não começou" texto="Assim que o cronograma for carregado, o avanço aparece aqui." /></div></div>

  const av = avancoObra(fl, h)
  const dif = Math.round(av.realizado - av.previsto)
  const nome = new Map(d.atividades.map((a) => [a.id, a.local && a.servico ? `${a.local} › ${a.servico}` : a.nome]))
  const fotos = d.avancos.filter((a) => a.foto_url).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30)

  return (
    <div className="wrap stack">
      <div className="card av">
        <div className="av-top">
          <span className="lbl">Avanço da obra · {fmtData(h)}</span>
          <Tag tom={dif >= 0 ? 'ok' : 'bad'}>{dif >= 0 ? `+${dif}` : `−${Math.abs(dif)}`} pts do previsto</Tag>
        </div>
        <div className="av-big av-hero" style={{ marginTop: 8 }}><b>{Math.round(av.realizado)}%</b><span>realizado<br />previsto {Math.round(av.previsto)}%</span></div>
        <div className="track"><div className="fill" style={{ width: `${av.realizado}%` }} /><div className="goal" style={{ left: `calc(${av.previsto}% - 2px)` }} /></div>
      </div>
      <Card titulo="Curva S · previsto × realizado">
        <div className="chart"><CurvaS pontos={curvaS(fl, d.avancos, h)} hoje={h} /></div>
        <div className="legend"><span><i style={{ background: '#01152E' }} />Previsto</span><span><i style={{ background: '#E49B2C', height: 5 }} />Realizado</span></div>
      </Card>
      <Card titulo={`Fotos recentes · ${fotos.length}`}>
        {fotos.length === 0 ? <div className="row"><span className="t muted">Nenhuma foto ainda.</span></div> : (
          <div className="galeria">
            {fotos.map((f) => (
              <figure key={f.id}>
                <Foto url={f.foto_url} legenda={nome.get(f.atividade_id)} />
                <figcaption>{nome.get(f.atividade_id)}<small>{fmtData(f.data)} · {f.percentual}%</small></figcaption>
              </figure>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
