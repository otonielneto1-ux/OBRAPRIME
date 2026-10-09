// Peças reutilizáveis da interface. Só aparência e comportamento de tela:
// nenhuma regra de negócio mora aqui (essas ficam em src/lib).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ───────────────────────── Ícones (SVG, nunca emoji) ─────────────────────────

const P = {
  painel: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  crono: <path d="M3 5h8M7 10h10M11 15h9M5 20h7" />,
  plan: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4M7 13h3M7 17h3M14 13h3" /></>,
  efetivo: <><circle cx="9" cy="7" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17.5" cy="8.5" r="2.5" /><path d="M17 13.5c2.6.2 4.5 2.2 4.5 5" /></>,
  obras: <path d="M3 21h18M5 21V9l5-4v16M10 21V3l9 5v13M14 11h2M14 15h2M7 13h1M7 17h1" />,
  usuarios: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></>,
  hoje: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12l3 3 5-6" /></>,
  avanco: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  aviso: <path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zM16 8a5 5 0 010 8M19 5a9 9 0 010 14" />,
  down: <path d="M6 9l6 6 6-6" />,
  chev: <path d="M6 9l6 6 6-6" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  alert: <><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18h.01" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  upload: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 15v4a2 2 0 002 2h12a2 2 0 002-2v-4" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M4 16V5a2 2 0 012-2h10" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  file: <><path d="M14 3H6a1 1 0 00-1 1v16a1 1 0 001 1h12a1 1 0 001-1V8z" /><path d="M14 3v5h5M8 13h8M8 17h5" /></>,
  building: <path d="M4 21V10l5-4v15M9 21V3l9 5v13M3 21h18" />,
  sair: <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H3" />,
  pin: <path d="M9 4h6l-1 6 4 4H6l4-4zM12 14v7" />,
  lixo: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />,
  editar: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" />,
  relogio: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  cadeado: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>,
  mais: null,
}

export function Icon({ nome, tamanho = 24 }) {
  if (nome === 'mais') {
    return <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
  }
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[nome]}
    </svg>
  )
}

// ───────────────────────── Etiquetas e cores de situação ─────────────────────────

export function Tag({ tom = 'idle', children, className = '' }) {
  return <span className={`tag ${tom} ${className}`}>{children}</span>
}

/** Tom da etiqueta para a situação de atividade, tarefa e obra (só aparência). */
export const TOM = {
  'Concluída': 'ok', 'No prazo': 'ok', 'Atrasada': 'bad', 'Não iniciada': 'idle', 'Removida': 'idle',
  'Feito': 'ok', 'Não feito': 'bad', 'Planejada': 'idle',
  'Em andamento': 'ok', 'Paralisada': 'warn',
}

// ───────────────────────── Cartões e blocos ─────────────────────────

export function Card({ titulo, direita, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {titulo != null && (
        <div className="card-h"><span className="lbl">{titulo}</span>{direita}</div>
      )}
      {children}
    </section>
  )
}

export function Vazio({ icone = 'file', titulo, texto, acao, extra }) {
  return (
    <div className="empty">
      <div className="ic"><Icon nome={icone} tamanho={40} /></div>
      <h2>{titulo}</h2>
      {texto && <p>{texto}</p>}
      {acao}
      {extra}
    </div>
  )
}

export function Carregando({ linhas = 4 }) {
  return (
    <div className="carregando" aria-label="Carregando">
      {Array.from({ length: linhas }, (_, i) => <i key={i} style={{ width: `${90 - i * 12}%` }} />)}
    </div>
  )
}

export function ErroBloco({ mensagem, tentar }) {
  return (
    <div className="wrap">
      <div className="card empty">
        <div className="ic"><Icon nome="alert" tamanho={40} /></div>
        <h2>Não foi possível carregar</h2>
        <p>{mensagem}</p>
        {tentar && <button type="button" className="btn" onClick={tentar}>Tentar de novo</button>}
      </div>
    </div>
  )
}

export function Campo({ rotulo, erro, dica, children, id }) {
  return (
    <div className="campo">
      {rotulo && <label htmlFor={id}>{rotulo}</label>}
      {children}
      {erro && <div className="erro">{erro}</div>}
      {dica && !erro && <div className="dica">{dica}</div>}
    </div>
  )
}

export function Foto({ url, legenda }) {
  if (url && !String(url).startsWith('demo:')) {
    return <span className="foto"><img src={url} alt={legenda || 'Foto do avanço'} /></span>
  }
  return <span className="foto" role="img" aria-label={legenda || 'Foto do avanço'}>FOTO</span>
}

// ───────────────────────── Gaveta (sheet) e confirmação ─────────────────────────

export function Sheet({ aberto, titulo, subtitulo, onFechar, children, rodape }) {
  useEffect(() => {
    if (!aberto) return undefined
    const esc = (e) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [aberto, onFechar])
  if (!aberto) return null
  return createPortal(
    <>
      <div className="scrim" onClick={onFechar} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="dr-h">
          <div>{subtitulo && <small>{subtitulo}</small>}<h2>{titulo}</h2></div>
          <button type="button" onClick={onFechar} aria-label="Fechar"><Icon nome="close" tamanho={22} /></button>
        </div>
        <div className="dr-b">{children}</div>
        {rodape && <div className="dr-f">{rodape}</div>}
      </aside>
    </>,
    document.body,
  )
}

/** Confirmação antes de excluir. `exigirTexto` obriga a digitar (ex.: o nome da obra). */
export function Confirmar({ aberto, titulo, texto, botao = 'Excluir', exigirTexto, onConfirmar, onCancelar }) {
  const [digitado, setDigitado] = useState('')
  const [salvando, setSalvando] = useState(false)
  useEffect(() => { if (aberto) { setDigitado(''); setSalvando(false) } }, [aberto])
  const liberado = !exigirTexto || digitado.trim() === exigirTexto
  return (
    <Sheet aberto={aberto} titulo={titulo} onFechar={onCancelar}
      rodape={<>
        <button type="button" className="btn" onClick={onCancelar}>Cancelar</button>
        <button type="button" className="btn btn-bad" disabled={!liberado || salvando}
          onClick={async () => { setSalvando(true); await onConfirmar(); setSalvando(false) }}>
          {salvando ? 'Excluindo…' : botao}
        </button>
      </>}>
      <p style={{ margin: 0, fontSize: 16 }}>{texto}</p>
      {exigirTexto && (
        <Campo rotulo={`Digite "${exigirTexto}" para confirmar`} id="confirma-texto">
          <input id="confirma-texto" className="ipt" value={digitado} onChange={(e) => setDigitado(e.target.value)} autoComplete="off" />
        </Campo>
      )}
    </Sheet>
  )
}

// ───────────────────────── Aviso flutuante (toast) ─────────────────────────

const ToastCtx = createContext(() => {})

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null)
  const timer = useRef(null)
  const mostrar = useCallback((texto, { erro = false, acao = null, duracao } = {}) => {
    clearTimeout(timer.current)
    setMsg({ texto, erro, acao })
    timer.current = setTimeout(() => setMsg(null), duracao || (acao ? 5000 : 2600))
  }, [])
  return (
    <ToastCtx.Provider value={mostrar}>
      {children}
      {msg && (
        <div className={`toast ${msg.erro ? 'erro' : ''}`} role="status">
          <Icon nome={msg.erro ? 'alert' : 'check'} tamanho={20} />
          <span>{msg.texto}</span>
          {msg.acao && <button type="button" onClick={() => { msg.acao.fn(); setMsg(null) }}>{msg.acao.rotulo}</button>}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}

// ───────────────────────── Abas no cabeçalho ─────────────────────────

/** As abas aparecem dentro do cabeçalho marinho (o Shell reserva o lugar). */
export function Abas({ abas, atual, onTroca }) {
  const [alvo, setAlvo] = useState(null)
  useEffect(() => { setAlvo(document.getElementById('slot-abas')) }, [])
  if (!alvo) return null
  return createPortal(
    <div className="tabs" role="tablist">
      {abas.map(([id, rotulo]) => (
        <button key={id} type="button" role="tab" aria-selected={atual === id} className={atual === id ? 'on' : ''} onClick={() => onTroca(id)}>
          {rotulo}
        </button>
      ))}
    </div>,
    alvo,
  )
}

// ───────────────────────── Ganchos de tela ─────────────────────────

/** true quando a tela é larga (computador). */
export function useDesktop() {
  const consulta = '(min-width: 900px)'
  const [desk, setDesk] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const f = () => setDesk(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  return desk
}

/**
 * Busca dados ao abrir a tela. `carregar` devolve um objeto com várias buscas
 * da camada de dados: { atividades: listarAtividades(), ... }.
 * Devolve { d, erro, carregando, recarregar }.
 */
export function useCarregar(carregar, deps = []) {
  const [estado, setEstado] = useState({ d: null, erro: null, carregando: true })
  const [versao, setVersao] = useState(0)
  useEffect(() => {
    let vivo = true
    setEstado((s) => ({ ...s, carregando: true }))
    const pedidos = carregar()
    const chaves = Object.keys(pedidos)
    Promise.all(chaves.map((k) => pedidos[k])).then((respostas) => {
      if (!vivo) return
      const erro = respostas.find((r) => r.erro)?.erro || null
      const d = Object.fromEntries(chaves.map((k, i) => [k, respostas[i].data]))
      setEstado({ d: erro ? null : d, erro, carregando: false })
    })
    return () => { vivo = false }
  }, [versao, ...deps])
  const recarregar = useCallback(() => setVersao((v) => v + 1), [])
  return { ...estado, recarregar }
}
