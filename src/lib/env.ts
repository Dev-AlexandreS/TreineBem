const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

/**
 * Validates that all required environment variables are present.
 * Throws a descriptive Error listing every missing variable if any are absent.
 * Call this at server startup (e.g. inside the PrismaClient factory) to fail fast.
 * Skips validation during the Next.js production build phase so the build
 * succeeds without real env vars being present in CI/CD environments.
 */
export function validateEnv(): void {
  // Skip validation during Next.js build phase
  if (process.env.NEXT_PHASE === 'phase-production-build') return;

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n` +
        `Copy .env.example to .env.local and fill in the values.`,
    );
  }
}
