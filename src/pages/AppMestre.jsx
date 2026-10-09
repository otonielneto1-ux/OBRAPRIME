// Shell do Mestre: celular no canteiro. Entra direto em "Hoje".

import { useState } from 'react'
import Shell from './Shell.jsx'
import { Icon } from '../components/index.jsx'
import Hoje from '../screens/hoje.jsx'
import Efetivo from '../screens/efetivo.jsx'
import Painel from '../screens/painel.jsx'
import Planejamento from '../screens/planejamento.jsx'
import Avisos from '../screens/avisos.jsx'
import Perfil from '../screens/perfil.jsx'
import { ListaAvanco } from '../screens/cronograma.jsx'

const itens = [
  { id: 'hoje', rotulo: 'Hoje', icone: 'hoje' },
  { id: 'efetivo', rotulo: 'Efetivo', icone: 'efetivo' },
  { id: 'avanco', rotulo: 'Avanço', icone: 'avanco' },
  { id: 'painel', rotulo: 'Painel', icone: 'painel' },
]

export default function AppMestre() {
  const [rota, setRota] = useState({ tela: 'hoje', params: {} })
  const goto = (tela, params = {}) => { setRota({ tela, params }); window.scrollTo(0, 0) }
  const { tela, params } = rota
  let corpo
  switch (tela) {
    case 'efetivo': corpo = <Efetivo goto={goto} />; break
    case 'avanco': corpo = <div className="wrap"><ListaAvanco /></div>; break
    case 'painel': corpo = <Painel goto={goto} />; break
    case 'plan': corpo = <Planejamento goto={goto} params={params} />; break
    case 'avisos': corpo = <Avisos />; break
    case 'perfil': corpo = <Perfil />; break
    default: corpo = <Hoje goto={goto} />
  }
  const botaoPerfil = (
    <button type="button" className="top-btn so-celular" aria-label="Meu perfil" onClick={() => goto('perfil')}>
      <Icon nome="perfil" tamanho={22} />
    </button>
  )
  return (
    <Shell itens={itens} atual={tela} irPara={goto} semSeletor={tela === 'perfil'} titulo="Meu perfil" botaoTopo={botaoPerfil}>
      {corpo}
    </Shell>
  )
}
