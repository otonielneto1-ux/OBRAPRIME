// Estado global pequeno: quem está logado, as obras que a pessoa vê e a obra atual.
// Trocar de obra remonta a tela inteira (key no App), para nada da obra anterior sobrar.

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import * as dados from './dados.js'

const Ctx = createContext(null)

const chaveObra = (userId) => `obraprime:obra:${userId}`

function lerObraGuardada(userId) {
  try { return localStorage.getItem(chaveObra(userId)) } catch (_e) { return null }
}
function guardarObra(userId, obraId) {
  try { localStorage.setItem(chaveObra(userId), obraId) } catch (_e) { /* navegador sem armazenamento: só não lembra */ }
}

export function AppProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [obras, setObras] = useState([])
  const [obraId, setObraId] = useState(null)
  const [carregandoObras, setCarregandoObras] = useState(false)

  const carregarObras = useCallback(async (u, preferida) => {
    setCarregandoObras(true)
    const { data, erro } = await dados.listarObras()
    setCarregandoObras(false)
    if (erro) { setObras([]); return }
    setObras(data)
    const guardada = preferida || lerObraGuardada(u.id)
    const escolhida = data.find((o) => o.id === guardada) || data[0] || null
    dados.definirObraAtual(escolhida?.id || null)
    setObraId(escolhida?.id || null)
  }, [])

  useEffect(() => {
    if (!usuario) { setObras([]); setObraId(null); dados.definirObraAtual(null); return }
    carregarObras(usuario)
  }, [usuario])

  const trocarObra = useCallback((id) => {
    dados.definirObraAtual(id)
    setObraId(id)
    if (usuario) guardarObra(usuario.id, id)
  }, [usuario])

  const sair = useCallback(async () => {
    await dados.sair()
    setUsuario(null)
  }, [])

  const recarregarObras = useCallback(() => (usuario ? carregarObras(usuario, obraId) : null), [usuario, obraId, carregarObras])

  const atualizarUsuario = useCallback((u) => setUsuario(u ? { ...u } : null), [])

  const valor = {
    usuario,
    entrou: atualizarUsuario,
    sair,
    obras,
    obra: obras.find((o) => o.id === obraId) || null,
    obraId,
    trocarObra,
    recarregarObras,
    carregandoObras,
  }
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}

export function useApp() {
  return useContext(Ctx)
}
