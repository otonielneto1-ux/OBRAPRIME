import { useApp } from '../lib/AppContext.jsx'
import { Icon } from '../components/index.jsx'

export default function Aguardando() {
  const { usuario, sair } = useApp()
  const bloqueado = !usuario.ativo
  return (
    <div className="login">
      <div className="login-box">
        <img src="/logo-obraprime.jpg" alt="ObraPrime — Gestão inteligente de obras" />
        <div className="card empty">
          <div className="ic"><Icon nome={bloqueado ? 'cadeado' : 'relogio'} tamanho={40} /></div>
          <h2>{bloqueado ? 'Seu acesso está bloqueado' : 'Conta aguardando liberação do administrador'}</h2>
          <p>
            {bloqueado
              ? 'Fale com o gerente da obra.'
              : 'Assim que o gerente liberar seu acesso, você poderá entrar.'}
          </p>
          <button type="button" className="btn" onClick={sair}>Sair</button>
        </div>
      </div>
    </div>
  )
}
