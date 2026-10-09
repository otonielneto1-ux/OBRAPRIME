# Plano do Projeto — ObraPrime

> Fonte da verdade deste projeto. Quando mudar de ideia, mude aqui primeiro.
> Última atualização: 09/10/2026 — plano fechado (Etapas 1, 2 e 3).

## Em uma frase

Um sistema de **gestão de cronograma e planejamento de obra** que resolve **a análise diária do cronograma feita na mão** para **o gerente de obras e sua equipe**, fazendo **a importação do cronograma do MS Project e o acompanhamento do avanço, das restrições e do planejamento semanal e diário em um só lugar, separado por obra**.

---

# 1. Visão Estratégica

## Os problemas

### Problema 1 — Análise do cronograma feita na mão
- **Como acontece hoje:** o cronograma de cada obra mora no MS Project. Todo dia o gerente analisa o andamento à mão (detalhe do passo a passo proposto pela IA, ver módulo Avanço).
- **Frequência:** todo dia, em 2 obras ao mesmo tempo.
- **Custo:** `[PENDENTE: horas por dia gastas na análise]`
- **Último caso:** `[PENDENTE]`

### Problema 2 — Planejamento de médio e curto prazo sem ferramenta
- **Como acontece hoje:** `[PENDENTE: como o médio e o curto prazo são feitos hoje]`
- **Frequência:** semanal (médio prazo: 3 meses divididos por semana, com restrições; curto prazo: semana e dia).
- **Custo:** `[PENDENTE]`

### Problema 3 — Medição feita na mão (FORA DA V1)
- **Como acontece hoje:** medição com cliente e com terceirizados feita no Excel e depois lançada no Sienge.
- **Frequência:** 2 vezes por mês.
- **Decisão:** fica para a v2. A v1 é só cronograma e planejamento.

## A solução

O gerente exporta o cronograma do MS Project (formato XML) e importa no sistema, uma vez por obra e de novo quando o cronograma for revisado. O MS Project continua sendo onde o cronograma é **montado**; o sistema é onde ele é **acompanhado**. A partir das atividades importadas, a equipe lança o avanço (%) de cada atividade, o sistema calcula a curva S (previsto x realizado), monta a janela de 3 meses por semana com as restrições destacadas, e desce para o plano da semana e do dia. Tudo separado por obra.

**O que ele NÃO faz (v1):**
- Medição com cliente e com terceirizados, e qualquer ligação com o Sienge
- Orçamento, análise de custo e eficiência financeira (v2)
- Diário de obra e ocorrências (o efetivo entra, mas só a contagem diária)
- Editar a estrutura do cronograma dentro do app (criar/apagar atividade, mudar dependência): isso continua no MS Project e entra por reimportação
- Devolver o avanço para dentro do arquivo do MS Project
- App nativo de celular (o sistema abre no navegador do celular)

## Funcionalidades

### Painel da obra (a tela do dia a dia)
- **Decisão do gerente (09/10/2026, revisando o preview):** no celular, **% de avanço e planejamento da semana** ficam no topo, antes de rolar a tela. A ordem detalhada está no `PRD-FRONTEND.md`.
- **Abre em:** painel, de uma obra por vez (seletor de obra no topo)
- **Mostra:**
  - Avanço físico: % previsto x % realizado até hoje, e a diferença em pontos
  - Curva S: linha prevista (linha de base) x linha realizada, semana a semana
  - Efetivo de hoje: total de pessoas na obra, dividido em MO direta, MO indireta e terceirizados, e as funções com mais gente (se ainda não foi lançado: "Efetivo de hoje não lançado")
  - Atividades atrasadas: as que deviam ter começado/terminado e não começaram/terminaram
  - Restrições vencendo: restrições abertas com data limite nos próximos 7 dias
  - Planejamento do dia: as tarefas de hoje, com responsável e se já foram feitas
  - Quadro de avisos: os 5 avisos mais recentes da obra
- **Ordem e filtro:** fixo nessa ordem; filtro só de obra
- **Ações:** nenhuma direto no painel; cada bloco leva para o seu módulo
- **Ao clicar num item:** abre o módulo correspondente já filtrado
- **Vazio:** "Esta obra ainda não tem cronograma. Importe o arquivo do MS Project para começar."
- **Nasce e morre:** nasce quando a obra é criada; não se apaga

### Obras
- **Abre em:** lista de cartões
- **Mostra:** nome, cliente, tipo (loteamento / stand de vendas / outro), cidade, data de início, data de término prevista, % realizado, status
- **Ordem e filtro:** em andamento primeiro, depois por data de término; filtro por status (Em andamento, Paralisada, Concluída)
- **Ações:** criar, editar, mudar status, vincular pessoas à obra
- **Ao clicar num item:** abre o painel daquela obra
- **Vazio:** "Nenhuma obra cadastrada. Crie a primeira obra."
- **Nasce e morre:** o gerente cria; quando termina, vira "Concluída" e sai da lista padrão (não é apagada)

### Cronograma
- **Abre em:** lista em árvore (EAP do MS Project), com barra de Gantt simples ao lado no computador
- **Mostra:** código EAP, nome da atividade, início e término previstos (linha de base), início e término reais, duração, % previsto hoje, % realizado, peso, situação (No prazo / Atrasada / Concluída / Não iniciada)
- **Ordem e filtro:** ordem da EAP; filtros: atrasadas, desta semana, do mês, por pacote/etapa
- **Ações:** importar XML do MS Project, reimportar (nova revisão), lançar avanço
- **Ao clicar num item:** abre gaveta com o histórico de avanço e fotos da atividade
- **Vazio:** "Nenhum cronograma importado. Exporte do MS Project em XML (Arquivo > Salvar como > XML) e importe aqui."
- **Nasce e morre:** nasce na importação; na reimportação o sistema casa as atividades pelo ID do MS Project e mantém o avanço já lançado; atividade que sumiu do arquivo fica marcada "Removida na revisão X", não é apagada

### Avanço (lançar o % realizado)
- **Abre em:** lista das atividades em andamento ou previstas para a semana
- **Mostra:** atividade, % realizado anterior, campo do novo %, data, observação, foto (opcional)
- **Ordem e filtro:** previstas para hoje primeiro; filtro por pacote/etapa
- **Ações:** lançar avanço (cada lançamento fica guardado com data e quem lançou; não sobrescreve)
- **Ao clicar num item:** abre o histórico de avanço daquela atividade
- **Vazio:** "Nenhuma atividade em andamento esta semana."
- **Nasce e morre:** cada lançamento é um registro; não se apaga, corrige-se com novo lançamento

### Linha de balanço (pedida pelo gerente depois do benchmark)
- **Abre em:** gráfico, de uma obra por vez
- **Mostra:** eixo vertical = locais (Quadra A, Quadra B…); eixo horizontal = semanas; cada serviço (Drenagem, Pavimentação…) é uma linha colorida atravessando os locais. Previsto = linha tracejada (datas da linha de base); realizado = linha cheia (datas reais de início e fim, tiradas do avanço lançado). Legenda com a cor de cada serviço
- **Como o sistema descobre local e serviço:** na conversa o gerente disse "local primeiro" (`Quadra A > Drenagem`), mas o XML real do Conviver Costamare (09/10/2026) é **serviço primeiro**: `SUBLEITO > Execução de Subleito - Rua 03, Rua 04 e Rua 06`. O sistema aceita os dois jeitos: se o nome da folha tem " - ", o **serviço** é a mãe e o **local** é o texto depois do último " - "; se não tem, o **local** é a mãe e o **serviço** é a folha. Locais escritos de jeitos diferentes ("Rua 03, Rua 04 e Rua 06" e "Rua 03, 04 e 06") viram o mesmo trecho. Na importação, o sistema mostra os serviços repetidos e quantos locais cada um tem, para o gerente conferir antes de gravar. `[PENDENTE: gerente confirmar que essa leitura do XML real está certa]`
- **Alertas:** linha cheia à direita da tracejada = serviço atrasado naquele local (trecho em vermelho); duas linhas de serviço se cruzando no previsto = alerta de colisão de equipes
- **Ordem e filtro:** locais na ordem da EAP; filtro para mostrar/esconder serviços
- **Ações:** nenhuma (só leitura); clicar num ponto abre a atividade daquele serviço naquele local
- **Vazio:** "Esta obra não tem serviços repetidos por local. A linha de balanço serve para obras como loteamento."
- **O que ele NÃO faz:** não monta o planejamento em linha de balanço (o planejamento continua sendo montado no MS Project)
- **Observação:** a apresentação segue o padrão do método linha de balanço; a tela da Prevision não foi vista, então não é cópia dela

### Planejamento de médio prazo (3 meses por semana)
- **Abre em:** quadro com 12 colunas (semanas) e as atividades previstas para cada semana
- **Mostra:** atividade, semana prevista, quantidade de restrições abertas; atividade com restrição aberta fica **destacada em vermelho**; sem restrição, verde
- **Ordem e filtro:** por semana, depois por EAP; filtro "só com restrição"
- **Ações:** adicionar restrição numa atividade, marcar restrição como removida
- **Ao clicar num item:** gaveta da atividade com a lista de restrições
- **Vazio:** "Nenhuma atividade prevista para os próximos 3 meses."
- **Nasce e morre:** as atividades vêm do cronograma; a janela anda sozinha toda semana

### Restrições
- **Abre em:** lista
- **Mostra:** atividade, tipo (Projeto, Material, Mão de obra, Equipamento, Terceirizado/contrato, Licença/liberação, Clima, Financeiro, Outro), descrição, responsável, data limite, status (Aberta / Removida)
- **Ordem e filtro:** abertas primeiro, por data limite; filtro por tipo, responsável, status
- **Ações:** criar, editar, marcar como removida
- **Ao clicar num item:** abre o detalhe
- **Vazio:** "Nenhuma restrição aberta. Bom sinal."
- **Nasce e morre:** quem cria é gerente/coordenador/engenheiro; vira "Removida" com data, não se apaga

### Planejamento de curto prazo (semana) e do dia
- **Abre em:** a semana atual, dividida por dia
- **Mostra:** tarefa (ligada a uma atividade do cronograma), dia, responsável (equipe/terceirizado), meta (ex.: "concretar bloco B"), feito / não feito, motivo de não ter feito
- **Ordem e filtro:** por dia; filtro por responsável
- **Ações:** criar tarefa na semana, marcar feito/não feito, informar motivo (Restrição não removida, Mão de obra, Material, Clima, Projeto, Outro)
- **Ao clicar num item:** abre o detalhe da tarefa
- **Vazio:** "Nenhuma tarefa planejada para esta semana."
- **Nasce e morre:** criada pelo engenheiro na programação semanal; no fim da semana o sistema calcula o % de tarefas cumpridas (PPC)

### Efetivo (contagem diária)
- **Abre em:** o dia de hoje da obra, com o formulário de lançamento
- **Mostra:** uma linha por grupo: tipo (MO direta / MO indireta / Terceirizado), empresa (só quando terceirizado), função, **atividade em que trabalharam** (obrigatória para MO direta e terceirizado; a lista mostra primeiro as atividades em andamento), quantidade de pessoas. Embaixo, o total do dia e o total por tipo
- **Funções padrão:** MO direta: Pedreiro, Servente, Carpinteiro, Armador, Eletricista, Encanador, Pintor, Operador de máquina, Motorista. MO indireta: Engenheiro, Mestre, Encarregado, Técnico de segurança, Almoxarife, Apontador, Vigia. Lista editável pelo gerente
- **Ordem e filtro:** por tipo, depois por função; filtro por data (navegar dia a dia) e por empresa
- **Ações:** lançar o efetivo do dia, copiar o efetivo de ontem e ajustar, editar o lançamento do próprio dia
- **Ao clicar num item:** nada (edita na própria linha)
- **Vazio:** "Efetivo de hoje ainda não lançado. Copiar de ontem?"
- **Nasce e morre:** um lançamento por obra por dia, feito pelo mestre ou engenheiro; dias anteriores só o gerente edita
- **Histórico:** tabela com o total por dia nos últimos 30 dias, separado por tipo (tabela, não gráfico: a v1 tem só 2 gráficos, curva S e linha de balanço)
- **Funções:** botão "Funções" (só gerente) abre a lista de funções para criar, renomear ou desativar

### Quadro de avisos
- **Abre em:** lista
- **Mostra:** título, texto, autor, data, fixado sim/não
- **Ordem e filtro:** fixados primeiro, depois mais recentes
- **Ações:** criar, editar o próprio, fixar, apagar (só gerente)
- **Vazio:** "Nenhum aviso nesta obra."

### Usuários
- **Abre em:** lista
- **Mostra:** nome, email, perfil, obras vinculadas, situação (Aguardando = perfil 'Pendente'; Ativo; Bloqueado = `ativo` falso)
- **Ações:** liberar, escolher perfil, vincular obras, bloquear
- **Vazio:** "Ninguém aguardando liberação."

## Unidade principal

**Obra** — vai existir mais de uma? **sim** (hoje 2: loteamento e stand de vendas). Alguém trabalha em mais de uma ao mesmo tempo? **sim** (o gerente toca as 2).
Cada registro pertence a uma obra; cada pessoa só enxerga as obras em que está vinculada (exceto Gerente e Coordenador, que veem todas).

## Perfis de usuário

- **Gerente (admin):** toca as obras e manda no sistema · primeira tela: Painel da obra
- **Coordenador:** acompanha todas as obras · primeira tela: Painel da obra
- **Engenheiro:** toca a obra no dia a dia, importa cronograma, faz planejamento · primeira tela: Painel da obra
- **Mestre:** está no canteiro, lança avanço e marca as tarefas do dia · primeira tela: Planejamento do dia
- **Cliente:** acompanha a obra dele · primeira tela: Painel do cliente (avanço, curva S e fotos)

### Matriz de permissões

Confirmado pelo gerente em 09/10/2026: engenheiro só nas obras vinculadas; mestre lança avanço, efetivo e marca o dia, mas não cria restrição nem planeja a semana.

| Ação | Gerente | Coordenador | Engenheiro | Mestre | Cliente |
|---|---|---|---|---|---|
| Quais obras enxerga | todas | todas | só as vinculadas | só as vinculadas | só a dele |
| Criar/editar obra | sim | não | não | não | não |
| Importar/reimportar cronograma | sim | sim | sim | não | não |
| Lançar avanço | sim | sim | sim | sim | não |
| Criar/remover restrição | sim | sim | sim | não | não |
| Planejamento semanal (criar tarefas) | sim | sim | sim | não | não |
| Marcar tarefa do dia feita/não feita | sim | sim | sim | sim | não |
| Lançar efetivo do dia | sim | sim | sim | sim | não |
| Ver efetivo | sim | sim | sim | sim | não |
| Ver avanço, curva S e fotos | sim | sim | sim | sim | sim |
| Ver restrições e planejamento | sim | sim | sim | sim | não |
| Ver valores (R$) — a v1 não tem valores; regra já fixada para a v2 | sim | sim | sim | **não** | **não** |
| Avisos: criar | sim | sim | sim | não | não |
| Apagar qualquer registro | sim | não | não | não | não |
| Gerenciar usuários | sim | não | não | não | não |
| **Quem não fez login** | não vê nada | | | | |

## Fluxo de cadastro

1. A pessoa se cadastra sozinha com email e senha
2. Entra sem perfil e não vê dado nenhum
3. Vê o aviso "Conta aguardando liberação do administrador"
4. O gerente libera, escolhe o perfil e vincula as obras

## Ferramentas e custo

| Peça | Para que serve | Custo |
|---|---|---|
| Claude | construir o sistema | a assinatura que já existe |
| React + Vite | a interface | grátis |
| Supabase | banco, login e fotos | grátis até crescer |
| Vercel | colocar no ar | grátis |
| GitHub | guardar o código | grátis |

**Total por mês:** R$ 0 no começo
**O que custaria a alternativa pronta:** o gerente pagaria até R$ 200 por mês (R$ 2.400 por ano). Essa é a régua do retorno.

## Prazo

- **Quer usar de verdade em:** 7 dias (até 16/10/2026), nas duas obras
- **Horas por semana disponíveis:** 5 horas por dia (cerca de 35 horas na semana)
- **Decisão sobre o escopo:** a IA sugeriu dividir em duas ondas (onda 1 em 7 dias: obras, usuários, importação do cronograma, avanço, curva S, efetivo, painel; onda 2 uma semana depois: médio prazo com restrições, curto prazo, avisos, acesso do cliente). O gerente escolheu **arriscar tudo nos 7 dias**.
- **Risco registrado:** a importação do XML do MS Project é a peça mais incerta. A linha de balanço entrou depois, a pedido do gerente, e aumenta esse risco. No fechamento da Etapa 3 (10 telas, 10 tabelas, 2 processos, acima do teto de 6/7/2), a IA ofereceu cortar acesso do cliente e quadro de avisos para a v2; o gerente decidiu **manter tudo**. Se o prazo apertar, a ordem de corte é: acesso do cliente, depois quadro de avisos, depois linha de balanço, depois curto prazo. Nunca cortar a importação, o avanço ou o painel.

---

# 2. Insights do Mercado

## Benchmark

Pesquisado na web em 09/10/2026. Só está escrito aqui o que apareceu na busca.

### Prevision (ecossistema Sienge)
- Site: https://sienge.com.br/prevision-obras/ · Preço: não divulgado no site (tem teste grátis de 15 dias)
- Faz bem: planejamento lean feito para a construção brasileira: linha de balanço gerada automaticamente, Last Planner, planejamento em takt e avanço físico lançado pelo app
- Falta: preço sob consulta; não verificado se importa cronograma do MS Project
- Vale copiar: avanço físico lançado pelo celular no canteiro; a lógica do Last Planner (médio prazo com restrições, semana com % cumprido)

### Meu Construtor
- Site: https://meuconstrutor.ia.br/ · Preço: a partir de R$ 149,90/mês
- Faz bem: gestão de obras com app e versão web
- Falta: não verificado se faz cronograma, curva S ou restrições

### LookAheadWall
- Site: https://alternativeto.net/software/lookaheadwall/about · Preço: US$ 39 a 49/mês
- Faz bem: quadro visual de 8 semanas à frente, ligando o planejamento do escritório à execução no canteiro
- Falta: em inglês; janela de 8 semanas, não 12
- Vale copiar: o quadro visual por semana

## Por que ainda vale construir o meu

Decisão do gerente (09/10/2026): **construir o próprio, sem a Prevision.** O motivo não foi detalhado por ele. Motivo provável, escrito pela IA: o sistema próprio junta num lugar só o cronograma que já vive no MS Project, o planejamento de médio e curto prazo com restrições e o efetivo diário dividido por MO direta, indireta e terceirizados, do jeito que o gerente trabalha, dentro da régua de até R$ 200/mês (o preço da Prevision não é público).
`[APROVADO SEM REVISÃO: motivo para construir — risco: escrito pela IA, não pelo gerente]`

**Régua:** a alternativa paga que o gerente aceitaria custa até R$ 2.400 por ano.

## Referências de interface

- **Gosta de:** a identidade da marca ObraPrime (logo enviado pelo gerente)
- **Odeia:** não informado
- **Usa mais em:**
  - Mestre: **celular no canteiro** (efetivo, avanço, tarefas do dia). Botões grandes, pouca digitação, "copiar o de ontem".
  - Gerente, coordenador e engenheiro: **computador no escritório** para importar cronograma e montar o médio prazo e a semana; celular para consultar o painel.
  - Cliente: celular, só leitura.
- **Cores (tiradas do logo):**
  - Azul-marinho `#01152E`: menu lateral, cabeçalho, barra inferior do celular, textos de título
  - Dourado `#F5B03B` (variações `#F6C542` claro e `#E49B2C` escuro): destaques, botão principal, linha "realizado" da curva S, item ativo do menu
  - Branco `#FFFFFF`: fundo das telas
  - Atenção: texto dourado sobre fundo branco fica ilegível. Dourado só como fundo de botão (com texto marinho) ou sobre o marinho.
  - Cores de situação (padrão, não vêm do logo): verde `#1D8A5B` no prazo / sem restrição; vermelho `#C62828` atrasada / com restrição; cinza `#6B7280` não iniciada
- **Tema:** claro (conteúdo em fundo branco, melhor no sol do canteiro), com menu e cabeçalho em azul-marinho, como o logo
- **Logo:** `identidade/logo-obraprime.jpg` (1600x800, fundo marinho). Usar no menu lateral e na tela de login. Slogan: "Gestão inteligente de obras"
- `[DESCOBRIR NO USO: se o médio prazo também precisa ser montado pelo celular]` — por enquanto ficou: montado no computador, consultado no celular

---

# 3. Arquitetura

## Mapa de telas

```
Login  (logo ObraPrime, email e senha, "Criar conta")
├── Aguardando liberação  (quem se cadastrou e ainda não foi liberado)
│
├── Gerente / Coordenador / Engenheiro  (computador: menu lateral; celular: barra inferior)
│   ├── 1. Painel ................ abre aqui todo dia (seletor de obra no topo)
│   │   └── Avisos (bloco no painel + "ver todos")
│   ├── 2. Cronograma
│   │   ├── aba Lista/Gantt  →  gaveta da atividade (histórico de avanço e fotos)
│   │   ├── aba Linha de balanço
│   │   ├── aba Lançar avanço
│   │   └── Importar / reimportar XML do MS Project (gerente, coordenador, engenheiro)
│   ├── 3. Planejamento
│   │   ├── aba 3 meses (12 semanas, restrição em vermelho)
│   │   ├── aba Restrições
│   │   └── aba Semana e dia (com % de tarefas cumpridas)
│   ├── 4. Efetivo
│   ├── 5. Obras  →  painel da obra
│   └── 6. Usuários (só gerente)
│
├── Mestre  (celular, barra inferior com 4 itens)
│   ├── Hoje ............ abre aqui: tarefas do dia para marcar feito/não feito
│   ├── Efetivo ......... lançar o efetivo do dia ("copiar de ontem")
│   ├── Avanço .......... lançar % e foto das atividades em andamento
│   └── Painel .......... só leitura
│
└── Cliente  (uma tela só)
    └── Painel do cliente: % previsto x realizado, curva S, fotos recentes
```

**Navegação:** computador com menu lateral azul-marinho de 6 itens; celular com barra inferior de até 5 itens (para gerente/coordenador/engenheiro: Painel, Cronograma, Planejamento, Efetivo, Mais).

## Regras de cálculo

- **Peso de cada atividade na curva S:** duração da atividade na linha de base (em dias). O XML não traz custo para o sistema usar. `[DESCOBRIR NO USO: se o peso deveria ser por custo]`
- **% previsto de uma atividade numa data:** cresce em linha reta entre o início e o término da linha de base (0% antes do início, 100% depois do término).
- **% realizado:** o último % lançado no Avanço daquela atividade.
- **Avanço da obra (previsto e realizado):** média dos % das atividades-folha (as que não têm filhas), ponderada pelo peso.
- **Curva S:** os dois números acima calculados no fim de cada semana, do início ao fim da obra. O realizado só vai até hoje.
- **Atividade atrasada:** % realizado menor que o % previsto de hoje, ou término da linha de base já passou e não está em 100%.
- **Início e fim reais** (para a linha de balanço): início real = data do primeiro avanço acima de 0%; fim real = data do avanço que chegou a 100%.
- **% de tarefas cumpridas na semana (PPC):** tarefas marcadas "Feito" ÷ tarefas planejadas para a semana.
- **Linha de base:** usa a linha de base 0 do MS Project. Se o arquivo não tiver linha de base, na primeira importação o início/término previstos viram a linha de base, e o sistema avisa isso na tela.

## Importação do MS Project

- O gerente salva no Project em **XML** (Arquivo > Salvar como > XML). O arquivo `.mpp` não é lido.
- O sistema lê no navegador, de cada tarefa: ID único (UID), nome, número da EAP, nível, se é resumo, início e término, início e término da linha de base, duração.
- Antes de gravar, mostra um resumo: "X atividades, Y locais e Z serviços encontrados, linha de base de dd/mm a dd/mm". O gerente confirma.
- **Reimportação:** casa as atividades pelo UID. Atividade nova entra; atividade que já existia tem nome e datas atualizados e mantém o avanço; atividade que sumiu do arquivo fica "Removida na revisão N" (não some do histórico).
- Cada importação aumenta o número da revisão da obra.
- **Se der errado** (arquivo não é XML do Project, ou não tem tarefas): nada é gravado e aparece "Este arquivo não parece ser um XML do MS Project. No Project: Arquivo > Salvar como > tipo XML."

## Processos automáticos

Os dois são **calculados na hora em que a tela abre**, sem robô agendado rodando no servidor. Isso é mais simples e não tem como "não rodar". Os avisos aparecem só dentro do sistema (sem WhatsApp nem email na v1).

### Alerta de efetivo não lançado
- **Gatilho:** alguém abre o Painel ou a tela Hoje depois das 10h (horário de Brasília) de um dia útil (segunda a sábado), e a obra não tem nenhuma linha em `efetivos` com a data de hoje.
- **Passos:** 1. O sistema confere se existe efetivo lançado hoje para a obra. 2. Se não existir, mostra o alerta.
- **Resultado:** faixa dourada no topo do Painel e da tela Hoje, para mestre e engenheiro da obra (e gerente/coordenador): "Efetivo de hoje ainda não lançado" com o botão "Lançar agora". Some assim que o efetivo é lançado.
- **Se der errado:** se o sistema não conseguir consultar o efetivo, o bloco de efetivo do painel mostra "Não foi possível carregar o efetivo. Tente atualizar a página." e o alerta não aparece. Nada é perdido.

### Fechamento da semana (toda segunda)
- **Gatilho:** a partir de segunda 6h, qualquer abertura do Painel ou do Planejamento já considera a semana anterior fechada.
- **Passos:** 1. Calcula o % de tarefas cumpridas da semana anterior (tarefas 'Feito' ÷ tarefas planejadas). Tarefas que ficaram 'Planejada' contam como não feitas e aparecem com "sem motivo informado". 2. Marca em vermelho as restrições 'Aberta' com data limite já vencida, e em dourado as que vencem nesta semana.
- **Resultado:** o Painel mostra "Semana passada: X% das tarefas cumpridas" e a lista de restrições vencidas e da semana. O Planejamento mostra o histórico do % semana a semana numa tabela (semana, tarefas planejadas, feitas, %).
- **Se der errado:** se a semana não tiver nenhuma tarefa planejada, mostra "Semana passada sem tarefas planejadas" em vez de 0%. Se a consulta falhar, o bloco mostra "Não foi possível calcular a semana passada" e o resto do painel continua funcionando.

## Modelagem de dados

Toda tabela tem `id` (uuid) e `created_at` (timestamptz). Toda tabela que pertence a uma obra tem `obra_id`.

### Tabela `profiles`
Para que serve: a pessoa que faz login e o perfil dela.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | o mesmo código do login |
| nome | text | sim | |
| email | text | sim | |
| role | text | sim | CHECK: 'Pendente', 'Gerente', 'Coordenador', 'Engenheiro', 'Mestre', 'Cliente'. Padrão 'Pendente' (= aguardando liberação) |
| ativo | boolean | sim | padrão true; false = bloqueado |

O **primeiro usuário cadastrado** no sistema vira 'Gerente' automaticamente (senão ninguém conseguiria liberar ninguém). Todos os seguintes entram como 'Pendente'.

### Tabela `obras`
Para que serve: cada obra (a unidade principal).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| nome | text | sim | |
| cliente | text | não | nome do cliente |
| tipo | text | sim | CHECK: 'Loteamento', 'Stand de vendas', 'Outro' |
| cidade | text | não | |
| data_inicio | date | não | vem do cronograma se vazio |
| data_termino_prevista | date | não | vem do cronograma se vazio |
| status | text | sim | CHECK: 'Em andamento', 'Paralisada', 'Concluída'. Padrão 'Em andamento' |
| revisao_atual | integer | sim | padrão 0; sobe a cada importação |
| importado_em | timestamptz | não | data da última importação |

### Tabela `membros`
Para que serve: quem trabalha em qual obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| profile_id | uuid | sim | → profiles |

Único por (obra_id, profile_id). Gerente e Coordenador veem todas as obras sem precisar estar aqui.

### Tabela `atividades`
Para que serve: cada linha do cronograma importado do MS Project.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| uid_project | integer | sim | ID único da tarefa no MS Project; único por obra |
| parent_id | uuid | não | → atividades (a mãe na EAP) |
| eap | text | sim | ex.: '1.2.3' |
| nivel | integer | sim | |
| nome | text | sim | |
| resumo | boolean | sim | true = tem filhas (não recebe avanço) |
| local | text | não | nome da mãe (ex.: 'Quadra A'), usado na linha de balanço |
| servico | text | não | nome da atividade-folha (ex.: 'Drenagem'), usado na linha de balanço |
| inicio_base | date | sim | linha de base atual (muda se o Project for rebaselinado) |
| termino_base | date | sim | linha de base atual |
| inicio_base_original | date | sim | linha de base da primeira importação; **nunca é atualizado** (pergunta de um ano) |
| termino_base_original | date | sim | idem |
| inicio_previsto | date | sim | data atual do Project |
| termino_previsto | date | sim | data atual do Project |
| duracao_dias | numeric(10,2) | sim | usado como peso |
| percentual_realizado | numeric(5,2) | sim | padrão 0; cópia do último avanço |
| inicio_real | date | não | |
| termino_real | date | não | |
| revisao_importada | integer | sim | revisão em que entrou ou foi atualizada |
| removida_na_revisao | integer | não | preenchido se sumiu do arquivo |

### Tabela `avancos`
Para que serve: cada lançamento de % realizado (histórico, nunca sobrescreve).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | sim | → atividades (só atividade-folha) |
| data | date | sim | padrão hoje |
| percentual | numeric(5,2) | sim | 0 a 100 |
| observacao | text | não | |
| foto_url | text | não | foto no Storage |
| lancado_por | uuid | sim | → profiles |

### Tabela `restricoes`
Para que serve: o que impede uma atividade de acontecer na semana prevista.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | sim | → atividades |
| tipo | text | sim | CHECK: 'Projeto', 'Material', 'Mão de obra', 'Equipamento', 'Terceirizado/contrato', 'Licença/liberação', 'Clima', 'Financeiro', 'Outro' |
| descricao | text | sim | |
| responsavel | text | sim | nome de quem vai resolver (pode ser alguém de fora do sistema) |
| data_limite | date | sim | |
| status | text | sim | CHECK: 'Aberta', 'Removida'. Padrão 'Aberta' |
| removida_em | date | não | |
| criado_por | uuid | sim | → profiles |

### Tabela `tarefas`
Para que serve: a programação da semana e do dia (curto prazo).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | não | → atividades |
| data | date | sim | o dia planejado |
| descricao | text | sim | a meta, ex.: 'Concretar bloco B' |
| responsavel | text | sim | equipe ou empresa terceirizada |
| situacao | text | sim | CHECK: 'Planejada', 'Feito', 'Não feito'. Padrão 'Planejada' |
| motivo_nao_feito | text | não | CHECK: 'Restrição não removida', 'Mão de obra', 'Material', 'Clima', 'Projeto', 'Outro' |
| criado_por | uuid | sim | → profiles |

### Tabela `funcoes`
Para que serve: a lista de funções do efetivo, que o gerente edita.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| nome | text | sim | único |
| tipo | text | sim | CHECK: 'MO direta', 'MO indireta' |
| ativo | boolean | sim | padrão true |

Começa preenchida com as funções padrão do módulo Efetivo.

### Tabela `efetivos`
Para que serve: cada linha do efetivo do dia (quantas pessoas de qual função/empresa).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| data | date | sim | |
| tipo | text | sim | CHECK: 'MO direta', 'MO indireta', 'Terceirizado' |
| funcao_id | uuid | sim | → funcoes |
| atividade_id | uuid | não | → atividades (só folha). **Obrigatório** quando tipo = 'MO direta' ou 'Terceirizado'; vazio para 'MO indireta' (pergunta de um ano) |
| empresa | text | não | obrigatório quando tipo = 'Terceirizado' |
| quantidade | integer | sim | maior que 0 |
| lancado_por | uuid | sim | → profiles |

### Tabela `avisos`
Para que serve: o quadro de avisos de cada obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| obra_id | uuid | sim | → obras |
| titulo | text | sim | |
| texto | text | sim | |
| fixado | boolean | sim | padrão false |
| autor_id | uuid | sim | → profiles |

### Permissões por tabela

- **profiles:** cada um vê o próprio; gerente vê e edita todos; coordenador e engenheiro veem nome e perfil das pessoas das suas obras (para mostrar "lançado por"); ninguém se dá perfil sozinho.
- **Cliente e avanços:** o cliente lê os avanços por uma visão que só mostra atividade, data, % e foto (sem observação e sem quem lançou).
- **obras:** gerente e coordenador veem todas; engenheiro, mestre e cliente só as obras em que estão em `membros`. Só o gerente cria, edita e apaga.
- **membros:** só o gerente mexe. Cada um vê os próprios vínculos.
- **atividades:** veem todos com acesso à obra (inclusive cliente). Importar/reimportar: gerente, coordenador, engenheiro. Apagar: só gerente.
- **avancos:** veem todos com acesso à obra (cliente só vê % e fotos). Criar: gerente, coordenador, engenheiro, mestre. Ninguém edita (corrige-se com novo lançamento). Apagar: só gerente.
- **restricoes:** cliente não vê. Mestre só vê. Gerente, coordenador e engenheiro criam e editam. Apagar: só gerente.
- **tarefas:** cliente não vê. Gerente, coordenador e engenheiro criam e editam. Mestre só muda `situacao` e `motivo_nao_feito`. Apagar: só gerente.
- **funcoes:** todos os logados veem; só o gerente edita.
- **efetivos:** cliente não vê. Gerente, coordenador, engenheiro e mestre lançam e editam o do dia; dias anteriores só o gerente edita. Apagar: só gerente.
- **avisos:** cliente não vê. Gerente, coordenador e engenheiro criam e editam os próprios; só o gerente apaga e fixa.
- **Sem login:** não vê nada, em nenhuma tabela.
- **Fotos (Storage):** só quem tem acesso àquela obra vê.

## A pergunta de um ano

1. **"Qual atividade gerou mais atraso?"** — atraso de uma atividade = `termino_real` (ou hoje, se não terminou) menos `termino_base_original`, em dias. Comparável entre obras pelo campo `servico` (ex.: todas as "Drenagem"). Ajuda a explicar o porquê: restrições ligadas à atividade (`restricoes.atividade_id`) e tarefas 'Não feito' com motivo (`tarefas.atividade_id`).
   Dado que precisou entrar agora: `inicio_base_original` e `termino_base_original` em `atividades`, porque a linha de base atual muda quando o Project é rebaselinado e o atraso "zeraria".
2. **"Qual atividade usou mais pessoas?"** — soma de `efetivos.quantidade` (pessoas × dias) por `atividade_id`, separando MO direta e terceirizado.
   Dado que precisou entrar agora: `atividade_id` em `efetivos` (obrigatório para MO direta e terceirizado).

Na v1 não há tela para essas duas perguntas; os dados ficam guardados desde o primeiro dia. Relatório na v2.

## Melhorias para a v2

- Medição com cliente e com terceirizados (2x por mês) — cortado porque a v1 é só cronograma e planejamento
- Ligação com o Sienge — depende da medição
- Orçamento, análise de custo e eficiência financeira — exige trazer orçamento e custo realizado, dobraria a v1
- Diário de obra e ocorrências — fora do foco da v1
- Montar ou editar o cronograma dentro do app — continua no MS Project
- Devolver o avanço para o arquivo do MS Project
- Peso da curva S por custo em vez de duração
- Relatórios "atividade que mais atrasou" e "atividade que mais usou pessoas" — os dados já são guardados desde a v1

---

# A conta que vai chegar depois

- `[PENDENTE: horas por dia gastas na análise de cronograma]` — sem esse número não dá para medir se o sistema economizou tempo.
- `[PENDENTE: como o médio e o curto prazo são feitos hoje]` — as telas de planejamento foram desenhadas pelo método Last Planner, não pelo jeito atual do gerente; pode precisar de ajuste no primeiro uso.
- `[PENDENTE: um XML real do MS Project de cada obra]` — a importação é a peça mais arriscada; testar com o arquivo real logo no começo da construção evita descobrir surpresa no dia 6.

# Decidir depois de usar

- `[DESCOBRIR NO USO: se o médio prazo também precisa ser montado pelo celular]` — por enquanto ficou: montado no computador, consultado no celular.
- `[DESCOBRIR NO USO: se o peso da curva S deveria ser por custo]` — por enquanto ficou: peso pela duração na linha de base.
