// A "casca" comum a todos os perfis: cabeçalho marinho com o seletor de obra,
// menu lateral no computador e barra inferior no celular.

import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { Icon, Vazio } from '../components/index.jsx'

export default function Shell({ itens, itensCelular, atual, irPara, semSeletor, titulo, children, botaoTopo }) {
  const { usuario, obras, obra, trocarObra, sair } = useApp()
  const [menuAberto, setMenuAberto] = useState(false)
  const celular = itensCelular || itens
  const sub = obra
    ? `${obra.tipo} · ${obra.cidade || 'sem cidade'} · ${obra.revisao_atual ? `Rev. ${obra.revisao_atual}` : 'sem cronograma'}`
    : ''

  let corpo = children
  if (!semSeletor && !obra) {
    corpo = (
      <div className="wrap"><div className="card">
        {pode(usuario, 'editarObra') ? (
          <Vazio icone="obras" titulo="Nenhuma obra cadastrada" texto="Crie a primeira obra para começar a acompanhar o cronograma."
            acao={<button type="button" className="btn btn-primary" onClick={() => irPara('obras')}><Icon nome="plus" /> Criar a primeira obra</button>} />
        ) : (
          <Vazio icone="obras" titulo="Você ainda não está vinculado a nenhuma obra" texto="Fale com o gerente para ele te incluir na obra em que você trabalha." />
        )}
      </div></div>
    )
  }

  return (
    <div className="app">
      <aside className="side">
        <img className="logo" src="/logo-obraprime.jpg" alt="ObraPrime — Gestão inteligente de obras" />
        <nav aria-label="Menu principal">
          {itens.map((it) => (
            <button key={it.id} type="button" className={atual === it.id ? 'on' : ''} aria-current={atual === it.id ? 'page' : undefined} onClick={() => irPara(it.id)}>
              <Icon nome={it.icone} tamanho={22} />{it.rotulo}
            </button>
          ))}
        </nav>
        <div className="who">
          <small>{usuario.role}</small>
          <b>{usuario.nome}</b>
          <div className="acoes">
            <button type="button" onClick={() => irPara('perfil')}>Meu perfil</button>
            <button type="button" onClick={sair}>Sair</button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="top">
          <div className="top-in">
            <div className="top-row">
              <div className="mark"><Icon nome="building" tamanho={22} /></div>
              <div className="obra">
                {semSeletor || !obra
                  ? <><h1>{titulo}</h1><p>ObraPrime · Gestão inteligente de obras</p></>
                  : <><h1>{obra.nome}</h1><p>{sub}</p></>}
              </div>
              {!semSeletor && obras.length > 1 && (
                <button type="button" className="trocar" aria-expanded={menuAberto} onClick={() => setMenuAberto(!menuAberto)}>
                  Trocar <Icon nome="down" tamanho={14} />
                </button>
              )}
              {botaoTopo}
            </div>
            <div id="slot-abas" />
            {menuAberto && (
              <div className="menu-obras" role="menu">
                {obras.map((o) => (
                  <button key={o.id} type="button" role="menuitem" className={o.id === obra?.id ? 'on' : ''}
                    onClick={() => { setMenuAberto(false); if (o.id !== obra?.id) trocarObra(o.id) }}>
                    <b>{o.nome}</b>
                    <small>{o.tipo} · {o.status}{o.revisao_atual ? ` · Rev. ${o.revisao_atual}` : ' · sem cronograma'}</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>
        <main>{corpo}</main>
      </div>

      {celular.length > 1 && (
        <nav className="bottom" aria-label="Menu">
          {celular.map((it) => (
            <button key={it.id} type="button" className={atual === it.id || it.inclui?.includes(atual) ? 'on' : ''} onClick={() => irPara(it.id)}>
              <Icon nome={it.icone} /><span>{it.rotulo}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
