# PRD Frontend — ObraPrime

> Especificação da interface. Quem constrói lê este arquivo.
> Nesta fase não existe banco: as telas funcionam com os dados de exemplo do fim deste arquivo.
> Fonte das decisões: `PLANO-DO-PROJETO.md`. Quando algo mudar na construção, este arquivo é atualizado junto.

## O que o sistema é

Um sistema de acompanhamento de cronograma e planejamento de obra: importa o cronograma do MS Project, registra o avanço físico, o efetivo diário e as restrições, e mostra curva S, linha de balanço e o planejamento de 3 meses, da semana e do dia, separado por obra.

Usado em dois lugares: **no celular, no canteiro** (mestre: efetivo, avanço, tarefas do dia) e **no computador, no escritório** (gerente, coordenador, engenheiro: importar cronograma e planejar). O cliente usa no celular, só leitura.

## Padrão técnico

- React + Vite (versões atuais), sem biblioteca de componente pronta.
- Visual a partir de um `index.css` próprio.
- Navegação por estado, sem endereço no navegador.
- Tema claro. Cores tiradas do logo:
  - Azul-marinho `#01152E`: menu lateral, cabeçalho, barra inferior do celular, títulos.
  - Dourado `#F5B03B` (claro `#F6C542`, escuro `#E49B2C`): botão principal (texto marinho sobre fundo dourado), item ativo do menu, linha "realizado" da curva S, faixas de alerta.
  - Branco `#FFFFFF`: fundo do conteúdo. Cinza claro `#F3F4F6` para fundo de cartões.
  - Situação: verde `#1D8A5B` (no prazo / sem restrição / feito), vermelho `#C62828` (atrasada / com restrição / não feito / vencida), cinza `#6B7280` (não iniciada / planejada).
  - **Nunca texto dourado sobre fundo branco** (ilegível). Dourado só como fundo de botão/faixa ou sobre o marinho.
- Logo: `identidade/logo-obraprime.jpg` (fundo marinho). Aparece no topo do menu lateral e na tela de login. Slogan "Gestão inteligente de obras" na tela de login.
- Celular: barra inferior fixa (até 5 itens). Computador (a partir de 900px de largura): menu lateral à esquerda, marinho.
- No celular, botões com no mínimo 48px de altura; campos numéricos abrem o teclado numérico.
- Gráficos: **só dois** na v1: curva S e linha de balanço. Todo o resto é número, lista ou tabela.
- Datas no formato dd/mm/aaaa; semanas começam na segunda-feira; fuso de Brasília.

## Perfis

- **Gerente:** entra no Painel. Vê todas as obras e tudo. Único que cria obra, gerencia usuários, edita funções, fixa avisos e apaga registros.
- **Coordenador:** entra no Painel. Vê todas as obras e tudo; não cria obra nem gerencia usuários.
- **Engenheiro:** entra no Painel. Vê só as obras em que está vinculado; importa cronograma, lança avanço e efetivo, cria restrições e tarefas.
- **Mestre:** entra na tela Hoje (celular). Vê só as obras em que está vinculado; lança avanço e efetivo, marca tarefas do dia. Não cria restrição nem tarefa.
- **Cliente:** entra no Painel do cliente. Vê só a obra dele: avanço, curva S e fotos. Não vê restrições, planejamento, efetivo nem avisos.
- **Pendente** (cadastrou e não foi liberado): vê só a tela "Aguardando liberação".

## Mapa de navegação

```
Login
├── Pendente: Aguardando liberação
├── Gerente / Coordenador / Engenheiro
│   menu: Painel · Cronograma · Planejamento · Efetivo · Obras · Usuários (só gerente)
│   Cronograma: abas Lista · Linha de balanço · Lançar avanço  (+ Importar)
│   Planejamento: abas 3 meses · Restrições · Semana e dia
│   Painel → Avisos (ver todos)
│   rodapé do menu: Meu perfil · Sair
├── Mestre (barra inferior): Hoje · Efetivo · Avanço · Painel   (+ Meu perfil no topo)
└── Cliente: Painel do cliente   (+ Sair no topo)
```

Celular para Gerente/Coordenador/Engenheiro: barra inferior com Painel · Cronograma · Planejamento · Efetivo · Mais (Mais abre: Obras, Usuários, Avisos, Meu perfil, Sair).

**Seletor de obra:** no cabeçalho de todas as telas (menos Obras, Usuários e Meu perfil), uma caixa com o nome da obra atual. Lista só as obras que a pessoa pode ver, em andamento primeiro. A obra escolhida fica lembrada no aparelho. Se a pessoa só tem uma obra, o seletor mostra o nome sem abrir lista.

---

## Tela: Login

**Quem acessa:** todos, antes de entrar.

**O que aparece**
Fundo marinho com o logo ObraPrime e o slogan. Cartão branco com email, senha, botão Entrar e link "Criar conta". No modo criar conta: nome, email, senha, botão Criar conta, link "Já tenho conta".

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome | texto | sim (só criar conta) | |
| Email | email | sim | |
| Senha | senha | sim | mínimo 8 caracteres |

**Ações**
- **Entrar:** valida e leva para a tela inicial do perfil (Painel; Hoje para mestre; Painel do cliente para cliente; Aguardando liberação para pendente). Erro: "Email ou senha incorretos."
- **Criar conta:** cadastra e leva para "Aguardando liberação".

**Estado vazio**
Não se aplica.

---

## Tela: Aguardando liberação

**Quem acessa:** perfil Pendente, ou usuário bloqueado.
**Chega aqui por:** login.

**O que aparece**
Logo, a mensagem "Conta aguardando liberação do administrador. Assim que o gerente liberar seu acesso, você poderá entrar." e o botão Sair. Se bloqueado: "Seu acesso está bloqueado. Fale com o gerente da obra."

**Ações**
- **Sair:** volta para o login.

**Estado vazio**
Não se aplica.

---

## Tela: Painel

**Quem acessa:** Gerente, Coordenador, Engenheiro, Mestre (Mestre só leitura).
**Chega aqui por:** tela inicial; menu Painel; clicar numa obra em Obras.

**O que aparece** (de cima para baixo). **Regra do gerente (09/10/2026): no celular, % de avanço e planejamento da semana aparecem antes de rolar a tela.** No computador, os blocos 2 e 3 ficam lado a lado no topo; do bloco 4 em diante, duas colunas.
1. **Faixa de alerta de efetivo** (dourada, compacta, só quando aplicável): "Efetivo de hoje não lançado" + botão "Lançar". Aparece depois das 10h, de segunda a sábado, se a obra não tem efetivo lançado hoje. Para Gerente, Coordenador, Engenheiro e Mestre.
2. **Avanço físico** (o maior número da tela, 52px): % realizado; ao lado, "previsto X%"; etiqueta com a diferença em pontos (verde se realizado ≥ previsto, vermelho se menor); barra com o realizado preenchido e um traço dourado no previsto.
3. **Planejamento da semana:** % de tarefas cumpridas até hoje (feitas ÷ planejadas de segunda até hoje) e "X de Y"; faixa com os 6 dias (seg a sáb), cada um com "feitas/total" e uma barrinha verde (feito), vermelha (não feito) e cinza (planejada); o dia de hoje com borda marinho; dias futuros só com o total. O número do dia fica **vermelho se houver pelo menos uma tarefa "Não feito"** (confirmado pelo gerente), verde se todas foram feitas, e cinza/neutro se ainda há tarefa planejada sem marcação. Embaixo, as tarefas de hoje (descrição, responsável, etiqueta de situação). Link "ver semana".
4. **Cartões de números:** Efetivo de hoje (ou "—" e "ontem: N" se não lançado), Atrasadas, Restrições abertas.
5. **Curva S:** gráfico de linhas, eixo horizontal em semanas do início ao fim da obra, eixo vertical 0–100%. Linha prevista em marinho, linha realizada em dourado (só até hoje). Linha vertical tracejada marcando hoje. Tocar/passar o mouse num ponto mostra semana, previsto e realizado.
6. **Atividades atrasadas:** até 5, as de maior atraso primeiro: nome, local, % previsto x % realizado. Link "ver todas" abre Cronograma filtrado em Atrasadas.
7. **Semana passada:** "Semana passada: X% das tarefas cumpridas" (ou "Semana passada sem tarefas planejadas").
8. **Restrições:** vencidas (vermelho) e que vencem nos próximos 7 dias (âmbar): atividade, tipo, responsável, data limite. Link "ver todas" abre Planejamento > Restrições.
9. **Quadro de avisos:** os 5 mais recentes, fixados primeiro: título, autor, data. Link "ver todos" abre Avisos.

O detalhe do efetivo (MO direta, indireta, terceirizados, funções) fica na tela Efetivo; no Painel aparece só o cartão do bloco 4.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| % previsto hoje | número | — | calculado (ver Regras de cálculo no plano) |
| % realizado | número | — | calculado |
| Diferença | número | — | realizado − previsto, em pontos |
| Total efetivo hoje | número | — | soma das quantidades de hoje |

**Ações**
- **Lançar agora** (na faixa): abre a tela Efetivo no dia de hoje.
- **Clicar numa atividade atrasada:** abre a gaveta daquela atividade ali mesmo, no Painel (dá para lançar avanço sem sair; vale também para o Mestre, que não tem o Cronograma no menu).
- **Clicar numa restrição:** abre Planejamento > Restrições com ela destacada (borda dourada) e rolada até ela.
- **Tocar (ou passar o mouse) num ponto da curva S:** mostra a semana, o previsto e o realizado.

**Se um dado não carregar:** o cronograma é essencial (sem ele, a tela mostra o erro com "Tentar de novo"). Os outros blocos — semana, efetivo, restrições, avisos — falham sozinhos: só aquele bloco mostra "Não foi possível carregar…" e o resto do Painel continua. Sem conseguir ler o efetivo, a faixa de alerta não aparece.
- **Clicar numa tarefa de hoje:** abre Planejamento > Semana e dia no dia de hoje.

**Regras por perfil**
- **Mestre:** vê tudo, mas os blocos não têm botão de editar; "Lançar agora" funciona.
- **Gerente/Coordenador:** podem trocar para qualquer obra no seletor.
- **Engenheiro/Mestre:** só as obras vinculadas.

**Estado vazio**
"Esta obra ainda não tem cronograma. Importe o arquivo do MS Project para começar." + botão "Importar cronograma" (Gerente, Coordenador, Engenheiro). Se a pessoa não tem nenhuma obra: "Você ainda não está vinculado a nenhuma obra. Fale com o gerente."

---

## Painel — aba "Todas as obras" (visão geral)

**Quem acessa:** Gerente e Coordenador, quando enxergam mais de uma obra. Os outros perfis não veem as abas.
**Chega aqui por:** abas no cabeçalho do Painel: "Esta obra" (padrão, abre sempre nela) e "Todas as obras".

**O que aparece**
Uma linha (cartão) por obra que não está concluída, na ordem do seletor. Em cada uma: nome, tipo e cidade; etiqueta com a diferença em pontos do previsto (ou a situação, se Paralisada); barra de avanço (realizado preenchido, traço dourado no previsto); e cinco números: Avanço (realizado, com previsto embaixo), Atrasadas, Restrições vencidas (com abertas embaixo), Efetivo hoje ("—" e "não lançado" em âmbar se não houve lançamento), Semana (% cumprido até hoje e "X de Y tarefas"). Obra sem cronograma mostra "Sem cronograma importado". Embaixo: "+ N obras concluídas não aparecem aqui".

**Ações**
- **Tocar numa obra:** troca para ela e abre o Painel dela na aba "Esta obra".

**Estado vazio**
"Nenhuma obra em andamento"

---

## Tela: Acerto inicial do avanço

**Quem acessa:** Gerente, Coordenador, Engenheiro.
**Chega aqui por:** botão "Acertar avanço" no Cronograma; aviso no Painel "A obra começou antes do app? N atividades aparecem atrasadas porque ainda não têm avanço lançado" (aparece quando a obra não tem nenhum avanço lançado e há atrasadas).

**O que aparece**
Texto explicando para que serve. Busca por atividade, etapa ou EAP. "Marcar todas", "Marcadas = 100%", "Marcadas = previsto de hoje", "Limpar", e o contador "N marcadas · M com % novo para gravar". As atividades que já deveriam ter começado (início da linha de base até hoje) e não estão em 100%, agrupadas por etapa (os dois primeiros níveis do cronograma, ex.: "FASE 01 - LOTEAMENTO › BEACH LOUNGE - FASE 01"), cada grupo com "Todas". Cada linha: caixinha, nome, "EAP · base · previsto hoje · lançado", e o campo do novo %. Linha com % novo fica destacada. Botão fixo embaixo: "Gravar acerto de N atividades".

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Novo % | número 0–100 | não | vazio ou igual ao atual = não grava |

**Ações**
- **Gravar acerto:** grava um avanço por atividade, com a data de hoje e a observação "Acerto inicial do avanço"; ou todos, ou nenhum. Volta ao Painel com "Acerto gravado em N atividades".

**Estado vazio**
"Nada para acertar"

---

## Tela: Cronograma — aba Lista

**Quem acessa:** Gerente, Coordenador, Engenheiro (Mestre chega pela gaveta via Avanço).
**Chega aqui por:** menu Cronograma; links do Painel.

**O que aparece**
Cabeçalho com "Revisão N · importado em dd/mm/aaaa" e o botão "Importar cronograma". Barra de filtros: Todas · Atrasadas · Desta semana · Do mês · por etapa (lista das atividades de nível 1). Lista em árvore seguindo a EAP: atividades-resumo em negrito com seta para abrir/fechar; atividades-folha com os dados. No computador, à direita da lista, um Gantt simples: barra cinza = linha de base, barra marinho = previsto atual, preenchimento dourado = % realizado, linha vertical = hoje. No celular, sem Gantt.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| EAP | texto | — | ex.: 1.2.3 |
| Atividade | texto | — | |
| Início base / Término base | data | — | linha de base |
| Início real / Término real | data | — | vazio se não começou/terminou |
| Duração | número | — | dias |
| % previsto hoje | número | — | |
| % realizado | número | — | |
| Situação | etiqueta | — | 'No prazo' (verde), 'Atrasada' (vermelho), 'Concluída' (verde), 'Não iniciada' (cinza), 'Removida na revisão N' (cinza riscado) |

**Ações**
- **Clicar numa atividade-folha:** abre gaveta lateral (no celular, tela cheia) com: nome, local e serviço, datas, % previsto x realizado, histórico de avanços (data, %, quem lançou, observação, foto em miniatura que amplia ao tocar), restrições ligadas a ela, e botão "Lançar avanço".
- **Importar cronograma:** abre a tela Importar cronograma.
- **Abrir/fechar resumo:** mostra ou esconde as filhas.

**Regras por perfil**
- **Gerente/Coordenador/Engenheiro:** tudo.
- **Mestre:** não tem esta aba no menu; vê a gaveta pelo Avanço, sem botão de importar.

**Estado vazio**
"Nenhum cronograma importado. Exporte do MS Project em XML (Arquivo > Salvar como > XML) e importe aqui."

---

## Tela: Importar cronograma

**Quem acessa:** Gerente, Coordenador, Engenheiro.
**Chega aqui por:** botão "Importar cronograma" no Cronograma ou no Painel vazio.

**O que aparece**
Passo 1: instrução "No MS Project: Arquivo > Salvar como > tipo XML" e o campo para escolher o arquivo `.xml`.
Passo 2 (depois de ler o arquivo, ainda sem gravar): resumo "X atividades, Y locais e Z serviços encontrados · linha de base de dd/mm/aaaa a dd/mm/aaaa". Lista dos locais e dos serviços encontrados. Se for reimportação: "N atividades novas, M atualizadas, K removidas". Se o arquivo não tem linha de base: aviso "Este arquivo não tem linha de base. As datas atuais serão usadas como linha de base."
Botões Confirmar importação e Cancelar.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Arquivo | arquivo .xml | sim | XML do MS Project; `.mpp` não é aceito |

**Ações**
- **Escolher arquivo:** lê o arquivo no navegador e mostra o passo 2. Se não for XML do Project ou não tiver tarefas: "Este arquivo não parece ser um XML do MS Project. No Project: Arquivo > Salvar como > tipo XML." e nada é gravado. Se for `.mpp`: "Arquivos .mpp não são lidos. No Project: Arquivo > Salvar como > tipo XML."
- **Confirmar importação:** grava, sobe a revisão da obra, volta para Cronograma com a mensagem "Cronograma importado: revisão N".
- **Cancelar:** volta sem gravar.

**Regras de leitura do XML**
- De cada tarefa: UID, Name, OutlineNumber (EAP), OutlineLevel, Summary, Start, Finish, Duration, e a linha de base 0 (Baseline Number 0: Start, Finish).
- A tarefa de nível 0 (resumo do projeto) é ignorada.
- **Local e serviço** (dois jeitos aceitos, decidido com o XML real em 09/10/2026):
  - **serviço primeiro** (o XML real): `SUBLEITO > Execução de Subleito - Rua 03, 04 e 06` → serviço = a mãe; local = o texto depois do último " - " no nome da folha;
  - **local primeiro**: `Quadra A > Drenagem` (folha sem " - ") → local = a mãe; serviço = a folha.
  Locais escritos de jeitos diferentes se juntam (sem acento, sem caixa, sem a palavra "rua"). Na linha de balanço só entram serviços que aparecem em 2 ou mais locais; por padrão aparecem marcados os que têm mais locais (75% do máximo), e os outros podem ser ligados nos filtros.
- **Reimportação:** casa pelo UID. Nova → entra. Existente → atualiza nome, EAP, datas atuais e linha de base atual, mantém avanço e a linha de base original. Sumiu do arquivo → marcada "Removida na revisão N".

**Regras por perfil**
- Só Gerente, Coordenador e Engenheiro veem esta tela.

**Estado vazio**
Não se aplica.

---

## Tela: Cronograma — aba Linha de balanço

**Quem acessa:** Gerente, Coordenador, Engenheiro.
**Chega aqui por:** menu Cronograma > aba Linha de balanço.

**O que aparece**
Filtro de serviços (caixinhas de marcar, uma por serviço, com a cor de cada um). Gráfico: eixo vertical com os locais (na ordem da EAP, o primeiro embaixo), eixo horizontal em semanas. Para cada serviço, uma linha colorida passando pelos locais: linha **tracejada** = previsto (início e término da linha de base em cada local); linha **cheia** = realizado (início e término reais). Trecho do realizado que está à direita do previsto em vermelho. Onde duas linhas tracejadas de serviços diferentes se cruzam, um ícone de alerta com a dica "Possível colisão: <serviço 1> e <serviço 2> em <local>". Linha vertical marcando hoje. Legenda embaixo.

**Ações**
- **Marcar/desmarcar serviço:** mostra/esconde a linha.
- **Clicar num ponto:** abre a gaveta da atividade daquele serviço naquele local.

**Regras por perfil**
- Só leitura para todos.

**Estado vazio**
"Esta obra não tem serviços repetidos por local. A linha de balanço serve para obras como loteamento."

---

## Tela: Lançar avanço

**Quem acessa:** Gerente, Coordenador, Engenheiro (aba do Cronograma), Mestre (item Avanço da barra inferior).
**Chega aqui por:** Cronograma > aba Lançar avanço; barra inferior Avanço (Mestre); botão "Lançar avanço" na gaveta.

**O que aparece**
Lista das atividades-folha em andamento ou previstas para esta semana, as previstas para hoje primeiro. Filtro por local/etapa. Cada atividade é um cartão: nome, local, % realizado atual, barra de progresso. Ao tocar, o cartão abre o formulário.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Novo % realizado | número 0–100 | sim | atalhos: botões 25 · 50 · 75 · 100 |
| Data | data | sim | padrão hoje |
| Observação | texto | não | |
| Foto | foto (câmera ou galeria) | não | comprimida antes de enviar |

**Ações**
- **Salvar avanço:** grava um novo lançamento (não apaga o anterior); o cartão mostra o novo % e a mensagem "Avanço salvo". Se o novo % for menor que o atual, pede confirmação: "O novo % é menor que o anterior (X%). Confirmar?"
- **Ver histórico:** abre a gaveta da atividade.

**Regras por perfil**
- **Mestre:** mesma tela, botões grandes, sem filtro de etapa (só local).
- **Cliente:** não acessa.

**Estado vazio**
"Nenhuma atividade em andamento esta semana."

---

## Tela: Planejamento — aba 3 meses

**Quem acessa:** Gerente, Coordenador, Engenheiro, Mestre (Mestre só leitura, pelo Painel).
**Chega aqui por:** menu Planejamento.

**O que aparece**
Quadro com 12 colunas, uma por semana a partir da semana atual (título "Sem 13/10 – 18/10"). Em cada coluna, as atividades-folha cujo período previsto passa por aquela semana (a mesma atividade pode aparecer em várias semanas). Cada atividade é um cartão: nome, local, número de restrições abertas. Cartão **vermelho** se tem restrição aberta; **verde** se não tem. Filtro "Só com restrição". No celular, uma semana por vez com setas para avançar/voltar.

**Ações**
- **Clicar num cartão:** gaveta da atividade com a lista de restrições e o botão "Adicionar restrição".
- **Adicionar restrição:** abre o formulário de restrição já com a atividade preenchida.

**Regras por perfil**
- **Mestre:** vê o quadro, sem botão de adicionar.

**Estado vazio**
"Nenhuma atividade prevista para os próximos 3 meses."

---

## Tela: Planejamento — aba Restrições

**Quem acessa:** Gerente, Coordenador, Engenheiro, Mestre (Mestre só leitura).
**Chega aqui por:** Planejamento > aba Restrições; links do Painel.

**O que aparece**
Botão "Nova restrição". Filtros: situação (Aberta / Removida / Todas, padrão Aberta), tipo, responsável. Lista: abertas primeiro, por data limite. Cada linha: atividade (e local), tipo, descrição, responsável, data limite, situação. Data limite vencida em vermelho; vencendo nesta semana com etiqueta dourada.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Atividade | lista (atividades-folha) | sim | busca por nome |
| Tipo | lista | sim | 'Projeto', 'Material', 'Mão de obra', 'Equipamento', 'Terceirizado/contrato', 'Licença/liberação', 'Clima', 'Financeiro', 'Outro' |
| Descrição | texto | sim | |
| Responsável | texto | sim | nome de quem vai resolver (pode ser de fora do sistema) |
| Data limite | data | sim | |
| Situação | etiqueta | — | 'Aberta' ou 'Removida' |

**Ações**
- **Nova restrição / editar:** formulário acima; salvar volta para a lista.
- **Marcar como removida:** muda para 'Removida' com a data de hoje; o cartão da atividade no quadro de 3 meses fica verde se não sobrar outra aberta.
- **Excluir:** só Gerente, com confirmação.

**Regras por perfil**
- **Mestre:** só leitura.

**Estado vazio**
"Nenhuma restrição aberta. Bom sinal."

---

## Tela: Planejamento — aba Semana e dia

**Quem acessa:** Gerente, Coordenador, Engenheiro.
**Chega aqui por:** Planejamento > aba Semana e dia; link "ver semana" do Painel.

**O que aparece**
Título da semana com setas (semana anterior / próxima). Sete colunas (segunda a domingo) no computador; no celular, um dia por vez com setas. Em cada dia, as tarefas: descrição, responsável, atividade ligada, etiqueta de situação. No topo: "Esta semana: X de Y tarefas feitas (Z%)". Abaixo do quadro, a tabela "Histórico" com as semanas anteriores: semana, planejadas, feitas, %.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Dia | data | sim | |
| Descrição (meta) | texto | sim | ex.: "Concretar bloco B" |
| Responsável | texto | sim | equipe ou empresa |
| Atividade | lista (atividades-folha) | não | |
| Situação | etiqueta | sim | 'Planejada' (cinza), 'Feito' (verde), 'Não feito' (vermelho) |
| Motivo de não ter feito | lista | sim quando 'Não feito' | 'Restrição não removida', 'Mão de obra', 'Material', 'Clima', 'Projeto', 'Outro' |

**Ações**
- **Nova tarefa** (botão em cada dia): formulário acima.
- **Feito / Não feito** (dois botões na tarefa): muda a situação; "Não feito" pede o motivo.
- **Editar / copiar para outro dia.**
- **Excluir:** só Gerente.

**Regras por perfil**
- **Mestre:** não usa esta tela; usa a tela Hoje.

**Estado vazio**
"Nenhuma tarefa planejada para esta semana."

---

## Tela: Hoje (Mestre)

**Quem acessa:** Mestre (tela inicial). Gerente, Coordenador e Engenheiro veem o mesmo conteúdo no Painel e na aba Semana e dia.
**Chega aqui por:** login; barra inferior Hoje.

**O que aparece**
Faixa de alerta de efetivo (mesma regra do Painel). Data de hoje. Lista das tarefas de hoje da obra: descrição, responsável, atividade, etiqueta de situação, e dois botões grandes: **Feito** (verde) e **Não feito** (vermelho).

**Ações**
- **Feito:** marca e a tarefa fica verde.
- **Não feito:** abre a lista de motivos (botões grandes); escolher grava e a tarefa fica vermelha.
- **Desfazer** (aparece por 5 segundos depois de marcar): volta para 'Planejada'.

**Regras por perfil**
- **Mestre:** só muda a situação e o motivo; não cria nem edita a tarefa.

**Estado vazio**
"Nenhuma tarefa planejada para hoje."

---

## Tela: Efetivo

**Quem acessa:** Gerente, Coordenador, Engenheiro, Mestre.
**Chega aqui por:** menu/barra Efetivo; "Lançar agora" da faixa de alerta.

**O que aparece**
Navegação de data (setas dia anterior/próximo, padrão hoje). Linhas do efetivo do dia, agrupadas por tipo (MO direta, MO indireta, Terceirizado). Embaixo: total do dia e total por tipo. Botão "Adicionar linha" e, se o dia está vazio, "Copiar de ontem". Abaixo, a tabela "Últimos 30 dias": data, MO direta, MO indireta, Terceirizados, total. Botão "Funções" (só Gerente).

**Campos e informações** (cada linha)

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Tipo | lista | sim | 'MO direta', 'MO indireta', 'Terceirizado' |
| Função | lista (funções ativas) | sim | filtrada pelo tipo (MO direta/indireta); para Terceirizado, todas |
| Empresa | texto com sugestões | sim quando Terceirizado | sugere empresas já usadas na obra |
| Atividade | lista (atividades-folha) | sim quando MO direta ou Terceirizado | em andamento primeiro; escondido para MO indireta |
| Quantidade | número inteiro > 0 | sim | botões − e + no celular |

**Ações**
- **Copiar de ontem:** copia todas as linhas do último dia lançado para hoje, para ajustar.
- **Adicionar linha / editar linha / remover linha:** na própria lista.
- **Salvar:** grava o dia; mensagem "Efetivo de dd/mm salvo". A faixa de alerta some.
- **Funções** (Gerente): abre lista de funções com nome, tipo, ativo; criar, renomear, desativar.

**Regras por perfil**
- **Gerente:** edita qualquer dia.
- **Coordenador, Engenheiro, Mestre:** editam só o dia de hoje; dias anteriores aparecem só para leitura.
- **Cliente:** não acessa.

**Estado vazio**
"Efetivo de hoje ainda não lançado. Copiar de ontem?"

---

## Tela: Obras

**Quem acessa:** Gerente (cria e edita), Coordenador e Engenheiro (só veem).
**Chega aqui por:** menu Obras.

**O que aparece**
Botão "Nova obra" (Gerente). Filtro por situação: Em andamento (padrão) / Paralisada / Concluída / Todas. Cartões: nome, cliente, tipo, cidade, início, término previsto, barra de % realizado, etiqueta de situação.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Nome | texto | sim | |
| Cliente | texto | não | |
| Tipo | lista | sim | 'Loteamento', 'Stand de vendas', 'Outro' |
| Cidade | texto | não | |
| Data de início | data | não | se vazia, mostra a do cronograma |
| Término previsto | data | não | se vazio, mostra o do cronograma |
| Situação | lista | sim | 'Em andamento', 'Paralisada', 'Concluída' |
| Pessoas da obra | lista de usuários | não | vincula engenheiros, mestres e cliente |

**Ações**
- **Clicar na obra:** seleciona a obra e abre o Painel dela.
- **Nova obra / Editar** (Gerente): formulário acima.
- **Pessoas da obra** (Gerente): marcar/desmarcar usuários ativos.
- **Excluir** (Gerente): confirmação forte "Excluir a obra <nome> apaga cronograma, avanços, efetivo e planejamento dela. Digite o nome da obra para confirmar."

**Regras por perfil**
- **Coordenador/Engenheiro:** sem botões de criar/editar/excluir. Engenheiro vê só as vinculadas.

**Estado vazio**
"Nenhuma obra cadastrada. Crie a primeira obra." (Gerente) / "Você ainda não está vinculado a nenhuma obra." (demais)

---

## Tela: Usuários

**Quem acessa:** só Gerente.
**Chega aqui por:** menu Usuários.

**O que aparece**
Abas: Aguardando (padrão quando há alguém) / Ativos / Bloqueados. Lista: nome, email, perfil, obras vinculadas, situação.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Perfil | lista | sim | 'Gerente', 'Coordenador', 'Engenheiro', 'Mestre', 'Cliente' |
| Obras | lista de obras | não | Gerente e Coordenador não precisam (veem todas) |

**Ações**
- **Liberar:** escolhe perfil e obras; a pessoa passa a entrar normalmente.
- **Mudar perfil / obras.**
- **Bloquear / Desbloquear.**

**Regras por perfil**
- Só Gerente. O Gerente não consegue bloquear nem tirar o perfil de si mesmo.

**Estado vazio**
"Ninguém aguardando liberação."

---

## Tela: Avisos

**Quem acessa:** Gerente, Coordenador, Engenheiro (criam), Mestre (só lê).
**Chega aqui por:** "ver todos" no Painel; Mais > Avisos no celular.

**O que aparece**
Botão "Novo aviso". Lista: fixados primeiro (com ícone de alfinete), depois os mais recentes. Cada aviso: título, texto, autor, data.

**Campos e informações**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| Título | texto | sim | |
| Texto | texto longo | sim | |
| Fixado | sim/não | — | só Gerente marca |

**Ações**
- **Novo aviso / editar o próprio.**
- **Fixar / desafixar** (Gerente).
- **Excluir** (Gerente), com confirmação.

**Regras por perfil**
- **Mestre:** só leitura. **Cliente:** não acessa.

**Estado vazio**
"Nenhum aviso nesta obra."

---

## Tela: Painel do cliente

**Quem acessa:** só Cliente.
**Chega aqui por:** login.

**O que aparece**
Logo no topo, nome da obra. Avanço físico (% previsto, % realizado, diferença). Curva S (mesmo gráfico do Painel). Galeria das fotos mais recentes dos avanços (as 30 últimas), cada uma com data e nome da atividade; tocar amplia. Botão Sair.

**Regras por perfil**
- Não mostra restrições, planejamento, efetivo, avisos, observações dos avanços nem quem lançou.

**Estado vazio**
"O acompanhamento desta obra ainda não começou."

---

## Tela: Meu perfil

**Quem acessa:** todos os logados.
**Chega aqui por:** rodapé do menu; Mais; topo (Mestre).

**O que aparece**
Nome (editável), email, perfil (só leitura), obras vinculadas (só leitura), botões Salvar e Sair.

**Estado vazio**
Não se aplica.

---

## Textos do sistema

- Botões: Salvar, Cancelar, Novo, Editar, Excluir, Confirmar, Voltar, Sair.
- Confirmação de exclusão: "Excluir este registro? Isso não pode ser desfeito."
- Aviso de conta pendente: "Conta aguardando liberação do administrador."
- Erro genérico: "Não foi possível salvar. Verifique a conexão e tente de novo."
- Erro de carregamento de bloco: "Não foi possível carregar. Tente atualizar a página."
- Sucesso: "Salvo."

## Dados de exemplo

Data de referência: hoje = 09/10/2026 (sexta).

```
USUÁRIOS (um de cada perfil, todos fictícios)
- Carlos Andrade — Gerente — todas as obras
- Fernanda Lima — Coordenador — todas as obras
- Rafael Souza — Engenheiro — Loteamento Jardim das Palmeiras
- José Ribamar — Mestre — Loteamento Jardim das Palmeiras
- Construtora Horizonte (Marina Costa) — Cliente — Loteamento Jardim das Palmeiras
- Pedro Alves — Pendente (aguardando liberação)

OBRAS
1. Loteamento Jardim das Palmeiras — cliente Construtora Horizonte — Loteamento — Itu/SP — 03/08/2026 a 30/01/2027 — Em andamento — revisão 2
2. Stand de Vendas Residencial Aurora — cliente Aurora Incorporadora — Stand de vendas — Sorocaba/SP — 14/09/2026 a 20/12/2026 — Em andamento — revisão 1
3. Loteamento Vale Verde — Concluída

ATIVIDADES (obra 1, local primeiro; base = linha de base)
1 Quadra A (resumo)
 1.1 Drenagem        base 03/08–28/08  real 05/08–02/09  100%  Concluída
 1.2 Rede de água    base 24/08–18/09  real 31/08–        80%  Atrasada
 1.3 Meio-fio        base 14/09–02/10  real 21/09–        40%  Atrasada
 1.4 Pavimentação    base 05/10–30/10  real —              0%  Atrasada (previsto hoje 16%)
2 Quadra B (resumo)
 2.1 Drenagem        base 31/08–25/09  real 02/09–24/09  100%  Concluída
 2.2 Rede de água    base 21/09–16/10  real 23/09–        75%  No prazo (previsto hoje 72%)
 2.3 Meio-fio        base 12/10–30/10  real —              0%  Não iniciada
 2.4 Pavimentação    base 02/11–27/11  real —              0%  Não iniciada
3 Quadra C (resumo)
 3.1 Drenagem        base 28/09–23/10  real 30/09–        45%  No prazo (previsto hoje 44%)
 3.2 Rede de água    base 19/10–13/11  real —              0%  Não iniciada
 (uma atividade "3.3 Muro de divisa" marcada "Removida na revisão 2")

AVANÇOS (obra 1)
- 18/09 Quadra A > Rede de água 50% (José Ribamar, com foto)
- 25/09 Quadra B > Drenagem 100% (Rafael Souza)
- 02/10 Quadra A > Rede de água 80% (José Ribamar, obs.: "faltou tubo DN100")
- 06/10 Quadra A > Meio-fio 40% (José Ribamar, com foto)
- 08/10 Quadra C > Drenagem 45% (Rafael Souza, com foto)

RESTRIÇÕES (obra 1)
- Quadra A > Pavimentação — Material — "Usina sem data de entrega de CBUQ" — Rafael — limite 03/10 — Aberta (vencida)
- Quadra B > Meio-fio — Mão de obra — "Contratar segunda equipe de meio-fio" — Carlos — limite 13/10 — Aberta (vence esta semana)
- Quadra C > Rede de água — Licença/liberação — "Aprovação do projeto na SAAE" — Fernanda — limite 30/10 — Aberta
- Quadra A > Rede de água — Material — "Tubo DN100" — Rafael — limite 01/10 — Removida em 03/10
- Quadra B > Pavimentação — Projeto — "Revisão do greide" — Rafael — limite 20/10 — Aberta

TAREFAS (obra 1)
- semana passada (28/09–03/10): 8 planejadas, 6 Feito, 1 Não feito (Material), 1 Não feito (Clima) → 75%
- hoje 09/10: "Assentar meio-fio Quadra A, rua 2" (Equipe Silva) — Planejada
              "Rede de água Quadra B, trecho 3" (Hidro Itu Ltda) — Feito
              "Escavação drenagem Quadra C" (Equipe própria) — Não feito (Clima)

FUNÇÕES: as padrão (ver Efetivo no plano).

EFETIVO (obra 1)
- 08/10: MO direta Pedreiro 4 (Meio-fio Quadra A), Servente 8 (Drenagem Quadra C), Operador de máquina 2 (Drenagem Quadra C);
         MO indireta Mestre 1, Encarregado 2, Vigia 1;
         Terceirizado Hidro Itu Ltda Encanador 5 (Rede de água Quadra B) → total 23
- 09/10: não lançado (para mostrar a faixa de alerta)
- dias de 21/09 a 07/10 com totais entre 18 e 26

AVISOS (obra 1)
- (fixado) "DDS toda segunda às 7h" — Carlos — 01/10
- "Visita da prefeitura na quinta 15/10" — Fernanda — 07/10
- "Chuva prevista para sábado" — Rafael — 08/10
```

## Critérios de aceite

- [ ] O sistema abre no Painel (Gerente, Coordenador, Engenheiro), na tela Hoje (Mestre) e no Painel do cliente (Cliente).
- [ ] Usuário Pendente só vê "Aguardando liberação".
- [ ] Trocar a obra no seletor muda todos os blocos do Painel para a obra escolhida.
- [ ] O Engenheiro e o Mestre só veem no seletor as obras em que estão vinculados.
- [ ] A curva S mostra previsto e realizado com os dados de exemplo; o realizado para em hoje.
- [ ] A faixa "Efetivo de hoje ainda não lançado" aparece depois das 10h quando não há efetivo do dia, e some ao salvar.
- [ ] "Copiar de ontem" preenche o efetivo de hoje com as linhas do último dia lançado.
- [ ] O efetivo não salva linha de MO direta ou Terceirizado sem atividade, nem Terceirizado sem empresa.
- [ ] Lançar avanço faz o % aparecer no cartão e no Cronograma sem recarregar a página, e o lançamento anterior continua no histórico.
- [ ] Importar um XML de exemplo mostra o resumo (atividades, locais, serviços) antes de gravar; Cancelar não grava nada.
- [ ] Um arquivo que não é XML do Project mostra a mensagem de erro e não grava nada.
- [ ] Na linha de balanço, cada serviço aparece com uma cor, previsto tracejado e realizado cheio; o atraso da Quadra A > Rede de água aparece em vermelho.
- [ ] No quadro de 3 meses, a atividade com restrição aberta fica vermelha; ao marcar a restrição como removida, fica verde.
- [ ] Marcar uma tarefa como "Não feito" exige o motivo.
- [ ] O Mestre não vê botão de criar restrição, criar tarefa, importar cronograma ou excluir.
- [ ] O Cliente não vê restrições, planejamento, efetivo, avisos, observações nem quem lançou.
- [ ] Só o Gerente vê o menu Usuários e os botões Excluir.
- [ ] Todas as telas funcionam no celular sem rolagem horizontal (no celular, o Gantt não aparece; o quadro de 3 meses mostra uma semana por vez).
- [ ] Cada lista tem estado vazio com texto próprio.
- [ ] Os textos das listas fechadas (situação, tipo, motivo, perfil) são idênticos aos do PRD-BACKEND.

## A conta que vai chegar depois

- `[PENDENTE: um XML real do MS Project de cada obra]` — sem ele, a importação é construída em cima de um arquivo de exemplo; testar com o real logo no começo.
- `[PENDENTE: como o médio e o curto prazo são feitos hoje]` — as telas de planejamento seguem o método Last Planner; podem precisar de ajuste no primeiro uso.
- `[PENDENTE: horas por dia gastas na análise de cronograma]` — sem esse número, não dá para medir o ganho.

## Decidir depois de usar

- `[DESCOBRIR NO USO: se o médio prazo também precisa ser montado pelo celular]` — por enquanto: montado no computador, consultado no celular.
- `[DESCOBRIR NO USO: se o peso da curva S deveria ser por custo]` — por enquanto: peso pela duração na linha de base.
