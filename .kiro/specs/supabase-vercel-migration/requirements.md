# Requirements Document

## Introduction

Esta especificação cobre a migração do aplicativo "Treine Bem" de persistência local (LocalStorage) para uma stack em nuvem com Supabase PostgreSQL, Prisma ORM, Supabase Auth e deploy na Vercel. O objetivo principal é permitir que o usuário acesse seus dados sincronizados a partir de qualquer dispositivo (celular ou desktop), mantendo todas as funcionalidades existentes, o design responsivo e o dark mode.

A migração é dividida em sete partes: preparação para deploy, criação do schema no banco, configuração do Prisma, autenticação, migração do StorageService, variáveis de ambiente e validação do deploy completo.

---

## Glossary

- **App**: A aplicação "Treine Bem" como um todo.
- **Vercel**: Plataforma de hospedagem para aplicações Next.js.
- **Supabase**: Plataforma BaaS (Backend as a Service) que fornece PostgreSQL gerenciado, autenticação e APIs.
- **Supabase_Auth**: Módulo de autenticação do Supabase, responsável por login, cadastro e sessão do usuário.
- **Supabase_DB**: Banco de dados PostgreSQL gerenciado pelo Supabase.
- **Prisma**: ORM (Object-Relational Mapper) para TypeScript/Node.js, responsável por modelagem de schema, migrations e acesso ao banco.
- **Prisma_Client**: Instância gerada pelo Prisma para executar queries tipadas no banco.
- **Storage_Service**: Interface TypeScript que abstrai todas as operações de leitura e escrita de dados do App.
- **LocalStorage_Adapter**: Implementação atual do Storage_Service que persiste dados no LocalStorage do navegador.
- **Supabase_Adapter**: Nova implementação do Storage_Service que persiste dados no Supabase_DB via Prisma_Client.
- **Auth_Guard**: Mecanismo de proteção de rotas que redireciona usuários não autenticados para a tela de login.
- **Session**: Objeto que representa a sessão autenticada do usuário, gerenciado pelo Supabase_Auth.
- **Migration**: Script Prisma que aplica alterações incrementais ao schema do banco de dados.
- **Seed**: Script que popula o banco com dados iniciais (plano semanal padrão) para um novo usuário.
- **DATABASE_URL**: Variável de ambiente com a string de conexão ao Supabase_DB via Prisma (connection pooling).
- **DIRECT_URL**: Variável de ambiente com a string de conexão direta ao Supabase_DB (usada para migrations).
- **NEXT_PUBLIC_SUPABASE_URL**: Variável de ambiente pública com a URL do projeto Supabase.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Variável de ambiente pública com a chave anônima do Supabase.
- **SUPABASE_SERVICE_ROLE_KEY**: Variável de ambiente secreta com a chave de serviço do Supabase (acesso administrativo).
- **SSR**: Server-Side Rendering — renderização de componentes React no servidor pelo Next.js.
- **Client_Component**: Componente React marcado com `"use client"` que executa no navegador.
- **Server_Component**: Componente React que executa exclusivamente no servidor (padrão no App Router do Next.js).
- **Plano_Semanal_Padrão**: Plano de treino pré-configurado com os sete dias da semana, carregado automaticamente para novos usuários.
- **Row_Level_Security**: Política de segurança do PostgreSQL que restringe acesso a linhas com base no usuário autenticado.

---

## Requirements

### Requirement 1: Preparação para Deploy na Vercel

**User Story:** Como desenvolvedor, quero que o projeto passe no build de produção sem erros, para que o deploy na Vercel seja bem-sucedido.

#### Acceptance Criteria

1. WHEN o comando `npm run build` é executado, THE App SHALL concluir o build sem erros de compilação TypeScript, erros de lint ou falhas de renderização SSR.
2. THE App SHALL marcar com `"use client"` todos os componentes que utilizam hooks de estado (`useState`, `useReducer`), efeitos (`useEffect`, `useLayoutEffect`) ou APIs exclusivas do navegador (`window`, `localStorage`, `document`).
3. THE App SHALL garantir que nenhum Server_Component importe ou execute código que dependa de APIs do navegador.
4. THE App SHALL disponibilizar um arquivo `.env.example` na raiz do projeto contendo todas as variáveis de ambiente necessárias com valores de exemplo (sem valores reais).
5. THE App SHALL disponibilizar um `README.md` atualizado com instruções passo a passo para: executar o projeto localmente, criar um projeto no Supabase, configurar as variáveis de ambiente, subir o código para o GitHub e realizar o deploy na Vercel.
6. IF o build falhar por ausência de variáveis de ambiente obrigatórias, THEN THE App SHALL exibir mensagens de erro descritivas indicando quais variáveis estão faltando.

---

### Requirement 2: Schema do Banco de Dados

**User Story:** Como desenvolvedor, quero um schema PostgreSQL bem definido no Supabase, para que todos os dados do App sejam persistidos de forma estruturada e segura na nuvem.

#### Acceptance Criteria

1. THE Supabase_DB SHALL conter a tabela `users` com as colunas: `id` (UUID, chave primária), `email` (texto único, não nulo), `name` (texto, não nulo), `created_at` (timestamp com timezone, padrão `now()`).
2. THE Supabase_DB SHALL conter a tabela `goals` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `initial_weight` (decimal), `current_weight` (decimal), `target_weight` (decimal), `daily_water_liters` (decimal), `weekly_workouts` (inteiro), `weekly_cardio_minutes` (inteiro), `created_at` (timestamp), `updated_at` (timestamp).
3. THE Supabase_DB SHALL conter a tabela `weekly_plans` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `day_of_week` (texto, não nulo), `day_type` (texto, não nulo), `title` (texto), `created_at` (timestamp), `updated_at` (timestamp).
4. THE Supabase_DB SHALL conter a tabela `exercises` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `weekly_plan_id` (UUID, chave estrangeira para `weekly_plans.id`), `name` (texto, não nulo), `muscle_group` (texto, não nulo), `planned_sets` (inteiro), `planned_reps` (texto), `planned_weight` (decimal, opcional), `rest_seconds` (inteiro, opcional), `notes` (texto, opcional), `order_index` (inteiro, não nulo), `created_at` (timestamp), `updated_at` (timestamp).
5. THE Supabase_DB SHALL conter a tabela `daily_logs` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `date` (data, não nulo), `weight` (decimal, opcional), `water_liters` (decimal, opcional), `trained` (booleano, não nulo), `followed_plan` (booleano, não nulo), `did_something_different` (booleano, não nulo), `different_description` (texto, opcional), `notes` (texto, opcional), `created_at` (timestamp), `updated_at` (timestamp).
6. THE Supabase_DB SHALL conter a tabela `exercise_executions` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `daily_log_id` (UUID, chave estrangeira para `daily_logs.id`), `exercise_id` (UUID, chave estrangeira para `exercises.id`, opcional), `exercise_name` (texto, não nulo — snapshot do nome no momento da execução), `sets_completed` (inteiro), `reps_completed` (inteiro), `weight_used` (decimal, opcional), `completed` (booleano, não nulo), `notes` (texto, opcional), `created_at` (timestamp), `updated_at` (timestamp).
7. THE Supabase_DB SHALL conter a tabela `cardio_logs` com as colunas: `id` (UUID, chave primária), `user_id` (UUID, chave estrangeira para `users.id`), `daily_log_id` (UUID, chave estrangeira para `daily_logs.id`), `type` (texto, não nulo), `duration_minutes` (inteiro, não nulo), `notes` (texto, opcional), `created_at` (timestamp).
8. THE Supabase_DB SHALL aplicar Row_Level_Security em todas as tabelas, garantindo que cada usuário acesse apenas as linhas onde `user_id` corresponde ao seu próprio identificador de sessão.
9. WHEN uma linha é excluída da tabela `users`, THE Supabase_DB SHALL excluir em cascata todas as linhas relacionadas nas tabelas `goals`, `weekly_plans`, `exercises`, `daily_logs`, `exercise_executions` e `cardio_logs`.

---

### Requirement 3: Configuração do Prisma

**User Story:** Como desenvolvedor, quero usar o Prisma ORM para modelar o schema e executar migrations, para que as alterações no banco sejam versionadas e reproduzíveis em qualquer ambiente.

#### Acceptance Criteria

1. THE App SHALL conter o arquivo `prisma/schema.prisma` com o provider configurado como `postgresql` e a `url` lida da variável de ambiente `DATABASE_URL`.
2. THE App SHALL configurar o `directUrl` no `prisma/schema.prisma` lido da variável de ambiente `DIRECT_URL`, necessário para execução de migrations no Supabase com connection pooling.
3. THE Prisma_Client SHALL ser gerado a partir do schema e disponibilizado como singleton em `src/lib/prisma.ts`, reutilizando a instância existente em ambiente de desenvolvimento para evitar múltiplas conexões.
4. THE App SHALL conter migrations versionadas em `prisma/migrations/` que reproduzam o schema completo descrito no Requirement 2 a partir de um banco vazio.
5. THE App SHALL conter o arquivo `prisma/seed.ts` que, ao ser executado, popula o banco com o Plano_Semanal_Padrão para o usuário especificado, contendo: Segunda (Peito+Tríceps+Cardio), Terça (Costas+Bíceps+Cardio), Quarta (Luta), Quinta (Perna+Cardio), Sexta (Ombro+Abdômen+Cardio), Sábado (Luta), Domingo (Descanso).
6. THE App SHALL configurar o script `prisma db seed` no `package.json` apontando para `prisma/seed.ts`.
7. WHEN o comando `npx prisma migrate deploy` é executado em um banco vazio, THE Prisma SHALL aplicar todas as migrations e deixar o schema no estado esperado sem erros.
8. WHEN o comando `npx prisma generate` é executado, THE Prisma SHALL gerar o Prisma_Client tipado compatível com o schema atual.

---

### Requirement 4: Autenticação com Supabase Auth

**User Story:** Como usuário, quero criar uma conta e fazer login com email e senha, para que meus dados sejam privados e acessíveis apenas por mim em qualquer dispositivo.

#### Acceptance Criteria

1. THE App SHALL disponibilizar uma tela de login com campos de email e senha e botão de entrar.
2. THE App SHALL disponibilizar uma tela de cadastro com campos de nome, email e senha e botão de criar conta.
3. WHEN o usuário submete o formulário de cadastro com dados válidos, THE Supabase_Auth SHALL criar uma nova conta de usuário e THE App SHALL redirecionar o usuário para a tela principal.
4. WHEN o usuário submete o formulário de login com credenciais válidas, THE Supabase_Auth SHALL iniciar uma Session e THE App SHALL redirecionar o usuário para o Dashboard.
5. IF o usuário submete o formulário de login com credenciais inválidas, THEN THE App SHALL exibir uma mensagem de erro descritiva sem redirecionar.
6. IF o usuário submete o formulário de cadastro com um email já cadastrado, THEN THE App SHALL exibir uma mensagem de erro informando que o email já está em uso.
7. THE App SHALL disponibilizar um botão de logout acessível em todas as telas internas que, ao ser acionado, encerra a Session e redireciona o usuário para a tela de login.
8. WHILE o usuário não possui uma Session ativa, THE Auth_Guard SHALL redirecionar qualquer acesso a rotas internas para a tela de login.
9. WHILE o usuário possui uma Session ativa, THE Auth_Guard SHALL permitir acesso às rotas internas e impedir acesso às telas de login e cadastro.
10. THE App SHALL persistir a Session entre recarregamentos de página, de modo que o usuário não precise fazer login novamente ao reabrir o App.
11. THE App SHALL garantir que cada usuário visualize e modifique apenas os próprios dados, sem acesso aos dados de outros usuários.

---

### Requirement 5: Migração do StorageService para Supabase

**User Story:** Como desenvolvedor, quero um novo adaptador Supabase que implemente a interface StorageService existente, para que todos os hooks e componentes continuem funcionando sem alterações após a migração.

#### Acceptance Criteria

1. THE App SHALL manter a interface `StorageService` definida em `src/types/index.ts` sem alterações estruturais, preservando todos os métodos existentes.
2. THE App SHALL criar o `Supabase_Adapter` em `src/lib/storage/supabase.adapter.ts` implementando todos os métodos da interface `StorageService`: `getWeeklyPlan`, `saveWeeklyPlan`, `addExercise`, `updateExercise`, `removeExercise`, `reorderExercises`, `getDailyLog`, `saveDailyLog`, `getDailyLogs`, `getExerciseExecutions`, `saveExerciseExecution`, `getGoals` e `saveGoals`.
3. THE Supabase_Adapter SHALL utilizar o Prisma_Client para todas as operações de leitura e escrita no Supabase_DB.
4. THE Supabase_Adapter SHALL filtrar todas as queries pelo `user_id` da Session ativa, garantindo isolamento de dados entre usuários.
5. THE App SHALL atualizar o hook `useStorage` para instanciar o `Supabase_Adapter` quando uma Session estiver ativa.
6. THE App SHALL manter o `LocalStorage_Adapter` como fallback para execução sem Session ativa (ex: desenvolvimento local sem banco configurado).
7. WHEN o `Supabase_Adapter` executa `getWeeklyPlan` para um usuário sem plano cadastrado, THE Supabase_Adapter SHALL retornar o Plano_Semanal_Padrão e persistir o plano no banco para o usuário.
8. THE App SHALL garantir que nenhum componente de UI acesse o Prisma_Client ou o Supabase_DB diretamente — todo acesso deve ocorrer exclusivamente através da interface `StorageService`.
9. WHEN o `Supabase_Adapter` executa `reorderExercises`, THE Supabase_Adapter SHALL atualizar o campo `order_index` de cada exercício no banco de acordo com a nova ordem fornecida.
10. THE Supabase_Adapter SHALL converter os tipos TypeScript do App (camelCase) para os nomes de colunas do banco (snake_case) e vice-versa em todas as operações.
11. IF uma operação do Supabase_Adapter falhar por erro de rede ou banco, THEN THE Supabase_Adapter SHALL lançar um `StorageError` tipado, mantendo o mesmo contrato de erro do `LocalStorage_Adapter`.

---

### Requirement 6: Variáveis de Ambiente

**User Story:** Como desenvolvedor, quero que todas as credenciais e configurações sensíveis sejam gerenciadas por variáveis de ambiente, para que o projeto possa ser executado em diferentes ambientes sem expor segredos no código-fonte.

#### Acceptance Criteria

1. THE App SHALL ler as seguintes variáveis de ambiente obrigatórias para funcionamento com Supabase: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
2. THE App SHALL garantir que o arquivo `.env` (com valores reais) esteja listado no `.gitignore` e nunca seja commitado no repositório.
3. THE App SHALL disponibilizar o arquivo `.env.example` com todas as variáveis listadas e valores de exemplo não-funcionais (ex: `DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"`).
4. THE App SHALL validar a presença das variáveis de ambiente obrigatórias na inicialização do servidor, exibindo erro descritivo se alguma estiver ausente.
5. WHEN as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão definidas, THE App SHALL inicializar o cliente Supabase no lado do cliente para gerenciamento de Session.
6. WHEN a variável `DATABASE_URL` está definida, THE Prisma_Client SHALL utilizar essa string de conexão para todas as queries ao Supabase_DB.

---

### Requirement 7: Deploy e Validação na Vercel

**User Story:** Como usuário, quero acessar o App publicado na Vercel com minha conta, para que eu possa usar o App no celular e no desktop com dados sincronizados na nuvem.

#### Acceptance Criteria

1. WHEN o código é enviado para o repositório GitHub configurado na Vercel, THE Vercel SHALL executar `npm run build` e publicar a nova versão automaticamente.
2. THE App SHALL funcionar corretamente no ambiente de produção da Vercel com todas as variáveis de ambiente configuradas no painel da Vercel.
3. THE README.md SHALL documentar o passo a passo para configurar as variáveis de ambiente no painel da Vercel, incluindo os nomes exatos de cada variável.
4. THE README.md SHALL documentar o comando para executar migrations no banco de produção: `npx prisma migrate deploy`.
5. WHEN um usuário acessa o App publicado na Vercel sem Session ativa, THE Auth_Guard SHALL redirecionar para a tela de login.
6. WHEN um usuário cria uma conta, faz login, registra peso, registra um treino, altera o plano semanal e acessa o histórico, THE App SHALL exibir todos os dados persistidos corretamente em cada tela.
7. WHEN o mesmo usuário acessa o App em um segundo dispositivo após login, THE App SHALL exibir os mesmos dados registrados no primeiro dispositivo.
8. THE App SHALL manter o design responsivo mobile-first, o dark mode e todas as funcionalidades existentes após o deploy na Vercel.
9. IF o build da Vercel falhar, THE Vercel SHALL exibir os logs de erro e não publicar a versão com falha.

---

### Requirement 8: Preservação de Funcionalidades Existentes

**User Story:** Como usuário, quero que todas as funcionalidades que já existem no App continuem funcionando após a migração, para que eu não perca nenhum recurso que já utilizo.

#### Acceptance Criteria

1. THE App SHALL manter todas as telas existentes: Dashboard, Treino do Dia, Histórico, Plano Semanal e Metas.
2. THE App SHALL manter o design mobile-first com dark mode como tema padrão após a migração.
3. THE App SHALL manter o menu de navegação inferior em dispositivos móveis e o menu lateral em dispositivos desktop.
4. THE App SHALL manter todos os gráficos de evolução de peso, frequência de treinos e consumo de água funcionando com dados do Supabase_DB.
5. THE App SHALL manter o comportamento de Streak, percentual de execução semanal e média de água calculados a partir dos dados do Supabase_DB.
6. THE App SHALL manter a validação de formulários existente (Validator) sem alterações após a migração.
7. THE App SHALL manter os hooks customizados (`useWeeklyPlan`, `useDailyLog`, `useWorkout`, `useGoals`, `useDashboard`) com as mesmas assinaturas públicas após a migração.
8. WHEN o Supabase_Adapter está ativo, THE App SHALL exibir indicador visual de carregamento durante operações assíncronas de leitura e escrita no banco.
9. IF uma operação de escrita no Supabase_Adapter falhar, THEN THE App SHALL exibir uma mensagem de erro descritiva ao usuário, mantendo o mesmo comportamento de notificação de erro existente.
