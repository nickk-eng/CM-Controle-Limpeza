# Casa de Madeira — Controle de Limpeza

Aplicação web desenvolvida para organizar a rotina de limpeza do restaurante **Casa de Madeira**. A equipe pode registrar tarefas, definir responsáveis e acompanhar um checklist diário com a porcentagem de atividades concluídas.

O visual segue a identidade do projeto **CM Controle Validade**, com cores verdes, tons claros e uma interface em português adaptada para computadores e celulares.

## Funcionalidades

- Acesso restrito por uma tela de login com usuário e senha compartilhados pelos funcionários.
- Cadastro de tarefas com nome, responsável, setor, data e horário previsto.
- Edição e exclusão de tarefas, com confirmação antes da exclusão.
- Checklist para marcar tarefas como concluídas ou reabri-las.
- Registro da data e do horário de conclusão.
- Resumo diário com total de tarefas, concluídas e pendentes.
- Barra de progresso e porcentagem de conclusão do dia.
- Consulta de outros dias pelo seletor de data.
- Busca por tarefa, responsável ou setor e filtro por situação.
- Exportação das tarefas do dia para CSV.
- Armazenamento dos registros em PostgreSQL.

## Como o sistema funciona

1. O funcionário entra com as credenciais fornecidas pelo restaurante.
2. Seleciona a data que deseja consultar; inicialmente, o sistema mostra o dia atual no horário de São Paulo.
3. Cadastra uma tarefa, informa quem será responsável, o setor e o horário previsto.
4. Marca a atividade no checklist quando a limpeza estiver concluída.
5. Acompanha o progresso do dia ou exporta os registros para CSV.
6. Ao terminar, usa o botão **Sair** para encerrar o acesso.

A porcentagem considera **todas as tarefas da data selecionada**, mesmo quando a lista está filtrada. Por exemplo: 3 tarefas concluídas de um total de 4 correspondem a 75%. Dias sem tarefas mostram 0%.

Cada tarefa pertence a uma data específica. Não existe repetição automática de tarefas para os dias seguintes. O CSV inclui todas as tarefas do dia selecionado, independentemente dos filtros aplicados na tela.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Interface | HTML, CSS e JavaScript |
| Servidor e API | Node.js e Express |
| Banco de dados | PostgreSQL, conectado pelo pacote `pg` |
| Publicação | Configuração Blueprint para o Render |

O navegador envia as operações para o servidor, que verifica o login e consulta ou atualiza o PostgreSQL. As credenciais são verificadas no servidor e os registros ficam no banco de dados.

## Executar no computador

### Requisitos

- Node.js 22 ou superior e npm.
- PostgreSQL instalado e em execução.
- Um banco vazio chamado `cm_limpeza` ou outro nome de sua preferência.

O pgAdmin pode ser usado para criar e administrar o banco. Ele é uma ferramenta de gerenciamento; o serviço PostgreSQL também precisa estar funcionando.

### Instalação

1. Clone ou baixe este repositório e abra um terminal na pasta do projeto.
2. Instale as dependências:

   ```sh
   npm install
   ```

3. Crie o banco no PostgreSQL. No pgAdmin, use **Databases → Create → Database** e informe `cm_limpeza`.
4. Copie o arquivo `.env.example`, renomeie a cópia para `.env` e ajuste os valores:

   ```env
   DATABASE_URL=postgresql://postgres:SENHA_DO_BANCO@localhost:5432/cm_limpeza
   APP_USERNAME=funcionarios
   APP_PASSWORD=SENHA_DE_ACESSO_AO_SITE
   ```

   A senha do banco é a do usuário PostgreSQL. `APP_USERNAME` e `APP_PASSWORD` são as credenciais que a equipe usará na tela de login. Substitua os exemplos por seus próprios valores. Caracteres especiais no usuário ou na senha da URL do banco precisam ser codificados para uso em URLs.

5. Inicie o sistema:

   ```sh
   npm start
   ```

6. Abra **http://localhost:3000** e entre com o usuário e a senha definidos no `.env`.

O servidor cria a tabela e o índice de `schema.sql` ao iniciar. Não é necessário executar esse arquivo manualmente. O usuário do banco precisa ter permissão para criar esses objetos.

### Comandos disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm start` | Inicia o servidor e carrega o `.env`, quando existir. |
| `npm run dev` | Inicia o servidor com reinício automático ao alterar arquivos. |
| `npm run check` | Verifica a sintaxe de `server.js` e `script.js`. Não é um teste completo da aplicação. |
| `node --check login.js` | Verifica a sintaxe do JavaScript da tela de login. |

## Variáveis de ambiente

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | Endereço de conexão com o PostgreSQL. Obrigatória. |
| `APP_USERNAME` | Usuário compartilhado da equipe. Se omitido, o padrão é `funcionarios`. |
| `APP_PASSWORD` | Senha compartilhada da equipe. Obrigatória. |
| `PORT` | Porta do servidor. O padrão local é `3000`; no Render, a plataforma fornece o valor. |
| `NODE_ENV` | Em `production`, habilita a exigência de HTTPS para o cookie de sessão. O ambiente Render também ativa essa proteção automaticamente. |

**Não publique o arquivo `.env` no GitHub.** Ele está listado no `.gitignore`. O arquivo `.env.example` contém apenas exemplos e pode ser versionado. Reinicie o serviço depois de alterar as credenciais.

## Publicar no Render

O arquivo `render.yaml` descreve um serviço web e um banco PostgreSQL para esta aplicação.

1. Envie o projeto para um repositório no GitHub, mantendo `render.yaml` na raiz. Não envie `.env` ou `node_modules`.
2. No [painel do Render](https://dashboard.render.com/), escolha **New → Blueprint**.
3. Conecte o GitHub e selecione o repositório.
4. Revise os serviços e planos apresentados.
5. Quando solicitado, preencha `APP_PASSWORD` com a senha que será fornecida aos funcionários.
6. Confirme a publicação e aguarde o serviço ficar disponível.
7. Abra a URL gerada e entre com o usuário `funcionarios` e a senha configurada.

O Blueprint define `APP_USERNAME=funcionarios` e conecta `DATABASE_URL` automaticamente ao banco criado no Render. Para mudar as credenciais de um serviço já publicado, abra **Environment** no serviço, ajuste as variáveis e aplique uma nova implantação.

Não use uma `DATABASE_URL` com `localhost` na publicação: esse endereço aponta para a própria máquina onde o servidor está executando, e não para o banco do seu computador.

O Blueprint usa planos gratuitos. Pelas regras consultadas do Render, bancos PostgreSQL gratuitos expiram após **30 dias** e há limite de **um banco gratuito ativo por workspace**. Confira as condições atuais antes de publicar e planeje um banco adequado para o uso contínuo do restaurante. Consulte a [documentação dos planos gratuitos](https://render.com/docs/free) e a [documentação de Blueprints](https://render.com/docs/infrastructure-as-code).

## Login e acesso da equipe

- O sistema usa um único usuário e senha compartilhados, sem cadastro público ou contas individuais.
- A sessão dura até 8 horas. O botão **Sair** a encerra imediatamente.
- As sessões ficam na memória do servidor. Reiniciar o serviço exige um novo login, mas não apaga as tarefas do PostgreSQL.
- Este modelo de sessão foi preparado para uma única instância do servidor.
- Dez tentativas incorretas do mesmo endereço bloqueiam novas tentativas por 15 minutos.
- As páginas do sistema e a API de tarefas exigem uma sessão válida.

O nome informado no campo **Responsável** identifica quem deve executar a tarefa; não representa uma conta de usuário. O sistema não mantém uma trilha de auditoria individual de quem realizou cada alteração.

## Banco de dados

A tabela `tarefas` armazena:

| Campo | Conteúdo |
| --- | --- |
| `id` | Identificador único da tarefa. |
| `nome` | Descrição da atividade. |
| `responsavel` | Nome do funcionário responsável. |
| `setor` | Área do restaurante. |
| `data` | Dia previsto para a atividade. |
| `horario` | Horário previsto. |
| `concluida` | Situação de conclusão. |
| `concluida_em` | Data e horário da conclusão. |

Ao reabrir uma tarefa, o horário de conclusão é removido. Uma nova conclusão registra um novo horário. Os horários de conclusão são exibidos no fuso de São Paulo.

Mantenha backups do PostgreSQL. O CSV serve como uma cópia dos registros do dia escolhido; não substitui um backup completo e o sistema não possui importação de CSV.

## Estrutura do projeto

```text
.
├── index.html        # Página do checklist
├── login.html        # Tela de acesso dos funcionários
├── style.css         # Estilos compartilhados
├── script.js         # Cadastro, checklist, filtros e exportação
├── login.js          # Formulário de login
├── server.js         # Servidor, autenticação e API
├── schema.sql        # Criação da tabela e do índice
├── package.json      # Dependências e comandos
├── render.yaml       # Configuração para publicação
├── .env.example      # Modelo de variáveis de ambiente
├── .gitignore        # Arquivos excluídos do versionamento
└── README.md         # Documentação
```

## Dúvidas comuns

**O servidor informa que faltam variáveis.**  
Configure `DATABASE_URL` e `APP_PASSWORD` no `.env` local ou no ambiente do serviço no Render.

**O sistema não conecta ao banco.**  
Confira se o PostgreSQL está ativo, se o banco existe e se o endereço, usuário e senha da conexão estão corretos. No Render, confira também se o banco está disponível e não expirou.

**O login informa usuário ou senha incorretos.**  
Use os valores de `APP_USERNAME` e `APP_PASSWORD`, respeitando maiúsculas e minúsculas. A senha do site é diferente da senha do PostgreSQL.

**As tarefas de outro funcionário não apareceram.**  
Confira a data e os filtros. Atualize a página para carregar alterações feitas por outra pessoa; a aplicação não atualiza os registros em tempo real.

**Como verificar se o serviço está conectado ao banco?**  
O endereço `/health` retorna sucesso quando o servidor consegue consultar o PostgreSQL. Esse endpoint não exibe as tarefas nem exige login.
