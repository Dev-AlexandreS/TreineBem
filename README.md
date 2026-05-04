# Treine Bem

Aplicativo de controle de treino e evolução física, construído com **Next.js 14 App Router**, **TypeScript**, **Tailwind CSS**, **Prisma ORM** e **Supabase** (PostgreSQL + Auth). Deploy na **Vercel**.

---

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração local](#configuração-local)
3. [Criando um projeto no Supabase](#criando-um-projeto-no-supabase)
4. [Variáveis de ambiente](#variáveis-de-ambiente)
5. [Rodando localmente](#rodando-localmente)
6. [Deploy na Vercel](#deploy-na-vercel)
7. [Migrações em produção](#migrações-em-produção)

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior (ou pnpm/yarn equivalente)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta na [Vercel](https://vercel.com) (gratuita)
- Conta no [GitHub](https://github.com)

---

## Configuração local

```bash
# 1. Clone o repositório
git clone https://github.com/Dev-AlexandreS/treine-bem.git
cd treine-bem

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env.local
```

Edite `.env.local` preenchendo os valores reais (veja a seção [Variáveis de ambiente](#variáveis-de-ambiente)).

---

## Criando um projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New project** e preencha nome, senha do banco e região.
3. Aguarde o projeto ser provisionado (cerca de 1 minuto).
4. No painel do projeto, vá em **Settings → Database** para obter as strings de conexão.
5. Em **Settings → API** você encontra a `URL` e as chaves `anon` e `service_role`.

---

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (desenvolvimento) e preencha cada variável:

| Variável | Onde encontrar |
|---|---|
| `DATABASE_URL` | Settings → Database → Connection string → **URI** (modo *Transaction* / pgBouncer) |
| `DIRECT_URL` | Settings → Database → Connection string → **URI** (modo *Session* / direto) |
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → **Project URL** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → **anon / public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → **service_role** (mantenha em segredo) |

> **Atenção:** nunca commite `.env.local` ou qualquer arquivo com valores reais. O `.gitignore` já os exclui.

---

## Rodando localmente

```bash
# Aplica as migrações Prisma no banco de desenvolvimento
npx prisma migrate dev

# Inicia o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

---

## Deploy na Vercel

### 1. Suba o código para o GitHub

```bash
git add .
git commit -m "chore: initial commit"
git push origin main
```

### 2. Importe o projeto na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e clique em **Import Git Repository**.
2. Selecione o repositório `treine-bem`.
3. Na etapa **Configure Project**, expanda **Environment Variables** e adicione as cinco variáveis listadas acima com os valores de produção do Supabase.
4. Clique em **Deploy**.

A Vercel detecta automaticamente o Next.js e configura o build.

### 3. Variáveis de ambiente na Vercel

Você também pode gerenciar as variáveis depois do deploy em:
**Project → Settings → Environment Variables**

Certifique-se de que as variáveis estão disponíveis nos ambientes **Production**, **Preview** e **Development** conforme necessário.

---

## Migrações em produção

Após o deploy (ou sempre que houver novas migrações), execute o comando abaixo para aplicar as migrações no banco de produção:

```bash
# Substitua a URL pela sua DATABASE_URL de produção (conexão direta, sem pgBouncer)
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE" \
  npx prisma migrate deploy
```

Ou, se preferir, configure a variável de ambiente localmente e rode:

```bash
npx prisma migrate deploy
```

> `prisma migrate deploy` aplica apenas migrações pendentes e é seguro para produção — não cria nem descarta nada além do que está nos arquivos de migração.

---

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run start` | Inicia o servidor de produção (requer build) |
| `npm run lint` | Executa o ESLint |
| `npm test` | Executa os testes com Vitest |
| `npx prisma studio` | Abre o Prisma Studio para inspecionar o banco |
| `npx prisma migrate dev` | Cria e aplica migrações em desenvolvimento |
| `npx prisma migrate deploy` | Aplica migrações pendentes em produção |
