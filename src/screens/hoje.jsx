// Hoje (Mestre): as tarefas do dia para marcar Feito / Não feito, com botões grandes.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { alertaEfetivo } from '../lib/planejamento.js'
import { hoje, fmtData, nomeDia, fmtCurta } from '../lib/datas.js'
import { Card, Tag, TOM, Icon, Vazio, Carregando, ErroBloco, useCarregar, useToast } from '../components/index.jsx'
import { MotivoSheet } from './planejamento.jsx'

export default function Hoje({ goto }) {
  const h = hoje()
  const toast = useToast()
  const [motivoDe, setMotivoDe] = useState(null)
  const { d, erro, carregando, recarregar } = useCarregar(() => ({
    tarefas: dados.listarTarefas({ de: h, ate: h }),
    efetivo: dados.listarEfetivo({ de: h, ate: h }),
    atividades: dados.listarAtividades(),
  }))
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>

  const ativ = new Map(d.atividades.map((a) => [a.id, a]))
  const alerta = alertaEfetivo(h, new Date().getHours(), d.efetivo.length > 0)

  async function marcar(t, situacao, motivo = null) {
    const anterior = { situacao: t.situacao, motivo: t.motivo_nao_feito }
    const { erro: falha } = await dados.marcarTarefa(t.id, situacao, motivo)
    if (falha) return toast(falha, { erro: true })
    recarregar()
    toast(situacao === 'Feito' ? 'Marcada como feita' : `Não feito: ${motivo}`, {
      acao: { rotulo: 'Desfazer', fn: async () => { await dados.marcarTarefa(t.id, anterior.situacao, anterior.motivo); recarregar() } },
    })
  }

  const feitas = d.tarefas.filter((t) => t.situacao === 'Feito').length
  return (
    <div className="wrap stack">
      {alerta && (
        <div className="alert">
          <Icon nome="alert" />
          <p>Efetivo de hoje não lançado<small>{nomeDia(h)} {fmtCurta(h)} · passou das 10h</small></p>
          <button type="button" className="btn" onClick={() => goto('efetivo')}>Lançar</button>
        </div>
      )}
      <Card titulo={`Hoje · ${nomeDia(h)} ${fmtData(h)}`} direita={d.tarefas.length ? <Tag tom={feitas === d.tarefas.length ? 'ok' : 'idle'}>{feitas} de {d.tarefas.length} feitas</Tag> : null}>
        {d.tarefas.length === 0 && <Vazio icone="hoje" titulo="Nenhuma tarefa planejada para hoje" texto="Quando o engenheiro programar a semana, as tarefas do dia aparecem aqui." />}
        <ul className="list">
          {d.tarefas.map((t) => {
            const a = ativ.get(t.atividade_id)
            return (
              <li key={t.id} className={`row ${t.situacao === 'Não feito' ? 'is-bad' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <span className="t">
                  <b style={{ fontSize: 18 }}>{t.descricao}</b>
                  <small>{t.responsavel}{a ? ` · ${a.local && a.servico ? `${a.local} › ${a.servico}` : a.nome}` : ''}</small>
                </span>
                <div><Tag tom={TOM[t.situacao]}>{t.situacao}{t.motivo_nao_feito ? ` · ${t.motivo_nao_feito}` : ''}</Tag></div>
                <div className="botoes2">
                  <button type="button" className={`btn ${t.situacao === 'Feito' ? 'btn-ok' : ''}`} style={{ minHeight: 56 }}
                    onClick={() => marcar(t, t.situacao === 'Feito' ? 'Planejada' : 'Feito')}><Icon nome="check" /> Feito</button>
                  <button type="button" className={`btn ${t.situacao === 'Não feito' ? 'btn-bad' : 'btn-ghost-bad'}`} style={{ minHeight: 56 }}
                    onClick={() => (t.situacao === 'Não feito' ? marcar(t, 'Planejada') : setMotivoDe(t))}><Icon nome="close" /> Não feito</button>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
      <MotivoSheet aberto={!!motivoDe} onFechar={() => setMotivoDe(null)} onEscolher={(m) => { const t = motivoDe; setMotivoDe(null); marcar(t, 'Não feito', m) }} />
    </div>
  )
}
