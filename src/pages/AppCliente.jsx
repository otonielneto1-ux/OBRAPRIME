// Shell do Cliente: uma tela só, leitura.

import { useApp } from '../lib/AppContext.jsx'
import Shell from './Shell.jsx'
import { Icon } from '../components/index.jsx'
import PainelCliente from '../screens/painelCliente.jsx'

export default function AppCliente() {
  const { sair } = useApp()
  const botaoSair = (
    <button type="button" className="top-btn so-celular" aria-label="Sair" onClick={sair}>
      <Icon nome="sair" tamanho={22} />
    </button>
  )
  return (
    <Shell itens={[{ id: 'cliente', rotulo: 'Acompanhamento', icone: 'painel' }]} atual="cliente" irPara={() => {}} botaoTopo={botaoSair}>
      <PainelCliente />
    </Shell>
  )
}
