# PRD Backend — ObraPrime

> Especificação dos dados e das permissões. Lido na etapa de criar o banco no Supabase.
> O SQL não está aqui: ele é escrito na hora de construir, a partir desta descrição.
> Fonte das decisões: `PLANO-DO-PROJETO.md`. Quando algo mudar na construção, este arquivo é atualizado junto.

## Convenções

- Tabelas no plural, em minúsculo, sem acento, com underline.
- Colunas em minúsculo com underline.
- Toda tabela tem `id` (uuid gerado pelo banco) e `created_at` (timestamptz, automático).
- Chave estrangeira termina em `_id`.
- Campo de lista fechada vira CHECK, e o texto tem que ser **idêntico** ao usado na interface (com acento e maiúscula exatamente como está aqui).
- Datas como `date` ou `timestamptz`. Percentuais como `numeric(5,2)`. A v1 não guarda dinheiro.
- Foto vai para o Storage; o banco guarda só o link.
- Fuso horário de referência: America/Sao_Paulo.

---

## Unidade principal

**Obra.** Vai existir mais de uma: **sim** (hoje 2, loteamento e stand de vendas). Alguém trabalha em mais de uma ao mesmo tempo: **sim**.

- Tabela `obras`.
- Coluna `obra_id` em **toda** tabela que pertence a uma obra: `atividades`, `avancos`, `restricoes`, `tarefas`, `efetivos`, `avisos`.
- Tabela `membros` (obra, pessoa) dizendo quem trabalha em qual obra.
- **Gerente e Coordenador** enxergam todas as obras sem precisar estar em `membros`. **Engenheiro, Mestre e Cliente** só as obras em que estão em `membros`.

Neste documento, "tem acesso à obra" significa: perfil Gerente ou Coordenador ativo, **ou** perfil Engenheiro/Mestre/Cliente ativo com linha em `membros` para aquela obra.

---

## Tabela `profiles`

Liga o login à pessoa e guarda o perfil dela. É ela que manda nas permissões.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave; é o próprio código do login (a mesma pessoa) |
| nome | text | sim | |
| email | text | sim | único |
| role | text | sim | CHECK: 'Pendente', 'Gerente', 'Coordenador', 'Engenheiro', 'Mestre', 'Cliente'. Padrão 'Pendente' |
| ativo | boolean | sim | padrão true; false = bloqueado (não vê nada) |
| created_at | timestamptz | sim | automático |

Criado automaticamente por um gatilho quando alguém se cadastra, com `role = 'Pendente'`. **Exceção:** se ainda não existe nenhum profile com `role = 'Gerente'`, o novo cadastro entra como 'Gerente' (é assim que o primeiro usuário consegue administrar).

**Regra de negócio:** perfil 'Pendente' ou `ativo = false` não enxerga nenhuma tabela além do próprio profile.

---

## Tabela `obras`

Para que serve: cada obra (a unidade principal).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| nome | text | sim | |
| cliente | text | não | nome do cliente (texto livre) |
| tipo | text | sim | CHECK: 'Loteamento', 'Stand de vendas', 'Outro' |
| cidade | text | não | |
| data_inicio | date | não | |
| data_termino_prevista | date | não | |
| status | text | sim | CHECK: 'Em andamento', 'Paralisada', 'Concluída'. Padrão 'Em andamento' |
| revisao_atual | integer | sim | padrão 0; sobe 1 a cada importação de cronograma |
| importado_em | timestamptz | não | data da última importação |
| created_at | timestamptz | sim | automático |

**Relações:** tem várias `atividades`, `avancos`, `restricoes`, `tarefas`, `efetivos`, `avisos`, `membros`.
**Índices úteis:** `status`.
**Regra de negócio:** apagar uma obra apaga em cascata tudo o que pertence a ela.

---

## Tabela `membros`

Para que serve: quem trabalha em qual obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras (apaga em cascata) |
| profile_id | uuid | sim | → profiles (apaga em cascata) |
| created_at | timestamptz | sim | automático |

**Índices úteis:** único em (`obra_id`, `profile_id`); `profile_id`.

---

## Tabela `atividades`

Para que serve: cada linha do cronograma importado do MS Project.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| uid_project | integer | sim | UID da tarefa no MS Project |
| parent_id | uuid | não | → atividades (a mãe na EAP) |
| eap | text | sim | ex.: '1.2.3' (OutlineNumber) |
| nivel | integer | sim | OutlineLevel |
| nome | text | sim | |
| resumo | boolean | sim | true = tem filhas; não recebe avanço |
| local | text | não | só folhas. Folha com " - " no nome: texto depois do último " - " (ex.: 'Rua 03, 04 e 06'); sem " - ": nome da mãe (ex.: 'Quadra A') |
| servico | text | não | só folhas. Folha com " - ": nome da mãe (ex.: 'SUBLEITO'); sem " - ": nome da própria folha (ex.: 'Drenagem') |
| inicio_base | date | sim | linha de base atual (Baseline 0); se o arquivo não tem, = inicio_previsto |
| termino_base | date | sim | idem |
| inicio_base_original | date | sim | linha de base da **primeira** importação; nunca é atualizado |
| termino_base_original | date | sim | idem |
| inicio_previsto | date | sim | Start atual do Project |
| termino_previsto | date | sim | Finish atual do Project |
| duracao_dias | numeric(10,2) | sim | usado como peso da curva S |
| percentual_realizado | numeric(5,2) | sim | padrão 0; cópia do último avanço (mantido pelo banco) |
| inicio_real | date | não | data do primeiro avanço > 0 (mantido pelo banco) |
| termino_real | date | não | data do avanço que chegou a 100 (mantido pelo banco) |
| revisao_importada | integer | sim | revisão em que entrou ou foi atualizada |
| removida_na_revisao | integer | não | preenchida quando a atividade sumiu do arquivo numa reimportação |
| created_at | timestamptz | sim | automático |

**Relações:** pertence a `obras`; tem vários `avancos`, `restricoes`, `tarefas`, `efetivos`.
**Índices úteis:** único em (`obra_id`, `uid_project`); `obra_id` + `eap`; `parent_id`; `servico`.
**Regra de negócio:**
- `percentual_realizado` entre 0 e 100.
- Na reimportação: casar por (`obra_id`, `uid_project`). Nova → inserir com `inicio_base_original`/`termino_base_original` = base atual. Existente → atualizar nome, eap, nivel, parent, resumo, local, servico, datas atuais, base atual, duração, `revisao_importada`, e limpar `removida_na_revisao`; **não** mexer em base original, percentual e datas reais. Ausente no arquivo → `removida_na_revisao` = nova revisão (não apagar: tem avanço e efetivo ligados).
- A importação inteira grava tudo ou nada (se der erro no meio, nada fica gravado e `revisao_atual` não sobe).

---

## Tabela `avancos`

Para que serve: cada lançamento de % realizado de uma atividade. Histórico: nunca sobrescreve.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | sim | → atividades; precisa ser folha (`resumo = false`) da mesma obra |
| data | date | sim | padrão hoje |
| percentual | numeric(5,2) | sim | 0 a 100 |
| observacao | text | não | |
| foto_url | text | não | caminho no Storage |
| lancado_por | uuid | sim | → profiles; preenchido com quem está logado |
| created_at | timestamptz | sim | automático |

**Índices úteis:** `atividade_id` + `data`; `obra_id` + `data`.
**Regra de negócio:** ao gravar um avanço, o banco atualiza na atividade: `percentual_realizado` = percentual do avanço mais recente (maior `data`, depois maior `created_at`); `inicio_real` = menor `data` com percentual > 0; `termino_real` = menor `data` com percentual = 100 (vazio se nenhum). Esse gatilho roda com permissão do sistema, porque o Mestre não pode editar `atividades` diretamente.

---

## Tabela `restricoes`

Para que serve: o que impede uma atividade de acontecer na semana prevista.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | sim | → atividades (folha, mesma obra) |
| tipo | text | sim | CHECK: 'Projeto', 'Material', 'Mão de obra', 'Equipamento', 'Terceirizado/contrato', 'Licença/liberação', 'Clima', 'Financeiro', 'Outro' |
| descricao | text | sim | |
| responsavel | text | sim | nome livre (pode ser alguém de fora do sistema) |
| data_limite | date | sim | |
| status | text | sim | CHECK: 'Aberta', 'Removida'. Padrão 'Aberta' |
| removida_em | date | não | obrigatória quando status = 'Removida' |
| criado_por | uuid | sim | → profiles |
| created_at | timestamptz | sim | automático |

**Índices úteis:** `obra_id` + `status` + `data_limite`; `atividade_id`.

---

## Tabela `tarefas`

Para que serve: a programação da semana e do dia (curto prazo).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| atividade_id | uuid | não | → atividades (folha, mesma obra) |
| data | date | sim | dia planejado |
| descricao | text | sim | a meta |
| responsavel | text | sim | equipe ou empresa |
| situacao | text | sim | CHECK: 'Planejada', 'Feito', 'Não feito'. Padrão 'Planejada' |
| motivo_nao_feito | text | não | CHECK: 'Restrição não removida', 'Mão de obra', 'Material', 'Clima', 'Projeto', 'Outro'. Obrigatório quando situacao = 'Não feito'; vazio nos outros casos |
| criado_por | uuid | sim | → profiles |
| created_at | timestamptz | sim | automático |

**Índices úteis:** `obra_id` + `data`.

---

## Tabela `funcoes`

Para que serve: a lista de funções do efetivo, editável pelo Gerente. Vale para todas as obras.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| nome | text | sim | único |
| tipo | text | sim | CHECK: 'MO direta', 'MO indireta' |
| ativo | boolean | sim | padrão true (desativar em vez de apagar, porque há efetivo ligado) |
| created_at | timestamptz | sim | automático |

**Carga inicial:**
- MO direta: Pedreiro, Servente, Carpinteiro, Armador, Eletricista, Encanador, Pintor, Operador de máquina, Motorista.
- MO indireta: Engenheiro, Mestre, Encarregado, Técnico de segurança, Almoxarife, Apontador, Vigia.

---

## Tabela `efetivos`

Para que serve: cada linha do efetivo do dia (quantas pessoas de qual função, empresa e atividade).

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| data | date | sim | |
| tipo | text | sim | CHECK: 'MO direta', 'MO indireta', 'Terceirizado' |
| funcao_id | uuid | sim | → funcoes |
| atividade_id | uuid | não | → atividades (folha, mesma obra). **Obrigatório** quando tipo = 'MO direta' ou 'Terceirizado' |
| empresa | text | não | **Obrigatório** quando tipo = 'Terceirizado' |
| quantidade | integer | sim | maior que 0 |
| lancado_por | uuid | sim | → profiles |
| created_at | timestamptz | sim | automático |

**Índices úteis:** `obra_id` + `data`; `atividade_id`.
**Regra de negócio:** as obrigatoriedades condicionais acima são verificadas pelo banco (CHECK), não só pela tela.

---

## Tabela `avisos`

Para que serve: o quadro de avisos de cada obra.

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| id | uuid | sim | chave |
| obra_id | uuid | sim | → obras |
| titulo | text | sim | |
| texto | text | sim | |
| fixado | boolean | sim | padrão false |
| autor_id | uuid | sim | → profiles |
| created_at | timestamptz | sim | automático |

**Índices úteis:** `obra_id` + `fixado` + `created_at`.

---

## Visão para o cliente

O Cliente **não lê a tabela `avancos` diretamente** (ela tem observação e quem lançou). Ele lê uma visão `avancos_cliente` com só: `obra_id`, `atividade_id`, nome da atividade, `data`, `percentual`, `foto_url`, filtrada pelas obras em que ele está em `membros`. A curva S do cliente é calculada a partir de `atividades` + `avancos_cliente`.

---

## Permissões

Escrito em português. Vira RLS na hora de construir. Toda regra abaixo vale só para perfil ativo (`ativo = true`) e diferente de 'Pendente'.

### `profiles`
- **Ver:** cada um vê o próprio. Gerente vê todos. Coordenador e Engenheiro veem nome e perfil das pessoas das obras a que têm acesso (para mostrar "lançado por").
- **Criar:** só pelo gatilho do cadastro.
- **Editar:** cada um edita o próprio `nome`. Só o Gerente edita `role` e `ativo` de outros. Ninguém muda o próprio `role` nem o próprio `ativo`.
- **Apagar:** ninguém pela tela.
- **Sem login:** nada.

### `obras`
- **Ver:** quem tem acesso à obra.
- **Criar / Editar / Apagar:** só Gerente.
- **Sem login:** nada.

### `membros`
- **Ver:** Gerente vê todos; cada um vê as próprias linhas.
- **Criar / Editar / Apagar:** só Gerente.
- **Sem login:** nada.

### `atividades`
- **Ver:** quem tem acesso à obra (inclusive Cliente).
- **Criar / Editar:** Gerente, Coordenador, Engenheiro — só pela importação. Os campos `percentual_realizado`, `inicio_real`, `termino_real` são mantidos pelo gatilho de `avancos`.
- **Apagar:** só Gerente.
- **Sem login:** nada.

### `avancos`
- **Ver:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra. Cliente só pela visão `avancos_cliente`.
- **Criar:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra; `lancado_por` = quem está logado.
- **Editar:** ninguém (corrige-se com novo lançamento).
- **Apagar:** só Gerente.
- **Sem login:** nada.

### `restricoes`
- **Ver:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra. Cliente não.
- **Criar / Editar:** Gerente, Coordenador, Engenheiro com acesso à obra.
- **Apagar:** só Gerente.
- **Sem login:** nada.

### `tarefas`
- **Ver:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra. Cliente não.
- **Criar:** Gerente, Coordenador, Engenheiro com acesso à obra.
- **Editar:** Gerente, Coordenador, Engenheiro: tudo. Mestre: só `situacao` e `motivo_nao_feito`.
- **Apagar:** só Gerente.
- **Sem login:** nada.

### `funcoes`
- **Ver:** todos os logados ativos.
- **Criar / Editar:** só Gerente.
- **Apagar:** ninguém (desativa).
- **Sem login:** nada.

### `efetivos`
- **Ver:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra. Cliente não.
- **Criar / Editar:** Gerente em qualquer data. Coordenador, Engenheiro e Mestre só quando `data` = hoje.
- **Apagar:** Gerente em qualquer data. Coordenador, Engenheiro e Mestre só linhas de hoje (para corrigir o lançamento do dia).
- **Sem login:** nada.

### `avisos`
- **Ver:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra. Cliente não.
- **Criar:** Gerente, Coordenador, Engenheiro com acesso à obra.
- **Editar:** o autor edita título e texto do próprio; só o Gerente muda `fixado` e edita os dos outros.
- **Apagar:** só Gerente.
- **Sem login:** nada.

### Storage (fotos)
- Pasta `avancos/<obra_id>/`.
- **Ver:** quem tem acesso à obra (inclusive Cliente).
- **Enviar:** Gerente, Coordenador, Engenheiro, Mestre com acesso à obra.
- **Apagar:** só Gerente.
- **Sem login:** nada.

---

## Fluxo de cadastro e liberação

1. A pessoa se cadastra sozinha com nome, email e senha.
2. O gatilho cria o profile com `role = 'Pendente'` (ou 'Gerente', se for o primeiro cadastro do sistema).
3. Pendente não enxerga dado nenhum e vê "Conta aguardando liberação do administrador".
4. O Gerente, na tela Usuários, escolhe o perfil e vincula as obras (linhas em `membros`).
5. Para bloquear, o Gerente marca `ativo = false`; a pessoa deixa de ver qualquer dado.

## Processos automáticos

Os dois são **calculados na hora da consulta** (quando a tela abre). Não há robô agendado no servidor.

### Alerta de efetivo não lançado
- **Gatilho:** abertura do Painel ou da tela Hoje depois das 10h (Brasília), de segunda a sábado.
- **Passos:** 1. Conferir se existe linha em `efetivos` com `obra_id` da obra e `data` = hoje. 2. Se não existe, mostrar o alerta.
- **Resultado:** faixa "Efetivo de hoje ainda não lançado" com botão "Lançar agora", para Gerente, Coordenador, Engenheiro e Mestre da obra. Some quando o efetivo é lançado.
- **Se falhar:** se a consulta falhar, o bloco de efetivo mostra "Não foi possível carregar o efetivo. Tente atualizar a página." e o alerta não aparece. Nada é perdido.

### Fechamento da semana
- **Gatilho:** a partir de segunda 6h (Brasília), toda abertura do Painel ou do Planejamento.
- **Passos:** 1. % de tarefas cumpridas da semana anterior (segunda a domingo) = tarefas com situacao 'Feito' ÷ total de tarefas da semana; as que ficaram 'Planejada' contam como não feitas. 2. Restrições 'Aberta' com `data_limite` < hoje = vencidas; com `data_limite` entre hoje e domingo = vencem nesta semana.
- **Resultado:** Painel mostra "Semana passada: X% das tarefas cumpridas" e as restrições vencidas (vermelho) e da semana (dourado). Planejamento mostra o histórico semana a semana.
- **Se falhar:** semana sem tarefas mostra "Semana passada sem tarefas planejadas" (não 0%). Se a consulta falhar, o bloco mostra "Não foi possível calcular a semana passada" e o resto do painel funciona.

## Cálculos (feitos na consulta)

- **Peso da atividade:** `duracao_dias` da folha.
- **% previsto de uma folha numa data D:** 0 se D < `inicio_base`; 100 se D ≥ `termino_base`; senão, proporcional aos dias corridos entre `inicio_base` e `termino_base`.
- **% realizado de uma folha numa data D:** `percentual` do último avanço com `data` ≤ D (0 se não houver).
- **Avanço da obra numa data D:** média ponderada pelo peso das folhas não removidas (`removida_na_revisao` vazio).
- **Curva S:** os dois valores acima no último dia de cada semana, de `min(inicio_base)` a `max(termino_base)`; realizado só até hoje.
- **Atrasada:** folha com % realizado < % previsto de hoje, ou `termino_base` < hoje e % realizado < 100.
- **Linha de balanço:** para cada `servico`, pontos (local, `inicio_base`, `termino_base`) para o previsto e (local, `inicio_real`, `termino_real` ou hoje) para o realizado. Colisão: duas linhas previstas de serviços diferentes se cruzam — num mesmo local, o serviço que começa depois termina antes do outro, ou a ordem de início dos dois troca de um local para o seguinte.

## Arquivos

- Guardados no Storage, na pasta `avancos/<obra_id>/`.
- Imagem comprimida no navegador antes de subir (máx. 1200px, qualidade 0.8).
- O banco guarda o caminho em `avancos.foto_url`.
- O XML do MS Project **não** é guardado: é lido no navegador e só os dados vão para `atividades`.

## A pergunta de um ano (dados já guardados)

- **"Qual atividade gerou mais atraso?"** — `termino_real` (ou hoje) − `termino_base_original`, por atividade; comparável entre obras por `servico`. Causas: `restricoes` e `tarefas` 'Não feito' da atividade.
- **"Qual atividade usou mais pessoas?"** — soma de `efetivos.quantidade` por `atividade_id` (pessoas × dias), separando MO direta e Terceirizado.

## Critérios de aceite

- [ ] O primeiro usuário cadastrado vira Gerente; os seguintes entram como Pendente.
- [ ] Usuário Pendente ou bloqueado não enxerga nenhum dado, em nenhuma tabela.
- [ ] Engenheiro, Mestre e Cliente não enxergam nenhum registro de obra em que não estão em `membros`.
- [ ] O Cliente não consegue ler `restricoes`, `tarefas`, `efetivos`, `avisos` nem a tabela `avancos` (só a visão `avancos_cliente`).
- [ ] O Mestre não consegue criar restrição, criar tarefa, importar cronograma, nem apagar registro nenhum, nem o próprio.
- [ ] O Mestre consegue mudar só `situacao` e `motivo_nao_feito` de uma tarefa.
- [ ] Ninguém consegue editar um avanço; só o Gerente apaga.
- [ ] Coordenador, Engenheiro e Mestre não conseguem gravar efetivo com data diferente de hoje.
- [ ] O banco recusa efetivo 'MO direta' ou 'Terceirizado' sem atividade, 'Terceirizado' sem empresa, e quantidade ≤ 0.
- [ ] O banco recusa tarefa 'Não feito' sem motivo.
- [ ] Gravar um avanço atualiza `percentual_realizado`, `inicio_real` e `termino_real` da atividade.
- [ ] Reimportar o cronograma mantém avanços e `inicio_base_original`/`termino_base_original`; atividade que sumiu fica com `removida_na_revisao` preenchido, sem ser apagada.
- [ ] Se a importação der erro no meio, nada fica gravado.
- [ ] O Gerente consegue trocar o perfil de qualquer usuário, mas ninguém troca o próprio.
- [ ] Os valores de lista fechada do banco são idênticos aos da interface.
- [ ] Todo campo obrigatório recusa cadastro vazio.
- [ ] Quem não fez login não lê nada, nem fotos.

## A conta que vai chegar depois

- `[PENDENTE: um XML real do MS Project de cada obra]` — a leitura do XML (linha de base, níveis, UID) precisa ser testada com o arquivo real logo no começo.
- `[PENDENTE: horas por dia gastas na análise de cronograma]` — sem esse número, não dá para medir o ganho.

## Decidir depois de usar

- `[DESCOBRIR NO USO: se o peso da curva S deveria ser por custo]` — por enquanto: peso por `duracao_dias`.
