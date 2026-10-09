// Obras: lista, criar/editar (gerente), pessoas da obra e excluir.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { fmtData } from '../lib/datas.js'
import { TIPOS_OBRA, STATUS_OBRA } from '../lib/vocabulario.js'
import { Card, Tag, TOM, Icon, Vazio, Carregando, ErroBloco, Sheet, Campo, Confirmar, useCarregar, useToast } from '../components/index.jsx'

export default function Obras({ goto }) {
  const { usuario, obras, trocarObra, recarregarObras } = useApp()
  const toast = useToast()
  const [filtro, setFiltro] = useState('Em andamento')
  const [form, setForm] = useState(null)
  const [pessoasDe, setPessoasDe] = useState(null)
  const [excluir, setExcluir] = useState(null)
  const { d, erro, carregando, recarregar } = useCarregar(() => ({ resumo: dados.resumoDasObras() }), [obras.length])
  const gerente = pode(usuario, 'editarObra')
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>

  const lista = obras.filter((o) => filtro === 'Todas' || o.status === filtro)
  const depois = async () => { await recarregarObras(); recarregar() }

  return (
    <div className="wrap stack">
      <div className="toolbar">
        <div className="chips">
          {[...STATUS_OBRA, 'Todas'].map((s) => (
            <button key={s} type="button" className={`chip ${filtro === s ? 'on' : ''}`} onClick={() => setFiltro(s)}>{s}</button>
          ))}
        </div>
        {gerente && <button type="button" className="btn btn-primary" onClick={() => setForm({ tipo: 'Loteamento', status: 'Em andamento' })}><Icon nome="plus" /> Nova obra</button>}
      </div>

      {obras.length === 0 && (
        <div className="card">
          <Vazio icone="obras" titulo={gerente ? 'Nenhuma obra cadastrada' : 'Você ainda não está vinculado a nenhuma obra'}
            texto={gerente ? 'Crie a primeira obra para começar.' : 'Fale com o gerente.'}
            acao={gerente && <button type="button" className="btn btn-primary" onClick={() => setForm({ tipo: 'Loteamento', status: 'Em andamento' })}><Icon nome="plus" /> Criar a primeira obra</button>} />
        </div>
      )}
      {obras.length > 0 && lista.length === 0 && <div className="card"><Vazio icone="obras" titulo="Nenhuma obra neste filtro" /></div>}

      <div className="stack">
        {lista.map((o) => {
          const av = d.resumo[o.id]
          return (
            <Card key={o.id} titulo={null}>
              <button type="button" className="row" style={{ alignItems: 'flex-start', borderBottom: gerente ? '1px solid var(--line)' : 0 }}
                onClick={() => { trocarObra(o.id); goto('painel') }}>
                <span className="t">
                  <b style={{ fontSize: 18 }}>{o.nome}</b>
                  <small>{[o.cliente, o.tipo, o.cidade].filter(Boolean).join(' · ')}</small>
                  <small>{o.data_inicio ? fmtData(o.data_inicio) : 'sem início'} → {o.data_termino_prevista ? fmtData(o.data_termino_prevista) : 'sem término'}</small>
                  {av ? <span className="barra" style={{ marginTop: 10 }}><i style={{ width: `${av.realizado}%` }} /><u style={{ left: `calc(${av.previsto}% - 1px)` }} /></span>
                    : <small style={{ marginTop: 8 }}>Sem cronograma importado</small>}
                </span>
                <span className="pct">
                  <b>{av ? `${Math.round(av.realizado)}%` : '—'}</b>
                  <Tag tom={TOM[o.status]}>{o.status}</Tag>
                </span>
              </button>
              {gerente && (
                <div style={{ display: 'flex', gap: 8, padding: '10px 14px', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-sm" onClick={() => setForm(o)}><Icon nome="editar" /> Editar</button>
                  <button type="button" className="btn btn-sm" onClick={() => setPessoasDe(o)}><Icon nome="usuarios" /> Pessoas da obra</button>
                  <button type="button" className="btn btn-sm btn-ghost-bad" onClick={() => setExcluir(o)}><Icon nome="lixo" /> Excluir</button>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {form && <ObraForm inicial={form} onFechar={() => setForm(null)} onSalvo={async (o) => { setForm(null); toast(form.id ? 'Obra atualizada' : `Obra criada: ${o.nome}`); await depois() }} />}
      {pessoasDe && <PessoasSheet obra={pessoasDe} onFechar={() => setPessoasDe(null)} />}
      <Confirmar aberto={!!excluir} titulo="Excluir obra" exigirTexto={excluir?.nome}
        texto={`Excluir a obra ${excluir?.nome} apaga cronograma, avanços, efetivo e planejamento dela. Isso não pode ser desfeito.`}
        onCancelar={() => setExcluir(null)}
        onConfirmar={async () => { const { erro: falha } = await dados.excluirObra(excluir.id); setExcluir(null); if (falha) toast(falha, { erro: true }); else { toast('Obra excluída'); await depois() } }} />
    </div>
  )
}

function ObraForm({ inicial, onFechar, onSalvo }) {
  const [o, setO] = useState({ nome: '', cliente: '', cidade: '', data_inicio: '', data_termino_prevista: '', ...inicial })
  const [erro, setErro] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const set = (k) => (e) => setO({ ...o, [k]: e.target.value })
  async function salvar() {
    setSalvando(true)
    const { data, erro: falha } = await dados.salvarObra(o)
    setSalvando(false)
    if (falha) return setErro(falha)
    onSalvo(data)
  }
  return (
    <Sheet aberto titulo={o.id ? 'Editar obra' : 'Nova obra'} onFechar={onFechar}
      rodape={<><button type="button" className="btn" onClick={onFechar}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button></>}>
      <div className="form">
        <Campo rotulo="Nome da obra" id="o-nome"><input id="o-nome" className="ipt" value={o.nome} onChange={set('nome')} /></Campo>
        <Campo rotulo="Cliente" id="o-cli"><input id="o-cli" className="ipt" value={o.cliente || ''} onChange={set('cliente')} /></Campo>
        <Campo rotulo="Tipo" id="o-tipo">
          <div className="opcoes">{TIPOS_OBRA.map((t) => <button key={t} type="button" className={o.tipo === t ? 'on' : ''} onClick={() => setO({ ...o, tipo: t })}>{t}</button>)}</div>
        </Campo>
        <Campo rotulo="Cidade" id="o-cid"><input id="o-cid" className="ipt" value={o.cidade || ''} onChange={set('cidade')} placeholder="Ex.: Itu/SP" /></Campo>
        <div className="duas-col">
          <Campo rotulo="Início" id="o-ini" dica="Se vazio, vem do cronograma."><input id="o-ini" type="date" className="ipt" value={o.data_inicio || ''} onChange={set('data_inicio')} /></Campo>
          <Campo rotulo="Término previsto" id="o-fim"><input id="o-fim" type="date" className="ipt" value={o.data_termino_prevista || ''} onChange={set('data_termino_prevista')} /></Campo>
        </div>
        <Campo rotulo="Situação" id="o-st">
          <div className="opcoes">{STATUS_OBRA.map((t) => <button key={t} type="button" className={o.status === t ? 'on' : ''} onClick={() => setO({ ...o, status: t })}>{t}</button>)}</div>
        </Campo>
        {erro && <div className="aviso-erro">{erro}</div>}
      </div>
    </Sheet>
  )
}

function PessoasSheet({ obra, onFechar }) {
  const toast = useToast()
  const { d, erro, carregando } = useCarregar(() => ({ usuarios: dados.listarUsuarios(), vinculados: dados.pessoasDaObra(obra.id) }))
  const [marcados, setMarcados] = useState(null)
  const sel = marcados || new Set(d?.vinculados || [])
  const candidatos = (d?.usuarios || []).filter((p) => p.ativo && ['Engenheiro', 'Mestre', 'Cliente'].includes(p.role))
  async function salvar() {
    const { erro: falha } = await dados.definirPessoasDaObra(obra.id, [...sel])
    if (falha) return toast(falha, { erro: true })
    toast('Pessoas da obra atualizadas')
    onFechar()
  }
  return (
    <Sheet aberto titulo="Pessoas da obra" subtitulo={obra.nome} onFechar={onFechar}
      rodape={<><button type="button" className="btn" onClick={onFechar}>Cancelar</button><button type="button" className="btn btn-primary" onClick={salvar} disabled={!d}>Salvar</button></>}>
      {erro && <div className="aviso-erro">{erro}</div>}
      {carregando && <Carregando />}
      <div className="aviso-info">Gerente e coordenador já veem todas as obras. Aqui entram engenheiros, mestres e o cliente.</div>
      <div className="stack" style={{ gap: 8 }}>
        {candidatos.map((p) => (
          <label key={p.id} className="check">
            <input type="checkbox" checked={sel.has(p.id)} onChange={() => { const n = new Set(sel); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); setMarcados(n) }} />
            <span><b>{p.nome}</b> <span className="muted">· {p.role}</span></span>
          </label>
        ))}
      </div>
    </Sheet>
  )
}
