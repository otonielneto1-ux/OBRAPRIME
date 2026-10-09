// Quem pode o quê. É a matriz de permissões do PLANO-DO-PROJETO.md em código.
// A tela pergunta aqui; não decide sozinha. No banco, a mesma regra vira RLS.

const G = 'Gerente'
const C = 'Coordenador'
const E = 'Engenheiro'
const M = 'Mestre'
const CL = 'Cliente'

const MATRIZ = {
  verTodasObras: [G, C],
  verObras: [G, C, E],
  editarObra: [G],
  importarCronograma: [G, C, E],
  acertarAvanco: [G, C, E],
  verVisaoGeral: [G, C],
  verCronograma: [G, C, E],
  lancarAvanco: [G, C, E, M],
  verPlanejamento: [G, C, E, M],
  editarRestricao: [G, C, E],
  planejarSemana: [G, C, E],
  marcarTarefa: [G, C, E, M],
  verEfetivo: [G, C, E, M],
  lancarEfetivo: [G, C, E, M],
  editarEfetivoAnterior: [G],
  editarFuncoes: [G],
  verAvisos: [G, C, E, M],
  criarAviso: [G, C, E],
  fixarAviso: [G],
  apagar: [G],
  gerenciarUsuarios: [G],
  verPainelEquipe: [G, C, E, M],
  verPainelCliente: [CL],
}

/** O perfil pode fazer a ação? Pendente e bloqueado não podem nada. */
export function pode(perfil, acao) {
  if (!perfil || !perfil.ativo) return false
  return (MATRIZ[acao] || []).includes(perfil.role)
}

export function liberado(perfil) {
  return !!perfil && perfil.ativo && perfil.role !== 'Pendente'
}

/** A tela em que cada perfil entra. */
export function shellDoPerfil(perfil) {
  if (!liberado(perfil)) return 'aguardando'
  if (perfil.role === 'Cliente') return 'cliente'
  if (perfil.role === 'Mestre') return 'mestre'
  return 'equipe'
}

/** Obras que a pessoa enxerga: Gerente e Coordenador todas; os outros só as vinculadas. */
export function obrasVisiveis(perfil, obras, membros) {
  if (!liberado(perfil)) return []
  if (pode(perfil, 'verTodasObras')) return obras
  const minhas = new Set(membros.filter((m) => m.profile_id === perfil.id).map((m) => m.obra_id))
  return obras.filter((o) => minhas.has(o.id))
}

/** Ordem do seletor de obra: em andamento primeiro, depois paralisadas, depois concluídas. */
export function ordenarObras(obras) {
  const ordem = { 'Em andamento': 0, Paralisada: 1, 'Concluída': 2 }
  return [...obras].sort((a, b) => (ordem[a.status] ?? 9) - (ordem[b.status] ?? 9) || a.nome.localeCompare(b.nome))
}
