// Usuários (só gerente): liberar quem se cadastrou, mudar perfil e obras, bloquear.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { PERFIS } from '../lib/vocabulario.js'
import { Card, Tag, Vazio, Carregando, ErroBloco, Sheet, Campo, useCarregar, useToast } from '../components/index.jsx'

const situacaoDe = (p) => (!p.ativo ? 'Bloqueados' : p.role === 'Pendente' ? 'Aguardando' : 'Ativos')

export default function Usuarios() {
  const { obras } = useApp()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({ usuarios: dados.listarUsuarios() }))
  const [aba, setAba] = useState(null)
  const [editando, setEditando] = useState(null)
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>

  const contagem = { Aguardando: 0, Ativos: 0, Bloqueados: 0 }
  for (const p of d.usuarios) contagem[situacaoDe(p)]++
  const atual = aba || (contagem.Aguardando ? 'Aguardando' : 'Ativos')
  const lista = d.usuarios.filter((p) => situacaoDe(p) === atual)
  const nomeObra = new Map(obras.map((o) => [o.id, o.nome]))

  return (
    <div className="wrap stack">
      <div className="chips">
        {Object.keys(contagem).map((k) => (
          <button key={k} type="button" className={`chip ${atual === k ? 'on' : ''}`} onClick={() => setAba(k)}>
            {k} {k === 'Aguardando' && contagem[k] > 0 ? <span className="c">{contagem[k]}</span> : `· ${contagem[k]}`}
          </button>
        ))}
      </div>
      <Card titulo={atual}>
        {lista.length === 0 && <Vazio icone="usuarios" titulo={atual === 'Aguardando' ? 'Ninguém aguardando liberação' : 'Ninguém aqui'} />}
        <ul className="list">
          {lista.map((p) => (
            <li key={p.id}>
              <button type="button" className="row" onClick={() => setEditando(p)}>
                <span className="t">
                  <b>{p.nome}</b>
                  <small>{p.email}</small>
                  {p.obras.length > 0 && <small>{p.obras.map((id) => nomeObra.get(id) || 'obra').join(' · ')}</small>}
                </span>
                <Tag tom={p.role === 'Pendente' ? 'warn' : p.ativo ? 'navy' : 'idle'}>{p.role === 'Pendente' ? 'Aguardando' : p.role}</Tag>
              </button>
            </li>
          ))}
        </ul>
      </Card>
      {editando && <UsuarioSheet p={editando} obras={obras} onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); recarregar() }} />}
    </div>
  )
}

function UsuarioSheet({ p, obras, onFechar, onSalvo }) {
  const { usuario } = useApp()
  const toast = useToast()
  const [role, setRole] = useState(p.role === 'Pendente' ? '' : p.role)
  const [sel, setSel] = useState(new Set(p.obras))
  const [erro, setErro] = useState(null)
  const eu = p.id === usuario.id
  const precisaObra = ['Engenheiro', 'Mestre', 'Cliente'].includes(role)

  async function salvar(ativo = p.ativo) {
    if (!role) return setErro('Escolha o perfil.')
    const { erro: falha } = await dados.atualizarUsuario(p.id, { role, ativo, obras: precisaObra ? [...sel] : [] })
    if (falha) return setErro(falha)
    toast(p.role === 'Pendente' ? `${p.nome} liberado como ${role}` : ativo !== p.ativo ? (ativo ? 'Acesso desbloqueado' : 'Acesso bloqueado') : 'Usuário atualizado')
    onSalvo()
  }
  return (
    <Sheet aberto titulo={p.nome} subtitulo={p.email} onFechar={onFechar}
      rodape={eu ? null : <>
        <button type="button" className={`btn ${p.ativo ? 'btn-ghost-bad' : ''}`} onClick={() => salvar(!p.ativo)}>{p.ativo ? 'Bloquear' : 'Desbloquear'}</button>
        <button type="button" className="btn btn-primary" onClick={() => salvar()}>{p.role === 'Pendente' ? 'Liberar acesso' : 'Salvar'}</button>
      </>}>
      {eu && <div className="aviso-info">Este é você. Ninguém muda o próprio perfil nem se bloqueia.</div>}
      {!eu && (
        <div className="form">
          <Campo rotulo="Perfil" id="u-perfil">
            <div className="opcoes">{PERFIS.map((r) => <button key={r} type="button" className={role === r ? 'on' : ''} onClick={() => setRole(r)}>{r}</button>)}</div>
          </Campo>
          {precisaObra ? (
            <Campo rotulo="Obras em que trabalha" id="u-obras">
              <div className="stack" style={{ gap: 8 }}>
                {obras.map((o) => (
                  <label key={o.id} className="check">
                    <input type="checkbox" checked={sel.has(o.id)} onChange={() => { const n = new Set(sel); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); setSel(n) }} />
                    <span>{o.nome}</span>
                  </label>
                ))}
              </div>
            </Campo>
          ) : role && <div className="aviso-info">{role} vê todas as obras.</div>}
          {erro && <div className="aviso-erro">{erro}</div>}
        </div>
      )}
    </Sheet>
  )
}
