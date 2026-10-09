// O único ponto que decide se o app lê dados de exemplo ou o Supabase.
// Na etapa do banco, vira false — e nenhuma tela precisa mudar.
export const USAR_MOCK = true

// No modo demonstração "hoje" fica fixo, para os dados de exemplo fazerem sentido.
// Com o banco ligado, hoje é a data do computador.
export const DATA_FIXA_DEMO = USAR_MOCK ? '2026-10-09' : null
