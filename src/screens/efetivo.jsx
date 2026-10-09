// Efetivo diário: quantas pessoas, de que tipo, função, empresa e atividade.

import { useEffect, useMemo, useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { folhas, situacao } from '../lib/cronograma.js'
import { validarLinhaEfetivo, totaisEfetivo, copiarLinhas } from '../lib/efetivo.js'
import { hoje, addDias, fmtCurta, nomeDia, maxData } from '../lib/datas.js'
import { TIPOS_EFETIVO, TIPOS_FUNCAO } from '../lib/vocabulario.js'
import { Card, Icon, Vazio, Carregando, ErroBloco, Sheet, Campo, useCarregar, useToast } from '../components/index.jsx'

export default function Efetivo() {
  const { usuario } = useApp()
  const toast = useToast()
  const h = hoje()
  const [data, setData] = useState(h)
  const [linhas, setLinhas] = useState(null)
  const [mexido, setMexido] = useState(false)
  const [editando, setEditando] = useState(null)
  const [funcoesAberto, setFuncoesAberto] = useState(false)
  const [ver30, setVer30] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const { d, erro, carregando, recarregar } = useCarregar(() => ({
    efetivo: dados.listarEfetivo({ de: addDias(h, -30), ate: h }),
    funcoes: dados.listarFuncoes(),
    atividades: dados.listarAtividades(),
  }))

  const doDia = useMemo(() => (d ? d.efetivo.filter((l) => l.data === data) : []), [d, data])
  useEffect(() => { setLinhas(doDia.map((l) => ({ ...l }))); setMexido(false) }, [doDia])

  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d || !linhas) return <div className="wrap"><div className="card"><Carregando /></div></div>

  const funcao = new Map(d.funcoes.map((f) => [f.id, f]))
  const ativ = new Map(d.atividades.map((a) => [a.id, a]))
  const nomeAtiv = (id) => { const a = ativ.get(id); return a ? (a.local && a.servico ? `${a.local} › ${a.servico}` : a.nome) : '' }
  const editavel = pode(usuario, 'lancarEfetivo') && (data === h || pode(usuario, 'editarEfetivoAnterior'))
  const ultimoAntes = maxData(d.efetivo.filter((l) => l.data < data).map((l) => l.data))
  const linhasUltimo = d.efetivo.filter((l) => l.data === ultimoAntes)
  const tot = totaisEfetivo(linhas)
  const dias = [...new Set(d.efetivo.map((l) => l.data))].sort().reverse()
  const tabela = (ver30 ? dias : dias.slice(0, 7)).map((dia) => ({ dia, ...totaisEfetivo(d.efetivo.filter((l) => l.data === dia)) }))

  const mudar = (novas) => { setLinhas(novas); setMexido(true) }
  const passo = (i, delta) => mudar(linhas.map((l, j) => (j === i ? { ...l, quantidade: Math.max(1, Number(l.quantidade) + delta) } : l)))

  async function salvar() {
    for (let i = 0; i < linhas.length; i++) {
      const falha = validarLinhaEfetivo(linhas[i])
      if (falha) { setEditando({ indice: i, linha: linhas[i], erro: falha }); return }
    }
    setSalvando(true)
    const { erro: falha } = await dados.salvarEfetivoDia(data, linhas)
    setSalvando(false)
    if (falha) return toast(falha, { erro: true })
    toast(`Efetivo de ${fmtCurta(data)} salvo: ${tot.total} pessoas`)
    recarregar()
  }

  const grupo = (tipo) => {
    const itens = linhas.map((l, i) => ({ l, i })).filter((x) => x.l.tipo === tipo)
    if (!itens.length) return null
    return (
      <Card key={tipo} titulo={tipo} direita={<span className="info-linha">{tot.porTipo[tipo]} pessoas</span>}>
        <ul className="list">
          {itens.map(({ l, i }) => (
            <li key={i} className="row">
              <button type="button" className="t" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, minHeight: 44 }}
                onClick={() => editavel && setEditando({ indice: i, linha: l })} disabled={!editavel}>
                <b>{funcao.get(l.funcao_id)?.nome || 'Função'}</b>
                <small>{[l.empresa, l.atividade_id ? nomeAtiv(l.atividade_id) : 'Obra toda'].filter(Boolean).join(' · ')}</small>
              </button>
              {editavel ? (
                <span className="stepper">
                  <button type="button" onClick={() => passo(i, -1)} aria-label="Menos uma pessoa">−</button>
                  <output>{l.quantidade}</output>
                  <button type="button" onClick={() => passo(i, 1)} aria-label="Mais uma pessoa">+</button>
                </span>
              ) : <span className="pct"><b>{l.quantidade}</b></span>}
            </li>
          ))}
        </ul>
      </Card>
    )
  }

  return (
    <div className="wrap stack">
      <div className="card datenav">
        <button type="button" onClick={() => setData(addDias(data, -1))} disabled={data <= addDias(h, -30)} aria-label="Dia anterior"><Icon nome="left" tamanho={22} /></button>
        <div className="d">
          <b>{nomeDia(data)}, {fmtCurta(data)}</b>
          <small>{data === h ? 'Hoje' : editavel ? 'Dia anterior · você pode editar' : 'Dia anterior · só o gerente edita'}</small>
        </div>
        <button type="button" onClick={() => setData(addDias(data, 1))} disabled={data >= h} aria-label="Próximo dia"><Icon nome="right" tamanho={22} /></button>
      </div>

      {linhas.length === 0 ? (
        <div className="card">
          <Vazio icone="efetivo" titulo={data === h ? 'Efetivo de hoje ainda não lançado' : 'Nenhum efetivo lançado neste dia'}
            texto={editavel && linhasUltimo.length ? `No último dia lançado (${fmtCurta(ultimoAntes)}) foram ${totaisEfetivo(linhasUltimo).total} pessoas. Copie e ajuste só o que mudou.` : editavel ? 'Adicione a primeira linha: tipo, função e quantas pessoas.' : null}
            acao={editavel && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                {linhasUltimo.length > 0 && (
                  <button type="button" className="btn btn-primary" onClick={() => { mudar(copiarLinhas(linhasUltimo, data)); toast(`Copiado de ${fmtCurta(ultimoAntes)}: ${totaisEfetivo(linhasUltimo).total} pessoas`) }}>
                    <Icon nome="copy" /> Copiar de {fmtCurta(ultimoAntes)}
                  </button>
                )}
                <button type="button" className="btn" onClick={() => setEditando({ indice: -1, linha: { tipo: 'MO direta', quantidade: 1 } })}><Icon nome="plus" /> Adicionar linha</button>
              </div>
            )} />
        </div>
      ) : (
        <>
          <div className="card tot">
            <div className="big"><span className="lbl">Total no canteiro</span><b>{tot.total}</b></div>
            <div><span className="lbl">MO direta</span><b>{tot.porTipo['MO direta']}</b></div>
            <div><span className="lbl">MO indireta</span><b>{tot.porTipo['MO indireta']}</b></div>
            <div><span className="lbl">Terceiriz.</span><b>{tot.porTipo.Terceirizado}</b></div>
          </div>
          {TIPOS_EFETIVO.map(grupo)}
          {editavel && (
            <button type="button" className="btn" onClick={() => setEditando({ indice: -1, linha: { tipo: 'MO direta', quantidade: 1 } })}><Icon nome="plus" /> Adicionar linha</button>
          )}
        </>
      )}

      {editavel && mexido && (
        <div className="savebar">
          <button type="button" className="btn btn-primary btn-block" onClick={salvar} disabled={salvando}>
            <Icon nome="check" /> {salvando ? 'Salvando…' : `Salvar efetivo de ${fmtCurta(data)}`}
          </button>
        </div>
      )}

      <Card titulo="Últimos dias" direita={dias.length > 7 && <button type="button" className="link" onClick={() => setVer30(!ver30)}>{ver30 ? 'Ver 7 dias' : 'Ver 30 dias'}</button>}>
        {tabela.length === 0 ? <div className="row"><span className="t muted">Nenhum efetivo lançado nos últimos 30 dias.</span></div> : (
          <table className="t">
            <thead><tr><th>Dia</th><th>MO dir.</th><th>MO ind.</th><th>Terc.</th><th>Total</th></tr></thead>
            <tbody>{tabela.map((r) => (
              <tr key={r.dia}><td>{nomeDia(r.dia)} {fmtCurta(r.dia)}</td><td>{r.porTipo['MO direta']}</td><td>{r.porTipo['MO indireta']}</td><td>{r.porTipo.Terceirizado}</td><td><b>{r.total}</b></td></tr>
            ))}</tbody>
          </table>
        )}
      </Card>

      {pode(usuario, 'editarFuncoes') && (
        <button type="button" className="btn" onClick={() => setFuncoesAberto(true)}>Funções do efetivo</button>
      )}

      {editando && (
        <LinhaForm inicial={editando} funcoes={d.funcoes} atividades={folhas(d.atividades)} nomeAtiv={nomeAtiv}
          empresas={[...new Set(d.efetivo.map((l) => l.empresa).filter(Boolean))]}
          onFechar={() => setEditando(null)}
          onSalvar={(l) => { mudar(editando.indice < 0 ? [...linhas, l] : linhas.map((x, j) => (j === editando.indice ? l : x))); setEditando(null) }}
          onRemover={editando.indice >= 0 ? () => { mudar(linhas.filter((_, j) => j !== editando.indice)); setEditando(null) } : null} />
      )}
      {funcoesAberto && <FuncoesSheet funcoes={d.funcoes} onFechar={() => setFuncoesAberto(false)} onMudou={recarregar} />}
    </div>
  )
}

function LinhaForm({ inicial, funcoes, atividades, nomeAtiv, empresas, onFechar, onSalvar, onRemover }) {
  const [l, setL] = useState({ ...inicial.linha })
  const [erro, setErro] = useState(inicial.erro || null)
  const h = hoje()
  const set = (k) => (e) => setL({ ...l, [k]: e.target.value })
  const funcoesDoTipo = funcoes.filter((f) => f.ativo && (l.tipo === 'Terceirizado' || f.tipo === l.tipo))
  // Atividades em andamento primeiro.
  const ordenadas = [...atividades].filter((a) => Number(a.percentual_realizado) < 100)
    .sort((a, b) => Number(situacao(b, h) !== 'Não iniciada') - Number(situacao(a, h) !== 'Não iniciada') || a.inicio_previsto.localeCompare(b.inicio_previsto))
  function ok() {
    const linha = { ...l, quantidade: Number(l.quantidade), atividade_id: l.tipo === 'MO indireta' ? null : l.atividade_id || null, empresa: l.tipo === 'Terceirizado' ? l.empresa : null }
    const falha = validarLinhaEfetivo(linha)
    if (falha) return setErro(falha)
    onSalvar(linha)
  }
  return (
    <Sheet aberto titulo={inicial.indice < 0 ? 'Nova linha do efetivo' : 'Editar linha'} onFechar={onFechar}
      rodape={<>
        {onRemover && <button type="button" className="btn btn-ghost-bad" onClick={onRemover}><Icon nome="lixo" /> Remover</button>}
        <button type="button" className="btn btn-primary" onClick={ok}>OK</button>
      </>}>
      <div className="form">
        <Campo rotulo="Tipo" id="l-tipo">
          <div className="opcoes" id="l-tipo">
            {TIPOS_EFETIVO.map((t) => (
              <button key={t} type="button" className={l.tipo === t ? 'on' : ''} onClick={() => setL({ ...l, tipo: t, funcao_id: '' })}>{t}</button>
            ))}
          </div>
        </Campo>
        <Campo rotulo="Função" id="l-funcao">
          <select id="l-funcao" className="ipt" value={l.funcao_id || ''} onChange={set('funcao_id')}>
            <option value="">Escolha…</option>
            {funcoesDoTipo.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
        </Campo>
        {l.tipo === 'Terceirizado' && (
          <Campo rotulo="Empresa" id="l-empresa">
            <input id="l-empresa" className="ipt" list="empresas" value={l.empresa || ''} onChange={set('empresa')} />
            <datalist id="empresas">{empresas.map((e) => <option key={e} value={e} />)}</datalist>
          </Campo>
        )}
        {l.tipo !== 'MO indireta' && (
          <Campo rotulo="Atividade em que trabalharam" id="l-ativ">
            <select id="l-ativ" className="ipt" value={l.atividade_id || ''} onChange={set('atividade_id')}>
              <option value="">Escolha…</option>
              {ordenadas.map((a) => <option key={a.id} value={a.id}>{nomeAtiv(a.id)}</option>)}
            </select>
          </Campo>
        )}
        <Campo rotulo="Quantidade de pessoas" id="l-qtd">
          <input id="l-qtd" className="ipt" type="number" inputMode="numeric" min="1" step="1" value={l.quantidade} onChange={set('quantidade')} />
        </Campo>
        {erro && <div className="aviso-erro">{erro}</div>}
      </div>
    </Sheet>
  )
}

function FuncoesSheet({ funcoes, onFechar, onMudou }) {
  const toast = useToast()
  const [nova, setNova] = useState({ nome: '', tipo: 'MO direta' })
  async function salvar(f) {
    const { erro } = await dados.salvarFuncao(f)
    if (erro) return toast(erro, { erro: true })
    onMudou()
  }
  return (
    <Sheet aberto titulo="Funções do efetivo" subtitulo="Lista usada no lançamento diário" onFechar={onFechar}>
      <div className="form">
        <Campo rotulo="Nova função" id="fn-nome">
          <input id="fn-nome" className="ipt" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} placeholder="Ex.: Calceteiro" />
        </Campo>
        <div className="opcoes" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {TIPOS_FUNCAO.map((t) => <button key={t} type="button" className={nova.tipo === t ? 'on' : ''} onClick={() => setNova({ ...nova, tipo: t })}>{t}</button>)}
        </div>
        <button type="button" className="btn btn-primary" onClick={async () => { await salvar(nova); setNova({ nome: '', tipo: nova.tipo }) }} disabled={!nova.nome.trim()}>
          <Icon nome="plus" /> Adicionar função
        </button>
      </div>
      <ul className="list">
        {funcoes.map((f) => (
          <li key={f.id} className={`row ${f.ativo ? '' : 'is-off'}`}>
            <span className="t"><b>{f.nome}</b><small>{f.tipo}{f.ativo ? '' : ' · desativada'}</small></span>
            <button type="button" className="btn btn-sm" onClick={() => salvar({ ...f, ativo: !f.ativo })}>{f.ativo ? 'Desativar' : 'Reativar'}</button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
