# Design Document - Supabase/Vercel Migration

## Overview

This document describes the technical design for migrating "Treine Bem" from browser-local persistence (LocalStorage) to a cloud-backed stack: **Supabase PostgreSQL** as the database, **Prisma ORM** for schema management and type-safe queries, **Supabase Auth** for user authentication, and **Vercel** for hosting.

The migration is designed to be minimally invasive to the existing codebase. The key architectural decision is to keep the `StorageService` interface unchanged and introduce a new `SupabaseAdapter` that implements it. All existing hooks (`useWeeklyPlan`, `useDailyLog`, `useWorkout`, `useGoals`, `useDashboard`) and UI components remain untouched. Only `useStorage` is updated to select the correct adapter based on session state.

### Goals

- Users can access their data from any device after logging in.
- All existing features (Dashboard, Treino do Dia, Histórico, Plano Semanal, Metas) continue to work identically.
- The dark mode, responsive layout, and all calculators are preserved.
- The codebase remains type-safe end-to-end (TypeScript + Prisma generated types).
- The `LocalStorageAdapter` is kept as a fallback for local development without a database.

---

## Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React UI Pages                        │   │
│  │  Dashboard · Treino do Dia · Histórico · Plano · Metas   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │ uses                                  │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │               Custom Hooks (unchanged)                   │   │
│  │  useWeeklyPlan · useDailyLog · useWorkout                │   │
│  │  useGoals · useDashboard                                 │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │ uses                                  │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              useStorage (updated)                        │   │
│  │  Session active?  ──yes──▶  SupabaseAdapter              │   │
│  │                   ──no───▶  LocalStorageAdapter          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │ (server-side)
┌─────────────────────────▼───────────────────────────────────────┐
│                    Next.js Server / API                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SupabaseAdapter (server-side)               │   │
│  │  All StorageService methods → Prisma Client              │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Prisma Client (singleton)                   │   │
│  │              src/lib/prisma.ts                           │   │
│  └──────────────────────┬───────────────────────────────────┘   │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐   │
│  │              Next.js Middleware (Auth Guard)              │   │
│  │              middleware.ts                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Supabase (Cloud)                             │
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Supabase Auth   │    │  PostgreSQL (Supabase DB)        │   │
│  │  (sessions,      │    │  7 tables + RLS policies         │   │
│  │   JWT tokens)    │    │  Managed by Prisma migrations    │   │
│  └──────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**1. Adapter pattern preserves all hooks and UI.** The `StorageService` interface is the contract. Swapping the adapter underneath is transparent to every consumer. No hook or page needs to know whether data comes from LocalStorage or Supabase.

**2. SupabaseAdapter runs server-side only.** Prisma Client must not be bundled into the browser. The adapter is instantiated in Server Components or API Route Handlers, and data is passed down as props or via React Server Component streaming. Client Components that need to mutate data call Server Actions.

**3. useStorage selects the adapter at runtime.** When a Supabase session is present, `useStorage` returns a `SupabaseAdapter` instance. When no session is present (local dev without DB, or unauthenticated), it falls back to `LocalStorageAdapter`.

**4. Middleware handles route protection.** A single `middleware.ts` at the project root intercepts all requests, reads the Supabase session from cookies, and redirects unauthenticated users to `/login` for protected routes, and authenticated users away from `/login` and `/signup`.

**5. camelCase ↔ snake_case mapping is centralised in the adapter.** All TypeScript domain types use camelCase. All Prisma/DB column names use snake_case. The mapping is done exclusively inside `SupabaseAdapter` — no other layer is aware of the DB naming convention.

---

## Components and Interfaces

### StorageService Interface (unchanged)

The interface defined in `src/types/index.ts` is not modified. It remains the single contract between the UI layer and any persistence backend:

```typescript
export interface StorageService {
  getWeeklyPlan(): WeeklyPlan;
  saveWeeklyPlan(plan: WeeklyPlan): void;
  addExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void;
  updateExercise(dayOfWeek: DayOfWeek, exercise: Exercise): void;
  removeExercise(dayOfWeek: DayOfWeek, exerciseId: string): void;
  reorderExercises(dayOfWeek: DayOfWeek, orderedIds: string[]): void;
  getDailyLog(date: ISODateString): DailyLog | null;
  saveDailyLog(log: DailyLog): void;
  getDailyLogs(from: ISODateString, to: ISODateString): DailyLog[];
  getExerciseExecutions(date: ISODateString): ExerciseExecution[];
  saveExerciseExecution(execution: ExerciseExecution): void;
  getGoals(): Goals | null;
  saveGoals(goals: Goals): void;
}
```

Note: The current interface is synchronous. The `SupabaseAdapter` wraps async Prisma calls and exposes them through Server Actions or Server Components, so the hooks never call the adapter directly from the browser. See the Authentication Flow section for how this works.

### SupabaseAdapter

**File:** `src/lib/storage/supabase.adapter.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { defaultWeeklyPlan } from './defaultPlan';
import { StorageError } from '@/types';
import type {
  DailyLog, DayOfWeek, Exercise, ExerciseExecution,
  Goals, ISODateString, StorageService, WeeklyPlan,
} from '@/types';

export class SupabaseAdapter implements StorageService {
  constructor(private readonly userId: string) {}

  // All methods use this.userId in every Prisma where clause.
  // camelCase ↔ snake_case mapping is done in private toDb/fromDb helpers.
  // Any Prisma error is caught and re-thrown as StorageError.

  async getWeeklyPlan(): Promise<WeeklyPlan> { ... }
  async saveWeeklyPlan(plan: WeeklyPlan): Promise<void> { ... }
  async addExercise(dayOfWeek: DayOfWeek, exercise: Exercise): Promise<void> { ... }
  async updateExercise(dayOfWeek: DayOfWeek, exercise: Exercise): Promise<void> { ... }
  async removeExercise(dayOfWeek: DayOfWeek, exerciseId: string): Promise<void> { ... }
  async reorderExercises(dayOfWeek: DayOfWeek, orderedIds: string[]): Promise<void> { ... }
  async getDailyLog(date: ISODateString): Promise<DailyLog | null> { ... }
  async saveDailyLog(log: DailyLog): Promise<void> { ... }
  async getDailyLogs(from: ISODateString, to: ISODateString): Promise<DailyLog[]> { ... }
  async getExerciseExecutions(date: ISODateString): Promise<ExerciseExecution[]> { ... }
  async saveExerciseExecution(execution: ExerciseExecution): Promise<void> { ... }
  async getGoals(): Promise<Goals | null> { ... }
  async saveGoals(goals: Goals): Promise<void> { ... }
}
```

**Key implementation notes:**

- `getWeeklyPlan`: Queries `weekly_plans` joined with `exercises` for the user. If no rows exist, inserts the `defaultWeeklyPlan` and returns it (seed-on-first-access pattern).
- `reorderExercises`: Uses a Prisma `$transaction` to update `order_index` for all exercises in the given day atomically.
- `saveExerciseExecution`: Uses `upsert` on the `id` field — creates if new, updates if existing.
- `saveDailyLog`: Uses `upsert` on `(user_id, date)` — one log per user per day.
- All methods wrap Prisma calls in try/catch and re-throw as `StorageError('...', 'UNKNOWN')`.

### Supabase Client Helpers

**File:** `src/lib/supabase/client.ts` — browser-side Supabase client (for session management in Client Components):

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**File:** `src/lib/supabase/server.ts` — server-side Supabase client (for reading session in Server Components and middleware):

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, ... } }
  );
}
```

### Updated useStorage Hook

`useStorage` is updated to accept an optional `StorageService` instance (injected from a Server Component or context) rather than always using the module-level singleton:

```typescript
'use client';

import { useContext } from 'react';
import { StorageContext } from '@/lib/storage/storage.context';

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used within StorageProvider');
  return ctx;
}
```

A `StorageProvider` Server Component reads the session, instantiates the correct adapter, and passes it down via context:

```typescript
// src/lib/storage/storage.context.tsx
'use client';
import { createContext } from 'react';
import type { StorageService } from '@/types';

export const StorageContext = createContext<{
  service: StorageService;
  isLoading: boolean;
  error: StorageError | null;
  clearError: () => void;
} | null>(null);
```

### Auth Pages

New pages added:

- `src/app/(auth)/login/page.tsx` — Login form (email + password + submit).
- `src/app/(auth)/signup/page.tsx` — Signup form (name + email + password + submit).
- `src/app/(auth)/layout.tsx` — Auth layout (no nav, centered card).

Both pages are Client Components that use the browser Supabase client for `signInWithPassword` / `signUp`.

### Logout Button

A `LogoutButton` Client Component is added to the navigation components (`SideNav` and `BottomNav`). It calls `supabase.auth.signOut()` and redirects to `/login`.

---

## Data Models

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String
  created_at DateTime @default(now()) @db.Timestamptz

  goals              Goals[]
  weekly_plans       WeeklyPlan[]
  exercises          Exercise[]
  daily_logs         DailyLog[]
  exercise_executions ExerciseExecution[]
  cardio_logs        CardioLog[]

  @@map("users")
}

model Goals {
  id                    String   @id @default(uuid())
  user_id               String
  initial_weight        Decimal?
  current_weight        Decimal?
  target_weight         Decimal?
  daily_water_liters    Decimal?
  weekly_workouts       Int?
  weekly_cardio_minutes Int?
  created_at            DateTime @default(now()) @db.Timestamptz
  updated_at            DateTime @updatedAt @db.Timestamptz

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("goals")
}

model WeeklyPlan {
  id          String   @id @default(uuid())
  user_id     String
  day_of_week String
  day_type    String
  title       String?
  created_at  DateTime @default(now()) @db.Timestamptz
  updated_at  DateTime @updatedAt @db.Timestamptz

  user      User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  exercises Exercise[]

  @@unique([user_id, day_of_week])
  @@map("weekly_plans")
}

model Exercise {
  id              String   @id @default(uuid())
  user_id         String
  weekly_plan_id  String
  name            String
  muscle_group    String
  planned_sets    Int
  planned_reps    String
  planned_weight  Decimal?
  rest_seconds    Int?
  notes           String?
  order_index     Int
  created_at      DateTime @default(now()) @db.Timestamptz
  updated_at      DateTime @updatedAt @db.Timestamptz

  user        User       @relation(fields: [user_id], references: [id], onDelete: Cascade)
  weekly_plan WeeklyPlan @relation(fields: [weekly_plan_id], references: [id], onDelete: Cascade)

  @@map("exercises")
}

model DailyLog {
  id                     String   @id @default(uuid())
  user_id                String
  date                   DateTime @db.Date
  weight                 Decimal?
  water_liters           Decimal?
  trained                Boolean
  followed_plan          Boolean
  did_something_different Boolean
  different_description  String?
  notes                  String?
  created_at             DateTime @default(now()) @db.Timestamptz
  updated_at             DateTime @updatedAt @db.Timestamptz

  user                User                @relation(fields: [user_id], references: [id], onDelete: Cascade)
  exercise_executions ExerciseExecution[]
  cardio_logs         CardioLog[]

  @@unique([user_id, date])
  @@map("daily_logs")
}

model ExerciseExecution {
  id              String   @id @default(uuid())
  user_id         String
  daily_log_id    String
  exercise_id     String?
  exercise_name   String
  sets_completed  Int?
  reps_completed  Int?
  weight_used     Decimal?
  completed       Boolean
  notes           String?
  created_at      DateTime @default(now()) @db.Timestamptz
  updated_at      DateTime @updatedAt @db.Timestamptz

  user      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  daily_log DailyLog @relation(fields: [daily_log_id], references: [id], onDelete: Cascade)

  @@map("exercise_executions")
}

model CardioLog {
  id               String   @id @default(uuid())
  user_id          String
  daily_log_id     String
  type             String
  duration_minutes Int
  notes            String?
  created_at       DateTime @default(now()) @db.Timestamptz

  user      User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  daily_log DailyLog @relation(fields: [daily_log_id], references: [id], onDelete: Cascade)

  @@map("cardio_logs")
}
```

### camelCase ↔ snake_case Mapping Table

| TypeScript (camelCase)       | Database (snake_case)          | Table                |
|------------------------------|--------------------------------|----------------------|
| `muscleGroup`                | `muscle_group`                 | exercises            |
| `plannedSets`                | `planned_sets`                 | exercises            |
| `plannedReps`                | `planned_reps`                 | exercises            |
| `plannedWeight`              | `planned_weight`               | exercises            |
| `restSeconds`                | `rest_seconds`                 | exercises            |
| `orderIndex`                 | `order_index`                  | exercises            |
| `weeklyPlanId`               | `weekly_plan_id`               | exercises            |
| `waterLiters`                | `water_liters`                 | daily_logs           |
| `followedPlan`               | `followed_plan`                | daily_logs           |
| `didSomethingDifferent`      | `did_something_different`      | daily_logs           |
| `differentDescription`       | `different_description`        | daily_logs           |
| `dailyLogId`                 | `daily_log_id`                 | exercise_executions  |
| `exerciseId`                 | `exercise_id`                  | exercise_executions  |
| `exerciseName`               | `exercise_name`                | exercise_executions  |
| `setsCompleted`              | `sets_completed`               | exercise_executions  |
| `repsCompleted`              | `reps_completed`               | exercise_executions  |
| `weightUsed`                 | `weight_used`                  | exercise_executions  |
| `initialWeight`              | `initial_weight`               | goals                |
| `currentWeight`              | `current_weight`               | goals                |
| `targetWeight`               | `target_weight`                | goals                |
| `dailyWaterLiters`           | `daily_water_liters`           | goals                |
| `weeklyWorkouts`             | `weekly_workouts`              | goals                |
| `weeklyCardioMinutes`        | `weekly_cardio_minutes`        | goals                |
| `dayOfWeek`                  | `day_of_week`                  | weekly_plans         |
| `dayType`                    | `day_type`                     | weekly_plans         |
| `durationMinutes`            | `duration_minutes`             | cardio_logs          |
| `userId`                     | `user_id`                      | all tables           |
| `createdAt`                  | `created_at`                   | all tables           |
| `updatedAt`                  | `updated_at`                   | all tables           |

### Row Level Security Policies

RLS is enabled on all tables. The policy pattern for each table is:

```sql
-- Enable RLS
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rows
CREATE POLICY "Users can access own rows"
  ON <table>
  FOR ALL
  USING (user_id = auth.uid());
```

The `users` table uses `id = auth.uid()` instead of `user_id = auth.uid()`.

---

## Authentication Flow

### Signup Flow

```
User fills signup form (name, email, password)
  → Client calls supabase.auth.signUp({ email, password, options: { data: { name } } })
  → Supabase Auth creates auth.users entry
  → App inserts row into public.users (via Server Action or trigger)
  → App redirects to Dashboard
  → StorageProvider detects session → instantiates SupabaseAdapter
  → SupabaseAdapter.getWeeklyPlan() finds no plan → seeds defaultWeeklyPlan → returns it
```

### Login Flow

```
User fills login form (email, password)
  → Client calls supabase.auth.signInWithPassword({ email, password })
  → Supabase Auth validates credentials → returns Session (JWT + refresh token)
  → Session is stored in cookies (managed by @supabase/ssr)
  → App redirects to Dashboard
  → Middleware reads session from cookies on subsequent requests
```

### Session Persistence

Supabase SSR (`@supabase/ssr`) stores the session in HTTP-only cookies. The middleware refreshes the session on every request, ensuring the JWT stays valid across page reloads and browser restarts.

### Middleware (Auth Guard)

**File:** `middleware.ts` (project root)

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/', '/workout', '/history', '/plan', '/goals'];
const AUTH_ROUTES = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (keeps JWT alive)
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = PROTECTED_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### StorageProvider Pattern

The root layout wraps children in a `StorageProvider` that reads the server-side session and passes the correct adapter via React Context:

```typescript
// src/app/layout.tsx (updated)
import { createClient } from '@/lib/supabase/server';
import { StorageProvider } from '@/lib/storage/storage.provider';

export default async function RootLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="pt-BR" className="dark">
      <body>
        <StorageProvider userId={user?.id ?? null}>
          <SideNav user={user} />
          <main>{children}</main>
          <BottomNav />
        </StorageProvider>
      </body>
    </html>
  );
}
```

`StorageProvider` is a Client Component that creates the adapter instance and provides it via `StorageContext`:

```typescript
// src/lib/storage/storage.provider.tsx
'use client';

import { useMemo, useState } from 'react';
import { StorageContext } from './storage.context';
import { SupabaseAdapter } from './supabase.adapter';
import { LocalStorageStorageService } from './storage.service';

export function StorageProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [error, setError] = useState(null);

  const service = useMemo(() => {
    return userId ? new SupabaseAdapter(userId) : new LocalStorageStorageService();
  }, [userId]);

  return (
    <StorageContext.Provider value={{ service, isLoading: false, error, clearError: () => setError(null) }}>
      {children}
    </StorageContext.Provider>
  );
}
```

---

## New File Structure

Files added or modified by this migration:

```
project root
├── middleware.ts                          ← NEW: Auth Guard
├── .env.example                           ← NEW: env var template
├── prisma/
│   ├── schema.prisma                      ← NEW: Prisma schema (7 models)
│   ├── seed.ts                            ← NEW: seeds defaultWeeklyPlan
│   └── migrations/
│       └── 0001_initial/
│           └── migration.sql              ← NEW: generated by prisma migrate dev
│
src/
├── app/
│   ├── layout.tsx                         ← MODIFIED: async, adds StorageProvider
│   ├── (auth)/
│   │   ├── layout.tsx                     ← NEW: auth layout (no nav)
│   │   ├── login/
│   │   │   └── page.tsx                   ← NEW: login form
│   │   └── signup/
│   │       └── page.tsx                   ← NEW: signup form
│   └── (all existing pages unchanged)
│
├── components/
│   ├── navigation/
│   │   ├── BottomNav.tsx                  ← MODIFIED: adds LogoutButton
│   │   └── SideNav.tsx                    ← MODIFIED: adds LogoutButton
│   └── ui/
│       └── LogoutButton.tsx               ← NEW: calls supabase.auth.signOut()
│
├── hooks/
│   └── useStorage.ts                      ← MODIFIED: reads from StorageContext
│
└── lib/
    ├── prisma.ts                          ← NEW: Prisma singleton client
    ├── supabase/
    │   ├── client.ts                      ← NEW: browser Supabase client
    │   └── server.ts                      ← NEW: server Supabase client
    └── storage/
        ├── storage.context.tsx            ← NEW: React context for StorageService
        ├── storage.provider.tsx           ← NEW: StorageProvider component
        ├── supabase.adapter.ts            ← NEW: SupabaseAdapter implementation
        ├── storage.service.ts             ← UNCHANGED
        ├── localStorage.adapter.ts        ← UNCHANGED
        └── defaultPlan.ts                 ← UNCHANGED
```

### Prisma Singleton (`src/lib/prisma.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

This pattern prevents multiple PrismaClient instances during Next.js hot-reload in development (each module re-evaluation would otherwise create a new connection pool).

---

## Environment Variables

### Required Variables

| Variable                        | Used by              | Description                                                                 |
|---------------------------------|----------------------|-----------------------------------------------------------------------------|
| `DATABASE_URL`                  | Prisma (runtime)     | Supabase connection pooler URL (port 6543). Used for all Prisma queries.    |
| `DIRECT_URL`                    | Prisma (migrations)  | Supabase direct connection URL (port 5432). Required for `prisma migrate`.  |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase client      | Public URL of the Supabase project (safe to expose to browser).             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client      | Anon/public key for Supabase (safe to expose to browser, RLS enforced).     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side only     | Service role key for admin operations (never exposed to browser).           |

### `.env.example`

```bash
# Prisma / Supabase DB
# Get these from: Supabase Dashboard → Project Settings → Database → Connection string
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Auth / Client
# Get these from: Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Server-side admin (never expose to browser)
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### Startup Validation (`src/lib/env.ts`)

```typescript
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n` +
      `Copy .env.example to .env and fill in the values.`
    );
  }
}
```

`validateEnv()` is called at the top of `src/lib/prisma.ts` so it runs on first server-side import, failing fast with a clear message before any DB connection is attempted.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The project already uses `fast-check` (v4) for property-based testing. The properties below are implemented as `fast-check` property tests in Vitest.

---

### Property 1: Auth Guard routes correctly for any route and session state

*For any* protected route path, when no active session exists, the middleware SHALL redirect to `/login`. Conversely, *for any* protected route path, when an active session exists, the middleware SHALL allow the request to proceed without redirecting.

**Validates: Requirements 4.8, 4.9**

---

### Property 2: User data isolation

*For any* two distinct user IDs and any data record written by user A, querying the `SupabaseAdapter` as user B SHALL return no results that include user A's data.

**Validates: Requirements 4.11, 5.4**

---

### Property 3: All adapter queries filter by userId

*For any* `SupabaseAdapter` instance constructed with a given `userId`, every Prisma call made by any adapter method SHALL include a `where` clause containing `user_id: userId`. No query SHALL be issued without this filter.

**Validates: Requirements 5.4**

---

### Property 4: getWeeklyPlan seeds default plan for new users

*For any* `userId` with no existing weekly plan in the database, calling `getWeeklyPlan()` SHALL return a plan structurally equivalent to `defaultWeeklyPlan` and SHALL persist that plan to the database so that a subsequent call returns the same data.

**Validates: Requirements 5.7**

---

### Property 5: reorderExercises preserves order_index correctly

*For any* list of exercise IDs in any permutation, after calling `reorderExercises(dayOfWeek, orderedIds)`, querying the exercises for that day ordered by `order_index` SHALL return the exercises in the exact same sequence as `orderedIds`.

**Validates: Requirements 5.9**

---

### Property 6: camelCase ↔ snake_case round-trip is identity

*For any* valid domain object (`Exercise`, `DailyLog`, `Goals`, or `ExerciseExecution`), converting it to its database row representation (camelCase → snake_case) and then converting the result back to the domain representation (snake_case → camelCase) SHALL produce an object deeply equal to the original.

**Validates: Requirements 5.10**

---

### Property 7: Adapter errors are always wrapped as StorageError

*For any* `SupabaseAdapter` method, when the underlying Prisma call throws any error (network failure, constraint violation, timeout), the adapter SHALL throw a `StorageError` instance (not a raw Prisma error or generic `Error`), with a non-empty `message` and a valid `StorageErrorCode`.

**Validates: Requirements 5.11**

---

## Error Handling

### StorageError Contract

The `SupabaseAdapter` must honour the same error contract as `LocalStorageAdapter`. Any failure in a Prisma operation is caught and re-thrown as a `StorageError`:

```typescript
function toPrismaStorageError(error: unknown, operation: string): StorageError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2002 = unique constraint violation
    if (error.code === 'P2002') {
      return new StorageError(`Duplicate record during ${operation}.`, 'UNKNOWN');
    }
    // P2025 = record not found
    if (error.code === 'P2025') {
      return new StorageError(`Record not found during ${operation}.`, 'UNKNOWN');
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new StorageError(`Database connection failed during ${operation}.`, 'UNKNOWN');
  }
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return new StorageError(`Unexpected error during ${operation}: ${message}`, 'UNKNOWN');
}
```

### Auth Error Handling

Auth errors from Supabase are surfaced to the user via the existing `Toast` component:

- Invalid credentials → "Email ou senha incorretos."
- Email already in use → "Este email já está cadastrado."
- Network error → "Erro de conexão. Tente novamente."

### Missing Environment Variables

If any required env var is absent at server startup, `validateEnv()` throws with a descriptive message listing all missing variables. This causes the Next.js server to fail to start, preventing silent misconfiguration.

### Build-time SSR Safety

All components that use `localStorage`, `window`, or browser-only APIs are already marked `"use client"`. The `SupabaseAdapter` and `prisma` singleton are never imported in Client Components — they are only used in Server Components, Server Actions, and API Route Handlers. This is enforced by the `server-only` package import guard in `src/lib/prisma.ts`:

```typescript
import 'server-only';
```

---

## Testing Strategy

### Unit Tests (Vitest + fast-check)

**Existing tests (unchanged):**
- `src/lib/calculators/__tests__/` — all calculator tests continue to pass unchanged.
- `src/lib/validators/__tests__/` — all validator tests continue to pass unchanged.
- `src/lib/storage/__tests__/storage.service.test.ts` — LocalStorageStorageService tests unchanged.

**New unit tests:**

| File | What it tests |
|------|---------------|
| `src/lib/storage/__tests__/supabase.adapter.test.ts` | All 7 correctness properties using mocked PrismaClient |
| `src/lib/env.test.ts` | `validateEnv()` throws descriptive errors for missing vars |
| `src/lib/storage/__tests__/mapping.test.ts` | camelCase↔snake_case round-trip (Property 6) |
| `middleware.test.ts` | Auth Guard routing logic (Property 1) |

**Property test configuration:**
- Minimum 100 iterations per property test (fast-check default is 100).
- Each property test is tagged with a comment: `// Feature: supabase-vercel-migration, Property N: <property_text>`
- Prisma is mocked using `vi.mock('@/lib/prisma')` — no real DB connection in unit tests.

### Integration Tests

| Scenario | How |
|----------|-----|
| Cascade delete (Req 2.9) | Test DB: create user + related rows, delete user, assert all rows gone |
| Signup + login flow (Req 4.3, 4.4) | Supabase test project or local Supabase CLI |
| Session persistence (Req 4.10) | Integration test with real Supabase session cookies |
| End-to-end data sync (Req 7.6, 7.7) | Playwright E2E: create account, log data, verify on second browser |

### Smoke Tests (CI)

- `npm run build` exits with code 0 (Req 1.1).
- `npx prisma validate` passes (schema is valid).
- `.env.example` contains all 5 required variable names.
- `.gitignore` contains `.env` entry.

### Dual Testing Approach

Unit tests with mocked Prisma cover the adapter logic (Properties 3–7) without requiring a real database. Integration tests with a real Supabase test project cover the infrastructure wiring (cascade deletes, RLS, session management). This separation keeps the unit test suite fast and deterministic while still validating the full stack.

**Property tests focus on:**
- Universal properties of the adapter's mapping and filtering logic.
- Error wrapping behaviour across all methods.
- Routing logic of the middleware.

**Unit tests focus on:**
- Specific error messages for known Prisma error codes.
- Adapter method behaviour for edge cases (empty results, upsert vs insert).
- Auth form validation and error display.
