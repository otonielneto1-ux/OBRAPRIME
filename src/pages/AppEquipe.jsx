// Shell de Gerente, Coordenador e Engenheiro (escritório e canteiro).

import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import Shell from './Shell.jsx'
import Painel from '../screens/painel.jsx'
import Cronograma from '../screens/cronograma.jsx'
import Importar from '../screens/importar.jsx'
import Acerto from '../screens/acerto.jsx'
import Planejamento from '../screens/planejamento.jsx'
import Efetivo from '../screens/efetivo.jsx'
import Obras from '../screens/obras.jsx'
import Usuarios from '../screens/usuarios.jsx'
import Avisos from '../screens/avisos.jsx'
import Perfil from '../screens/perfil.jsx'
import Mais from '../screens/mais.jsx'

const TITULOS = { obras: 'Obras', usuarios: 'Usuários', perfil: 'Meu perfil', mais: 'Mais' }

export default function AppEquipe() {
  const { usuario } = useApp()
  const [rota, setRota] = useState({ tela: 'painel', params: {} })
  const goto = (tela, params = {}) => { setRota({ tela, params }); window.scrollTo(0, 0) }

  const itens = [
    { id: 'painel', rotulo: 'Painel', icone: 'painel' },
    { id: 'crono', rotulo: 'Cronograma', icone: 'crono' },
    { id: 'plan', rotulo: 'Planejamento', icone: 'plan' },
    { id: 'efetivo', rotulo: 'Efetivo', icone: 'efetivo' },
    { id: 'obras', rotulo: 'Obras', icone: 'obras' },
    ...(pode(usuario, 'gerenciarUsuarios') ? [{ id: 'usuarios', rotulo: 'Usuários', icone: 'usuarios' }] : []),
  ]
  const itensCelular = [
    itens[0], itens[1], itens[2], itens[3],
    { id: 'mais', rotulo: 'Mais', icone: 'mais', inclui: ['obras', 'usuarios', 'avisos', 'perfil'] },
  ]

  const { tela, params } = rota
  let corpo
  switch (tela) {
    case 'crono': corpo = <Cronograma goto={goto} params={params} />; break
    case 'importar': corpo = <Importar goto={goto} />; break
    case 'acerto': corpo = <Acerto goto={goto} />; break
    case 'plan': corpo = <Planejamento goto={goto} params={params} />; break
    case 'efetivo': corpo = <Efetivo goto={goto} />; break
    case 'obras': corpo = <Obras goto={goto} />; break
    case 'usuarios': corpo = <Usuarios />; break
    case 'avisos': corpo = <Avisos />; break
    case 'perfil': corpo = <Perfil />; break
    case 'mais': corpo = <Mais goto={goto} />; break
    default: corpo = <Painel goto={goto} />
  }
  const semSeletor = ['obras', 'usuarios', 'perfil', 'mais'].includes(tela)
  return (
    <Shell itens={itens} itensCelular={itensCelular} atual={['importar', 'acerto'].includes(tela) ? 'crono' : tela} irPara={goto}
      semSeletor={semSeletor} titulo={TITULOS[tela]}>
      {corpo}
    </Shell>
  )
}
