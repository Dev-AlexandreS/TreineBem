# Implementation Plan: Supabase/Vercel Migration

## Overview

Migrate "Treine Bem" from LocalStorage persistence to Supabase PostgreSQL + Prisma ORM + Supabase Auth, deployed on Vercel. The plan follows a strict dependency order: infrastructure first (env, Prisma, Supabase clients), then auth, then the storage adapter, then context wiring, and finally tests and build validation.

The `SupabaseAdapter` is server-side only — it imports Prisma and must never be bundled to the browser. All hooks keep their existing public API unchanged. `LocalStorageAdapter` remains as the unauthenticated fallback.

---

## Tasks

- [x] 1. Vercel build preparation — fix SSR issues and add project scaffolding
  - Audit every file under `src/` for browser-only APIs (`window`, `localStorage`, `document`, `navigator`). Add `"use client"` to any component or hook that uses them and is not already marked.
  - Confirm `src/app/layout.tsx`, all page files, and all components under `src/components/` that do not use hooks or browser APIs are Server Components (no `"use client"` directive).
  - Create `.env.example` at the project root with placeholder values for all five required variables: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - Verify `.gitignore` already contains `.env` and `.env.local` entries; add them if missing.
  - Update `README.md` with step-by-step instructions covering: local dev setup, creating a Supabase project, configuring env vars locally and on Vercel, pushing to GitHub, deploying to Vercel, and running `npx prisma migrate deploy` against the production DB.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.2, 6.3, 7.3, 7.4_

- [x] 2. Environment variable validation module
  - Create `src/lib/env.ts` that exports a `validateEnv()` function. The function reads `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from `process.env`, collects any missing names, and throws a descriptive `Error` listing them if any are absent.
  - `validateEnv()` must be called at the top of `src/lib/prisma.ts` (created in task 3) so it runs on first server-side import and fails fast before any DB connection is attempted.
  - _Requirements: 1.6, 6.1, 6.4_

  - [x] 2.1 Write unit tests for `validateEnv()`
    - Test that `validateEnv()` throws with a message listing each missing variable name when one or more vars are absent.
    - Test that `validateEnv()` does not throw when all five variables are present.
    - File: `src/lib/__tests__/env.test.ts`
    - _Requirements: 1.6, 6.4_

- [x] 3. Prisma setup — schema, singleton client, and seed
  - [x] 3.1 Install Prisma dependencies and initialise
    - Install `prisma` (dev) and `@prisma/client` (prod) with exact versions.
    - Run `npx prisma init` to create `prisma/schema.prisma` and add `DATABASE_URL` to `.env.example` if not already present.
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Write `prisma/schema.prisma`
    - Set `provider = "postgresql"`, `url = env("DATABASE_URL")`, `directUrl = env("DIRECT_URL")`.
    - Define all seven models exactly as specified in the design: `User`, `Goals`, `WeeklyPlan`, `Exercise`, `DailyLog`, `ExerciseExecution`, `CardioLog`.
    - Include all foreign keys with `onDelete: Cascade` on every child relation pointing to `User`.
    - Add `@@unique([user_id, day_of_week])` on `WeeklyPlan` and `@@unique([user_id, date])` on `DailyLog`.
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.9, 3.1, 3.2_

  - [x] 3.3 Generate initial migration and Prisma Client
    - Run `npx prisma migrate dev --name initial` to create `prisma/migrations/` with the initial SQL migration.
    - Run `npx prisma generate` to generate the typed Prisma Client.
    - _Requirements: 3.4, 3.7, 3.8_

  - [x] 3.4 Create Prisma singleton at `src/lib/prisma.ts`
    - Import `server-only` at the top to prevent browser bundling.
    - Call `validateEnv()` immediately after the import.
    - Implement the `globalThis` singleton pattern to avoid multiple `PrismaClient` instances during Next.js hot-reload in development.
    - Enable query/error/warn logging in development, error-only in production.
    - _Requirements: 3.3_

  - [x] 3.5 Write `prisma/seed.ts`
    - Accept a `userId` (read from a CLI argument or env var `SEED_USER_ID`).
    - Insert the seven-day `defaultWeeklyPlan` for that user using `prisma.weeklyPlan.createMany` and `prisma.exercise.createMany`, mapping camelCase fields to snake_case column names.
    - Add `"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }` to `package.json`.
    - _Requirements: 3.5, 3.6_

- [x] 4. Supabase client helpers
  - [x] 4.1 Create browser-side Supabase client at `src/lib/supabase/client.ts`
    - Export a `createClient()` function that calls `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
    - This file must NOT import `server-only` — it is used in Client Components.
    - _Requirements: 6.5_

  - [x] 4.2 Create server-side Supabase client at `src/lib/supabase/server.ts`
    - Export an async `createClient()` function that calls `createServerClient` from `@supabase/ssr`.
    - Use `await cookies()` from `next/headers` to read and write cookies (Next.js 15+ async cookies API).
    - Implement both `getAll` and `setAll` cookie handlers as required by `@supabase/ssr`.
    - _Requirements: 6.5_

- [x] 5. Middleware — Auth Guard
  - Create `middleware.ts` at the project root.
  - Instantiate a server-side Supabase client using `createServerClient` directly (not the helper from task 4.2, to avoid the async `cookies()` call — middleware uses `request.cookies` synchronously).
  - Call `supabase.auth.getUser()` to refresh the session JWT on every request.
  - Define `PROTECTED_ROUTES = ['/', '/workout', '/history', '/plan', '/goals']` and `AUTH_ROUTES = ['/login', '/signup']`.
  - Redirect unauthenticated users accessing protected routes to `/login`.
  - Redirect authenticated users accessing auth routes to `/`.
  - Export a `config.matcher` that excludes `_next/static`, `_next/image`, `favicon.ico`, and static asset extensions.
  - _Requirements: 4.8, 4.9, 4.10_

- [x] 6. Authentication pages and logout
  - [x] 6.1 Create auth route group layout at `src/app/(auth)/layout.tsx`
    - Server Component (no `"use client"`).
    - Renders a centred card layout with no navigation (no `SideNav`, no `BottomNav`).
    - _Requirements: 4.1, 4.2_

  - [x] 6.2 Create login page at `src/app/(auth)/login/page.tsx`
    - Client Component (`"use client"`).
    - Form with email and password fields and a submit button.
    - On submit, call `supabase.auth.signInWithPassword({ email, password })` using the browser client from task 4.1.
    - On success, call `router.push('/')` using `useRouter` from `next/navigation`.
    - On error, display a descriptive message using the existing `Toast` component: "Email ou senha incorretos." for invalid credentials, "Erro de conexão. Tente novamente." for network errors.
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 6.3 Create signup page at `src/app/(auth)/signup/page.tsx`
    - Client Component (`"use client"`).
    - Form with name, email, and password fields and a submit button.
    - On submit, call `supabase.auth.signUp({ email, password, options: { data: { name } } })` using the browser client.
    - After successful signup, insert a row into `public.users` via a Server Action (name, email, id from the returned user object).
    - On success, redirect to `/`.
    - On duplicate email error, display "Este email já está cadastrado." via `Toast`.
    - _Requirements: 4.2, 4.3, 4.6_

  - [x] 6.4 Create `LogoutButton` component at `src/components/ui/LogoutButton.tsx`
    - Client Component (`"use client"`).
    - Renders a button that calls `supabase.auth.signOut()` on click, then calls `router.push('/login')`.
    - _Requirements: 4.7_

  - [x] 6.5 Add `LogoutButton` to navigation components
    - Import and render `LogoutButton` inside `src/components/navigation/SideNav.tsx` (desktop nav).
    - Import and render `LogoutButton` inside `src/components/navigation/BottomNav.tsx` (mobile nav).
    - _Requirements: 4.7, 8.3_

- [x] 7. StorageContext and StorageProvider
  - [x] 7.1 Create `StorageContext` at `src/lib/storage/storage.context.tsx`
    - Client Component file (`"use client"`).
    - Export `StorageContext` as a `createContext` with type `{ service: StorageService; isLoading: boolean; error: StorageError | null; clearError: () => void } | null`, defaulting to `null`.
    - _Requirements: 5.1, 5.8_

  - [x] 7.2 Create `StorageProvider` at `src/lib/storage/storage.provider.tsx`
    - Client Component (`"use client"`).
    - Accept `userId: string | null` and `children: React.ReactNode` as props.
    - Use `useMemo` to instantiate `SupabaseAdapter(userId)` when `userId` is non-null, or `LocalStorageStorageService()` otherwise.
    - Manage `error: StorageError | null` state and expose `clearError`.
    - Provide the context value via `StorageContext.Provider`.
    - _Requirements: 5.5, 5.6_

- [x] 8. SupabaseAdapter implementation
  - [x] 8.1 Create `src/lib/storage/supabase.adapter.ts` with constructor and mapping helpers
    - Import `server-only` at the top.
    - Import `prisma` from `@/lib/prisma`.
    - Define private `toDbExercise`, `fromDbExercise`, `toDbDailyLog`, `fromDbDailyLog`, `toDbGoals`, `fromDbGoals`, `toDbExecution`, `fromDbExecution` helper functions that map all camelCase TypeScript fields to snake_case Prisma fields and vice versa, covering every entry in the mapping table from the design document.
    - Define the `toPrismaStorageError(error, operation)` helper that maps `PrismaClientKnownRequestError` (P2002, P2025) and `PrismaClientInitializationError` to typed `StorageError` instances, and wraps all other errors as `StorageError('...', 'UNKNOWN')`.
    - Export `class SupabaseAdapter` with `constructor(private readonly userId: string)`.
    - _Requirements: 5.2, 5.3, 5.10, 5.11_

  - [x] 8.2 Implement `getWeeklyPlan` and `saveWeeklyPlan`
    - `getWeeklyPlan`: Query `prisma.weeklyPlan.findMany` with `where: { user_id: this.userId }` including nested `exercises` ordered by `order_index`. If no rows exist, call `saveWeeklyPlan(defaultWeeklyPlan)` then return `defaultWeeklyPlan`. Map results through `fromDb` helpers to produce a `WeeklyPlan` keyed by `DayOfWeek`.
    - `saveWeeklyPlan`: For each day in the plan, upsert the `WeeklyPlan` row (on `[user_id, day_of_week]`), then delete all existing exercises for that plan and recreate them with correct `order_index` values.
    - Wrap all Prisma calls in try/catch and re-throw via `toPrismaStorageError`.
    - _Requirements: 5.2, 5.3, 5.4, 5.7_

  - [x] 8.3 Implement `addExercise`, `updateExercise`, `removeExercise`, `reorderExercises`
    - `addExercise`: Find the `WeeklyPlan` row for `(userId, dayOfWeek)`, then call `prisma.exercise.create` with all fields mapped through `toDbExercise`, setting `order_index` to the current exercise count.
    - `updateExercise`: Call `prisma.exercise.update` with `where: { id: exercise.id }` and all mapped fields. Verify `user_id` matches in the where clause.
    - `removeExercise`: Call `prisma.exercise.delete` with `where: { id: exerciseId, user_id: this.userId }`.
    - `reorderExercises`: Use `prisma.$transaction` to update `order_index` for each exercise ID in the provided `orderedIds` array atomically.
    - Wrap all Prisma calls in try/catch and re-throw via `toPrismaStorageError`.
    - _Requirements: 5.2, 5.3, 5.4, 5.9_

  - [x] 8.4 Implement `getDailyLog`, `saveDailyLog`, `getDailyLogs`
    - `getDailyLog`: Call `prisma.dailyLog.findFirst` with `where: { user_id: this.userId, date: new Date(date) }`. Return `null` if not found. Map through `fromDbDailyLog`.
    - `saveDailyLog`: Call `prisma.dailyLog.upsert` on `(user_id, date)` unique constraint. Map through `toDbDailyLog`.
    - `getDailyLogs`: Call `prisma.dailyLog.findMany` with `where: { user_id: this.userId, date: { gte: new Date(from), lte: new Date(to) } }`. Map results through `fromDbDailyLog`.
    - Wrap all Prisma calls in try/catch and re-throw via `toPrismaStorageError`.
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 8.5 Implement `getExerciseExecutions` and `saveExerciseExecution`
    - `getExerciseExecutions`: Query `prisma.exerciseExecution.findMany` with `where: { user_id: this.userId, daily_log: { date: new Date(date) } }`. Map through `fromDbExecution`.
    - `saveExerciseExecution`: Call `prisma.exerciseExecution.upsert` on `id`. Map through `toDbExecution`. Resolve the `daily_log_id` by finding or creating the `DailyLog` for the execution's date.
    - Wrap all Prisma calls in try/catch and re-throw via `toPrismaStorageError`.
    - _Requirements: 5.2, 5.3, 5.4_

  - [x] 8.6 Implement `getGoals` and `saveGoals`
    - `getGoals`: Call `prisma.goals.findFirst` with `where: { user_id: this.userId }`. Return `null` if not found. Map through `fromDbGoals`.
    - `saveGoals`: Call `prisma.goals.upsert` on `user_id`. Map through `toDbGoals`.
    - Wrap all Prisma calls in try/catch and re-throw via `toPrismaStorageError`.
    - _Requirements: 5.2, 5.3, 5.4_

- [x] 9. Checkpoint — adapter complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update `useStorage` hook and root layout
  - [x] 10.1 Update `src/hooks/useStorage.ts`
    - Replace the current implementation with a context-based one: import `useContext` from React and `StorageContext` from `@/lib/storage/storage.context`.
    - Return `useContext(StorageContext)` and throw `new Error('useStorage must be used within StorageProvider')` if the context is null.
    - Keep the return type identical to the current signature: `{ service: StorageService; isLoading: boolean; error: StorageError | null; clearError: () => void }`.
    - _Requirements: 5.5, 8.7_

  - [x] 10.2 Update `src/app/layout.tsx` to be an async Server Component with `StorageProvider`
    - Make the default export `async`.
    - Import `createClient` from `@/lib/supabase/server` and call `await createClient()` to get the server-side Supabase client.
    - Call `supabase.auth.getUser()` to retrieve the current user.
    - Import `StorageProvider` from `@/lib/storage/storage.provider`.
    - Wrap the body children in `<StorageProvider userId={user?.id ?? null}>`.
    - Pass `user` (or a derived display name) to `SideNav` so it can show user info and the logout button.
    - _Requirements: 5.5, 5.6, 4.10_

- [x] 11. Property-based tests for all 7 correctness properties
  - [x] 11.1 Write property test for Property 1 — Auth Guard routes correctly
    - File: `src/__tests__/middleware.test.ts`
    - Use `fast-check` to generate arbitrary protected route paths and arbitrary auth route paths.
    - Mock `createServerClient` and `supabase.auth.getUser` to return either a user or null.
    - Assert: for any protected path with no user → response redirects to `/login`.
    - Assert: for any protected path with a user → response does not redirect.
    - Assert: for any auth path with a user → response redirects to `/`.
    - Tag: `// Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly`
    - _Requirements: 4.8, 4.9_

  - [x] 11.2 Write property test for Property 2 — User data isolation
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Mock `prisma` using `vi.mock('@/lib/prisma')`.
    - Use `fast-check` to generate two distinct UUIDs (`userA`, `userB`) and arbitrary data records.
    - For each read method (`getWeeklyPlan`, `getDailyLog`, `getDailyLogs`, `getExerciseExecutions`, `getGoals`), assert that the Prisma mock was called with a `where` clause containing `user_id: userA` when the adapter is constructed with `userA`, and that no call includes `user_id: userB`.
    - Tag: `// Feature: supabase-vercel-migration, Property 2: User data isolation`
    - _Requirements: 4.11, 5.4_

  - [x] 11.3 Write property test for Property 3 — All adapter queries filter by userId
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Use `fast-check` to generate arbitrary UUIDs as `userId`.
    - For every adapter method, capture all Prisma calls made during execution and assert that each call's `where` argument contains `user_id: userId` (or `id: userId` for the User table).
    - Tag: `// Feature: supabase-vercel-migration, Property 3: All adapter queries filter by userId`
    - _Requirements: 5.4_

  - [x] 11.4 Write property test for Property 4 — `getWeeklyPlan` seeds default plan for new users
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Mock `prisma.weeklyPlan.findMany` to return `[]` (no existing plan).
    - Mock `prisma.weeklyPlan.upsert` and `prisma.exercise.createMany` to capture calls.
    - Use `fast-check` to generate arbitrary `userId` strings.
    - Assert: `getWeeklyPlan()` returns a plan structurally equivalent to `defaultWeeklyPlan`.
    - Assert: `prisma.weeklyPlan.upsert` was called (plan was persisted).
    - Tag: `// Feature: supabase-vercel-migration, Property 4: getWeeklyPlan seeds default plan for new users`
    - _Requirements: 5.7_

  - [ ]* 11.5 Write property test for Property 5 — `reorderExercises` preserves order_index correctly
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Use `fast-check` to generate arbitrary arrays of unique exercise IDs (permutations).
    - Mock `prisma.$transaction` to capture the update calls.
    - Assert: after `reorderExercises(dayOfWeek, orderedIds)`, each exercise ID at position `i` in `orderedIds` was updated with `order_index: i`.
    - Tag: `// Feature: supabase-vercel-migration, Property 5: reorderExercises preserves order_index correctly`
    - _Requirements: 5.9_

  - [ ]* 11.6 Write property test for Property 6 — camelCase ↔ snake_case round-trip is identity
    - File: `src/lib/storage/__tests__/mapping.test.ts`
    - Use `fast-check` to generate arbitrary valid `Exercise`, `DailyLog`, `Goals`, and `ExerciseExecution` objects.
    - For each type, apply `toDb` then `fromDb` and assert deep equality with the original object.
    - Tag: `// Feature: supabase-vercel-migration, Property 6: camelCase ↔ snake_case round-trip is identity`
    - _Requirements: 5.10_

  - [x] 11.7 Write property test for Property 7 — Adapter errors are always wrapped as StorageError
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Use `fast-check` to generate arbitrary error types: `PrismaClientKnownRequestError` (codes P2002, P2025), `PrismaClientInitializationError`, generic `Error`, and plain objects.
    - For each adapter method, mock the underlying Prisma call to throw the generated error.
    - Assert: the adapter throws a `StorageError` instance (not the raw error).
    - Assert: the thrown `StorageError` has a non-empty `message` and a valid `StorageErrorCode`.
    - Tag: `// Feature: supabase-vercel-migration, Property 7: Adapter errors are always wrapped as StorageError`
    - _Requirements: 5.11_

- [-] 12. Unit tests for adapter methods and auth forms
  - [-] 12.1 Write unit tests for `SupabaseAdapter` method behaviour
    - File: `src/lib/storage/__tests__/supabase.adapter.test.ts`
    - Test `getWeeklyPlan` returns mapped data when rows exist.
    - Test `saveDailyLog` calls upsert with correct mapped fields.
    - Test `saveExerciseExecution` calls upsert on `id`.
    - Test `getGoals` returns `null` when no row exists.
    - _Requirements: 5.2, 5.3_

  - [x] 12.2 Write unit tests for auth error display in login and signup pages
    - File: `src/app/(auth)/__tests__/auth.test.tsx`
    - Use `@testing-library/react` to render the login page.
    - Mock the browser Supabase client to return an error from `signInWithPassword`.
    - Assert the error message "Email ou senha incorretos." is displayed.
    - Render the signup page, mock `signUp` to return a duplicate-email error, assert "Este email já está cadastrado." is displayed.
    - _Requirements: 4.5, 4.6_

- [x] 13. Checkpoint — all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Final build validation and README documentation
  - Run `npm run build` and confirm it exits with code 0 with no TypeScript errors, lint errors, or SSR failures.
  - Run `npx prisma validate` and confirm the schema is valid.
  - Verify `.env.example` contains all five required variable names.
  - Verify `.gitignore` contains `.env` and `.env.local`.
  - Confirm `README.md` documents: local setup, Supabase project creation, env var configuration (local and Vercel panel), GitHub push, Vercel deploy, and `npx prisma migrate deploy` for production.
  - _Requirements: 1.1, 1.4, 1.5, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.8, 7.9_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- `SupabaseAdapter` imports `server-only` — it must never appear in a Client Component import chain.
- The `StorageService` interface in `src/types/index.ts` is not modified.
- `LocalStorageStorageService` and `localStorage.adapter.ts` are not modified.
- `defaultPlan.ts` is not modified.
- All existing hooks (`useWeeklyPlan`, `useDailyLog`, `useWorkout`, `useGoals`, `useDashboard`) are not modified.
- All existing calculators and validators are not modified.
- Property tests use `fast-check` (already installed as a dev dependency) with Vitest.
- Prisma is mocked with `vi.mock('@/lib/prisma')` in all unit/property tests — no real DB connection required.
