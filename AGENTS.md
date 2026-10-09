# ObraPrime

Acompanhamento de cronograma e planejamento de obra: importa o XML do MS Project e
mostra avanço, curva S, linha de balanço, planejamento de 3 meses com restrições,
semana e dia, e efetivo diário. Várias obras, dados separados por obra.
React + Vite + Supabase + Vercel; única biblioteca do app: `@supabase/supabase-js`.
Perfis e shells: Gerente/Coordenador/Engenheiro → `src/pages/AppEquipe.jsx`;
Mestre → `AppMestre.jsx`; Cliente → `AppCliente.jsx`; Pendente/bloqueado → `Aguardando.jsx`.
Decisões de produto: `PLANO-DO-PROJETO.md`, `PRD-FRONTEND.md`, `PRD-BACKEND.md` (mudou de ideia, muda lá primeiro).

## Onde o código novo vai

Uma pergunta decide: **"isto continuaria verdade se a tela fosse outra?"**

- **Sim → `src/lib/*.js`.** Regra pura: cálculo, recorte, decisão, formatação.
  Sem React, sem banco, sem `window`. Roda no Node sem bundler (import com
  `.js` explícito). É a única camada com teste.
- **Não → `src/screens/*.jsx`.** Estado de interface, layout, o que se toca.
  A tela **pede a decisão à lib**; não decide.
- `src/lib/dados.js` — **única porta dos dados.** Nenhuma tela chama o Supabase direto.
- `src/lib/supabase.js` — a conexão.

Três consequências práticas:

1. **`if` de negócio dentro de tela vai para `lib`**, mesmo com três linhas —
   se a linha decide *o que é verdade*, e não *o que aparece*.
2. **Constante compartilhada tem um dono só.** Listas fechadas (status, tipos,
   motivos, perfis) moram em `src/lib/vocabulario.js` e são idênticas ao CHECK
   do banco. Quem pode o quê mora em `src/lib/perfis.js`.
3. **Arquivo grande não é problema; arquivo confuso é.** Quebre quando o arquivo
   passar a ter *dois motivos para mudar*.

**Várias obras:** toda tabela de dado tem `obra_id`. A camada de dados injeta
(`definirObraAtual`); as telas não passam. Trocar de obra remonta a tela inteira
(`key` em `App.jsx`) — nada da obra anterior fica na tela nem é salvo nela.
Cache ou `localStorage` com dado de obra leva o `obra_id` na chave.

**Modo demonstração:** `USAR_MOCK` em `src/lib/config.js`. Com ele ligado, `dados.js`
trabalha numa cópia em memória de `src/lib/mockData.js`, com as mesmas regras de
acesso do banco, e "hoje" fica fixo em `DATA_FIXA_DEMO`. Na etapa do banco, troca-se
o miolo das funções de `dados.js`; as telas não mudam.

## Régua de verificação

```bash
npm run check
```

Build + lint + testes. **Fecha em zero** — não há linha de base herdada aqui.
Aviso novo é seu e é de agora; conserte no mesmo lote.
(No Windows, se o `npm` reclamar de "execução de scripts", use `npm.cmd`.)

Nada disso prova que a tela funciona. Verde com a tela em branco é rotina.

**Todo bug corrigido em `src/lib/` nasce com teste junto** (`tests/*.mjs`), no mesmo lote.
Build e lint não pegam regra errada.

## Antes de subir pro GitHub

Diff que toca em `src/lib/supabase.js`, `src/lib/dados.js`, `src/lib/perfis.js`,
políticas RLS ou migrations → rodar a revisão de código (`/code-review` no Claude
Code, `/review` no Codex) antes de subir. É por caminho, não por julgamento: nesses
arquivos o erro não aparece na tela. RLS frouxa vaza dado de uma obra para outra
sem nenhum sintoma.

## Deploy

A pessoa diz "sobe pro GitHub"; o agente roda `git add`, `git commit`, `git push`
na pasta dela, e a Vercel publica sozinha (a ligar na etapa da Vercel). A pessoa não
digita comando.

## Armadilhas desta base

- **Tabela nova nasce fechada para o app.** Toda tabela precisa de `grant` escrito
  na migration, só para `authenticated`. Erro "permission denied for table (42501)"
  é GRANT faltando, não RLS. Nunca `grant all`, nunca `to anon`.
- **Cronograma real de cliente não vai para o Git.** Os `.xml`/`.mpp` da raiz estão
  no `.gitignore`. Não crie teste que dependa deles; teste com recorte fictício.
- **XML do MS Project:** usar a linha de base **0** (o arquivo traz várias).
  `<Start>`/`<Finish>` também aparecem dentro de `<TimephasedData>` e `<Baseline>` —
  por isso `importarProject.js` remove esses blocos antes de ler a tarefa.
- **Local e serviço da linha de balanço:** o cronograma real é "serviço primeiro"
  (`SUBLEITO > Execução de Subleito - Rua 03, 04 e 06`: local = texto depois do
  último " - "); o "local primeiro" (`Quadra A > Drenagem`) também é aceito.
  Trechos escritos de jeitos diferentes se juntam por `chaveLocal` (tira acento,
  caixa e a palavra "rua").
- **Reimportação casa pelo UID do Project**, nunca pelo nome. A linha de base
  original (`*_base_original`) nunca é atualizada — é ela que responde "qual
  atividade mais atrasou".
- **Datas são texto `AAAA-MM-DD`.** Use `src/lib/datas.js`; nunca
  `toISOString().split('T')[0]` (pula um dia no fuso do Brasil).

## Higiene de código (vale para toda mudança)

Cada função morta é uma mentira que o próximo leitor precisa desmascarar.

- **Ao remover um recurso, cace a cadeia inteira no mesmo lote:** a função em
  `lib/dados.js` → a exposição no contexto → os chamadores nas telas → a query.
  Função exposta que nenhuma tela chama é lixo.
- **Zero avisos novos de lint.** Aviso antigo que você encontrar, limpe se já
  estiver tocando no arquivo.
- **Código comentado não é backup, o git é.** Comentário explica *por quê*.
  Bloco comentado sem explicação, apague.
- **Antes de apagar, prove que está morto:** grep pelo símbolo no projeto
  inteiro, e verifique quem chama o *wrapper*, não só a função. Depois confira
  órfãos: quem só era chamado pelo que você removeu morre no mesmo commit.
- **Estado que nunca muda ou nunca é lido é lixo** — `useState` sem setter,
  prop que ninguém consome, flag que ninguém liga.
- **Limpeza NUNCA toca no banco nem em arquivo de dado.** Tabela ou coluna
  órfã continua existindo até decisão de quem é dono. Na dúvida, pergunte.
