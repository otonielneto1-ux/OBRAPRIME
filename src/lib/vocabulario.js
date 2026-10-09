// Listas fechadas do app. Cada uma é IDÊNTICA ao CHECK do banco (PRD-BACKEND.md).
// Se um texto mudar aqui, muda na migration no mesmo lote — senão o salvamento
// falha em silêncio.

export const PERFIS = ['Gerente', 'Coordenador', 'Engenheiro', 'Mestre', 'Cliente']
export const PERFIL_PENDENTE = 'Pendente'

export const TIPOS_OBRA = ['Loteamento', 'Stand de vendas', 'Outro']
export const STATUS_OBRA = ['Em andamento', 'Paralisada', 'Concluída']

export const TIPOS_RESTRICAO = [
  'Projeto', 'Material', 'Mão de obra', 'Equipamento', 'Terceirizado/contrato',
  'Licença/liberação', 'Clima', 'Financeiro', 'Outro',
]
export const STATUS_RESTRICAO = ['Aberta', 'Removida']

export const SITUACOES_TAREFA = ['Planejada', 'Feito', 'Não feito']
export const MOTIVOS_NAO_FEITO = [
  'Restrição não removida', 'Mão de obra', 'Material', 'Clima', 'Projeto', 'Outro',
]

export const TIPOS_EFETIVO = ['MO direta', 'MO indireta', 'Terceirizado']
export const TIPOS_FUNCAO = ['MO direta', 'MO indireta']

// Situação de uma atividade do cronograma (calculada, não vai para o banco).
export const SITUACOES_ATIVIDADE = ['Concluída', 'Atrasada', 'No prazo', 'Não iniciada', 'Removida']
