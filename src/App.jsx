import { AppProvider, useApp } from './lib/AppContext.jsx'
import { shellDoPerfil } from './lib/perfis.js'
import { ToastProvider } from './components/index.jsx'
import Login from './pages/Login.jsx'
import Aguardando from './pages/Aguardando.jsx'
import AppEquipe from './pages/AppEquipe.jsx'
import AppMestre from './pages/AppMestre.jsx'
import AppCliente from './pages/AppCliente.jsx'

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <Raiz />
      </AppProvider>
    </ToastProvider>
  )
}

function Raiz() {
  const { usuario, obraId } = useApp()
  if (!usuario) return <Login />
  const shell = shellDoPerfil(usuario)
  // A key com a obra faz a tela inteira remontar ao trocar de obra:
  // nada da obra anterior fica na tela (nem é salvo nela).
  const chave = `${usuario.id}:${obraId || 'sem-obra'}`
  if (shell === 'aguardando') return <Aguardando />
  if (shell === 'cliente') return <AppCliente key={chave} />
  if (shell === 'mestre') return <AppMestre key={chave} />
  return <AppEquipe key={chave} />
}
