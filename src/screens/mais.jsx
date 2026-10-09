// "Mais" no celular: o que não coube na barra inferior.

import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { Card, Icon } from '../components/index.jsx'

export default function Mais({ goto }) {
  const { usuario, sair } = useApp()
  const itens = [
    ['obras', 'Obras', 'obras'],
    ...(pode(usuario, 'gerenciarUsuarios') ? [['usuarios', 'Usuários', 'usuarios']] : []),
    ['avisos', 'Quadro de avisos', 'aviso'],
    ['perfil', 'Meu perfil', 'perfil'],
  ]
  return (
    <div className="wrap stack">
      <Card titulo={`${usuario.nome} · ${usuario.role}`}>
        <ul className="list">
          {itens.map(([id, rotulo, icone]) => (
            <li key={id}>
              <button type="button" className="row" onClick={() => goto(id)}>
                <Icon nome={icone} /><span className="t"><b>{rotulo}</b></span><Icon nome="right" tamanho={20} />
              </button>
            </li>
          ))}
          <li>
            <button type="button" className="row" onClick={sair} style={{ color: 'var(--bad)' }}>
              <Icon nome="sair" /><span className="t"><b>Sair</b></span>
            </button>
          </li>
        </ul>
      </Card>
    </div>
  )
}
