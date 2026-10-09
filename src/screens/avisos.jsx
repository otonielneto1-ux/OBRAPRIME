// Quadro de avisos da obra.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { fmtData } from '../lib/datas.js'
import { Card, Icon, Vazio, Carregando, ErroBloco, Sheet, Campo, Confirmar, useCarregar, useToast } from '../components/index.jsx'

export default function Avisos() {
  const { usuario } = useApp()
  const toast = useToast()
  const { d, erro, carregando, recarregar } = useCarregar(() => ({ avisos: dados.listarAvisos() }))
  const [form, setForm] = useState(null)
  const [excluir, setExcluir] = useState(null)
  if (erro) return <ErroBloco mensagem={erro} tentar={recarregar} />
  if (carregando || !d) return <div className="wrap"><div className="card"><Carregando /></div></div>
  const podeCriar = pode(usuario, 'criarAviso')

  async function fixar(a) {
    const { erro: falha } = await dados.fixarAviso(a.id, !a.fixado)
    if (falha) return toast(falha, { erro: true })
    recarregar()
  }

  return (
    <div className="wrap stack">
      {podeCriar && d.avisos.length > 0 && (
        <div className="toolbar"><span /><button type="button" className="btn btn-primary" onClick={() => setForm({})}><Icon nome="plus" /> Novo aviso</button></div>
      )}
      <Card titulo="Quadro de avisos">
        {d.avisos.length === 0 && (
          <Vazio icone="aviso" titulo="Nenhum aviso nesta obra"
            texto="Use o quadro para lembrar a equipe do DDS, de visitas, entregas e mudanças no canteiro."
            acao={podeCriar && <button type="button" className="btn btn-primary" onClick={() => setForm({})}><Icon nome="plus" /> Criar o primeiro aviso</button>} />
        )}
        <ul className="list">
          {d.avisos.map((a) => (
            <li key={a.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {a.fixado && <span title="Fixado" style={{ color: 'var(--navy)', marginTop: 2 }}><Icon nome="pin" tamanho={20} /></span>}
              <span className="t" style={{ minWidth: 220 }}>
                <b>{a.titulo}</b>
                <p>{a.texto}</p>
                <small>{a.autor_nome} · {fmtData(a.created_at)}</small>
              </span>
              <span className="acoes">
                {pode(usuario, 'fixarAviso') && <button type="button" className="btn btn-sm" onClick={() => fixar(a)}><Icon nome="pin" /> {a.fixado ? 'Desafixar' : 'Fixar'}</button>}
                {(a.autor_id === usuario.id || pode(usuario, 'fixarAviso')) && podeCriar && <button type="button" className="btn btn-sm" onClick={() => setForm(a)} aria-label="Editar"><Icon nome="editar" /></button>}
                {pode(usuario, 'apagar') && <button type="button" className="btn btn-sm btn-ghost-bad" onClick={() => setExcluir(a)} aria-label="Excluir"><Icon nome="lixo" /></button>}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      {form && <AvisoForm inicial={form} onFechar={() => setForm(null)} onSalvo={() => { setForm(null); recarregar() }} />}
      <Confirmar aberto={!!excluir} titulo="Excluir aviso" texto={`Excluir "${excluir?.titulo}"?`} onCancelar={() => setExcluir(null)}
        onConfirmar={async () => { const { erro: falha } = await dados.excluirAviso(excluir.id); setExcluir(null); if (falha) toast(falha, { erro: true }); else { toast('Aviso excluído'); recarregar() } }} />
    </div>
  )
}

function AvisoForm({ inicial, onFechar, onSalvo }) {
  const toast = useToast()
  const [a, setA] = useState({ titulo: '', texto: '', ...inicial })
  const [erro, setErro] = useState(null)
  async function salvar() {
    const { erro: falha } = await dados.salvarAviso(a)
    if (falha) return setErro(falha)
    toast(a.id ? 'Aviso atualizado' : 'Aviso publicado')
    onSalvo()
  }
  return (
    <Sheet aberto titulo={a.id ? 'Editar aviso' : 'Novo aviso'} onFechar={onFechar}
      rodape={<><button type="button" className="btn" onClick={onFechar}>Cancelar</button><button type="button" className="btn btn-primary" onClick={salvar}>Publicar</button></>}>
      <div className="form">
        <Campo rotulo="Título" id="a-tit"><input id="a-tit" className="ipt" value={a.titulo} onChange={(e) => setA({ ...a, titulo: e.target.value })} placeholder="Ex.: Visita da prefeitura na quinta" /></Campo>
        <Campo rotulo="Texto" id="a-txt"><textarea id="a-txt" className="ipt" value={a.texto} onChange={(e) => setA({ ...a, texto: e.target.value })} /></Campo>
        {erro && <div className="aviso-erro">{erro}</div>}
      </div>
    </Sheet>
  )
}
