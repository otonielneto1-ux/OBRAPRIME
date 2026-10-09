// Meu perfil: nome, email, perfil, obras e sair.

import { useState } from 'react'
import * as dados from '../lib/dados.js'
import { useApp } from '../lib/AppContext.jsx'
import { pode } from '../lib/perfis.js'
import { Card, Campo, Icon, useToast } from '../components/index.jsx'

export default function Perfil() {
  const { usuario, entrou, obras, sair } = useApp()
  const toast = useToast()
  const [nome, setNome] = useState(usuario.nome)
  const [erro, setErro] = useState(null)
  async function salvar() {
    const { data, erro: falha } = await dados.atualizarMeuNome(nome)
    if (falha) return setErro(falha)
    setErro(null)
    entrou(data)
    toast('Nome atualizado')
  }
  return (
    <div className="wrap stack" style={{ maxWidth: 640 }}>
      <Card titulo="Meu perfil">
        <div className="form" style={{ padding: 14 }}>
          <Campo rotulo="Nome" id="p-nome" erro={erro}><input id="p-nome" className="ipt" value={nome} onChange={(e) => setNome(e.target.value)} /></Campo>
          <Campo rotulo="Email" id="p-email"><input id="p-email" className="ipt" value={usuario.email} readOnly /></Campo>
          <Campo rotulo="Perfil" id="p-perfil"><input id="p-perfil" className="ipt" value={usuario.role} readOnly /></Campo>
          <Campo rotulo="Obras" id="p-obras">
            <div className="aviso-info">{pode(usuario, 'verTodasObras') ? 'Todas as obras.' : obras.map((o) => o.nome).join(' · ') || 'Nenhuma obra vinculada.'}</div>
          </Campo>
          <button type="button" className="btn btn-primary" onClick={salvar} disabled={nome.trim() === usuario.nome}>Salvar nome</button>
        </div>
      </Card>
      <button type="button" className="btn btn-ghost-bad" onClick={sair}><Icon nome="sair" /> Sair</button>
    </div>
  )
}
