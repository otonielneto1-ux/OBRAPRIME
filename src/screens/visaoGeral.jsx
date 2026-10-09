// Visão geral das obras (Gerente e Coordenador): uma linha por obra em andamento.
// Tocar numa obra abre o Painel dela.

import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { hoje, fmtData } from '../lib/datas.js'
import { Card, Tag, Vazio, Carregando, ErroBloco, useCarregar } from '../components/index.jsx'

function Numero({ rotulo, valor, sub, tom }) {
  return (
    <div className="vg-num">
      <span className="lbl">{rotulo}</span>
      <b style={tom === 'bad' ? { color: 'var(--bad)' } : tom === 'warn' ? { color: 'var(--warn)' } : null}>{valor}</b>
      {sub && <small>{sub}</small>}
    </div>
  )
}

export default function VisaoGeral() {
  const { obras, trocarObra } = useApp()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({ linhas: dados.resumoGeralObras() }), [obras.length])
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>
  const concluidas = obras.filter((o) => o.status === 'Concluída').length

  return (
    <div className="wrap stack">
      <span className="info-linha">Hoje, {fmtData(hoje())} · {d.linhas.length} obra{d.linhas.length === 1 ? '' : 's'} em andamento · toque numa obra para abrir o painel dela</span>
      {d.linhas.length === 0 && <div className="card"><Vazio icone="obras" titulo="Nenhuma obra em andamento" /></div>}
      {d.linhas.map((r) => (
        <Card key={r.obra.id} titulo={null}>
          <button type="button" className="vg-obra" onClick={() => trocarObra(r.obra.id)}>
            <span className="vg-topo">
              <span><b>{r.obra.nome}</b><small>{[r.obra.tipo, r.obra.cidade].filter(Boolean).join(' · ')}</small></span>
              {r.obra.status !== 'Em andamento' ? <Tag tom="warn">{r.obra.status}</Tag>
                : r.diferenca != null && <Tag tom={r.diferenca >= 0 ? 'ok' : 'bad'}>{r.diferenca >= 0 ? `+${r.diferenca}` : `−${Math.abs(r.diferenca)}`} pts</Tag>}
            </span>
            {!r.temCronograma ? (
              <span className="muted" style={{ display: 'block', padding: '4px 0 2px' }}>Sem cronograma importado.</span>
            ) : (
              <>
                <span className="barra" style={{ margin: '4px 0 10px' }}><i style={{ width: `${r.realizado}%` }} /><u style={{ left: `calc(${r.previsto}% - 1px)` }} /></span>
                <span className="vg-nums">
                  <Numero rotulo="Avanço" valor={`${Math.round(r.realizado)}%`} sub={`previsto ${Math.round(r.previsto)}%`} />
                  <Numero rotulo="Atrasadas" valor={r.atrasadas} tom={r.atrasadas ? 'bad' : null} />
                  <Numero rotulo="Restr. vencidas" valor={r.restricoesVencidas} sub={`${r.restricoesAbertas} abertas`} tom={r.restricoesVencidas ? 'bad' : null} />
                  <Numero rotulo="Efetivo hoje" valor={r.efetivoHoje ?? '—'} sub={r.efetivoHoje == null ? 'não lançado' : 'pessoas'} tom={r.efetivoHoje == null ? 'warn' : null} />
                  <Numero rotulo="Semana" valor={r.semanaPct == null ? '—' : `${r.semanaPct}%`} sub={r.semanaTotal ? `${r.semanaFeitas} de ${r.semanaTotal} tarefas` : 'sem tarefas'} tom={r.semanaPct != null && r.semanaPct < 80 ? 'warn' : null} />
                </span>
              </>
            )}
          </button>
        </Card>
      ))}
      {concluidas > 0 && <span className="info-linha">+ {concluidas} obra{concluidas > 1 ? 's' : ''} concluída{concluidas > 1 ? 's' : ''} não aparece{concluidas > 1 ? 'm' : ''} aqui</span>}
    </div>
  )
}
