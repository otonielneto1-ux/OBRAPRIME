import { useEffect, useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { USAR_MOCK } from '../lib/config.js'
import { Campo } from '../components/index.jsx'

export default function Login() {
  const { entrou } = useApp()
  const [modo, setModo] = useState('entrar')
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [demo, setDemo] = useState([])

  useEffect(() => {
    if (USAR_MOCK) dados.perfisDemonstracao().then(({ data }) => setDemo(data || []))
  }, [])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    const { data, erro: falha } = modo === 'entrar' ? await dados.entrar(form) : await dados.cadastrar(form)
    setEnviando(false)
    if (falha) return setErro(falha)
    entrou(data)
  }

  async function entrarComo(id) {
    const { data, erro: falha } = await dados.entrarComoDemo(id)
    if (falha) return setErro(falha)
    entrou(data)
  }

  const rotuloPerfil = (p) => (!p.ativo ? `${p.role} · bloqueado` : p.role === 'Pendente' ? 'Pendente · aguardando liberação' : p.role)

  return (
    <div className="login">
      <div className="login-box">
        <img src="/logo-obraprime.jpg" alt="ObraPrime — Gestão inteligente de obras" />
        <form className="card form" onSubmit={enviar}>
          {modo === 'cadastrar' && (
            <Campo rotulo="Nome" id="nome">
              <input id="nome" className="ipt" value={form.nome} onChange={set('nome')} autoComplete="name" required />
            </Campo>
          )}
          <Campo rotulo="Email" id="email">
            <input id="email" type="email" className="ipt" value={form.email} onChange={set('email')} autoComplete="email" required />
          </Campo>
          <Campo rotulo="Senha" id="senha" dica={modo === 'cadastrar' ? 'Mínimo de 8 caracteres.' : null}>
            <input id="senha" type="password" className="ipt" value={form.senha} onChange={set('senha')} minLength={8}
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required />
          </Campo>
          {erro && <div className="aviso-erro">{erro}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
          <button type="button" className="link" onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setErro(null) }}>
            {modo === 'entrar' ? 'Criar conta' : 'Já tenho conta'}
          </button>
        </form>

        {USAR_MOCK && demo.length > 0 && (
          <div className="card form">
            <div>
              <span className="lbl">Modo demonstração</span>
              <p style={{ margin: '6px 0 0', color: 'var(--ink-2)', fontSize: 15 }}>
                Ainda sem banco: entre como um dos perfis de exemplo para ver o que cada um enxerga.
              </p>
            </div>
            <div className="demo">
              {demo.map((p) => (
                <button key={p.id} type="button" onClick={() => entrarComo(p.id)}>
                  <span><b>{p.nome}</b><br /><small>{rotuloPerfil(p)}</small></span>
                  <span aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
