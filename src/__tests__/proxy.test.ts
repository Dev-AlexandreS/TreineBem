// Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly
// Validates: Requirements 4.8, 4.9

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock @supabase/ssr so we can control auth.getUser() return value
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

// Mock next/server – we need real-ish NextRequest/NextResponse behaviour
// NextResponse.redirect must return an object with a `headers` map that has `location`
vi.mock('next/server', () => {
  const NextResponse = {
    next: vi.fn(({ request }: { request: unknown }) => ({
      _type: 'next',
      request,
      cookies: { set: vi.fn() },
    })),
    redirect: vi.fn((url: URL) => ({
      _type: 'redirect',
      headers: new Map([['location', url.toString()]]),
    })),
  };
  return { NextResponse };
});

// ─── Imports after mocks ──────────────────────────────────────────────────────

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { proxy as middleware } from '../proxy';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PROTECTED_ROUTES = ['/', '/workout', '/history', '/plan', '/goals'];
const AUTH_ROUTES = ['/login', '/signup'];

/** Build a minimal NextRequest-like object for a given pathname */
function makeRequest(pathname: string) {
  const url = `http://localhost${pathname}`;
  return {
    nextUrl: new URL(url),
    url,
    cookies: {
      getAll: () => [],
    },
  } as unknown as import('next/server').NextRequest;
}

/** Configure the @supabase/ssr mock to return a specific user (or null) */
function mockSupabaseUser(user: object | null) {
  vi.mocked(createServerClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    cookies: {},
  } as unknown as ReturnType<typeof createServerClient>);
}

// ─── Generators ───────────────────────────────────────────────────────────────

/** Arbitrary protected route path (exact match or sub-path) */
const arbProtectedPath = fc.oneof(
  // Exact protected routes
  fc.constantFrom(...PROTECTED_ROUTES),
  // Sub-paths of non-root protected routes (e.g. /workout/123)
  fc.tuple(
    fc.constantFrom('/workout', '/history', '/plan', '/goals'),
    fc.stringMatching(/^[a-z0-9]{1,20}$/),
  ).map(([base, sub]) => `${base}/${sub}`),
);

/** Arbitrary auth route path */
const arbAuthPath = fc.oneof(
  fc.constantFrom(...AUTH_ROUTES),
  fc.tuple(
    fc.constantFrom(...AUTH_ROUTES),
    fc.stringMatching(/^[a-z0-9]{1,20}$/),
  ).map(([base, sub]) => `${base}/${sub}`),
);

/** Minimal user object */
const fakeUser = { id: 'user-123', email: 'test@example.com' };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('middleware – Property 1: Auth Guard routes correctly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required env vars so the proxy doesn't short-circuit
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    // Re-mock NextResponse after clearAllMocks
    vi.mocked(NextResponse.next).mockImplementation(({ request }: any) => ({
      _type: 'next',
      request,
      cookies: { set: vi.fn() },
    } as any));
    vi.mocked(NextResponse.redirect).mockImplementation((url: URL) => ({
      _type: 'redirect',
      headers: new Map([['location', url.toString()]]),
    } as any));
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it('protected path + no user → redirects to /login', async () => {
    // Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly
    await fc.assert(
      fc.asyncProperty(arbProtectedPath, async (pathname) => {
        mockSupabaseUser(null);
        const req = makeRequest(pathname);
        const result = await middleware(req);

        expect((result as any)._type).toBe('redirect');
        const location = (result as any).headers.get('location');
        expect(location).toContain('/login');
      }),
      { numRuns: 50 },
    );
  });

  it('protected path + user → does NOT redirect', async () => {
    // Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly
    await fc.assert(
      fc.asyncProperty(arbProtectedPath, async (pathname) => {
        mockSupabaseUser(fakeUser);
        const req = makeRequest(pathname);
        const result = await middleware(req);

        // Should be a "next" response, not a redirect
        expect((result as any)._type).toBe('next');
      }),
      { numRuns: 50 },
    );
  });

  it('auth path + user → redirects to /', async () => {
    // Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly
    await fc.assert(
      fc.asyncProperty(arbAuthPath, async (pathname) => {
        mockSupabaseUser(fakeUser);
        const req = makeRequest(pathname);
        const result = await middleware(req);

        expect((result as any)._type).toBe('redirect');
        const location = (result as any).headers.get('location');
        expect(location).toMatch(/^http:\/\/localhost\/$/);
      }),
      { numRuns: 50 },
    );
  });

  it('auth path + no user → does NOT redirect', async () => {
    // Feature: supabase-vercel-migration, Property 1: Auth Guard routes correctly
    await fc.assert(
      fc.asyncProperty(arbAuthPath, async (pathname) => {
        mockSupabaseUser(null);
        const req = makeRequest(pathname);
        const result = await middleware(req);

        expect((result as any)._type).toBe('next');
      }),
      { numRuns: 50 },
    );
  });
});
