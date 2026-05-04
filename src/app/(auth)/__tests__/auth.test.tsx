// Feature: supabase-vercel-migration
// Validates: Requirements 4.5, 4.6

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next/navigation (used by both pages)
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the server action used by signup
vi.mock('../actions', () => ({
  createUserRecord: vi.fn().mockResolvedValue(undefined),
}));

// Mock @/lib/supabase/client – we control what signInWithPassword / signUp returns
const mockSignInWithPassword = vi.fn();
const mockSignUp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  }),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import LoginPage from '../login/page';
import SignupPage from '../signup/page';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fillAndSubmitLogin(email: string, password: string) {
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/senha/i), password);
  await userEvent.click(screen.getByRole('button', { name: /entrar/i }));
}

async function fillAndSubmitSignup(
  name: string,
  email: string,
  password: string,
) {
  await userEvent.type(screen.getByLabelText(/nome/i), name);
  await userEvent.type(screen.getByLabelText(/email/i), email);
  await userEvent.type(screen.getByLabelText(/senha/i), password);
  await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Auth pages – Unit Tests (Task 12.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  // ── Login page: invalid credentials → "Email ou senha incorretos." ─────────

  describe('LoginPage', () => {
    it('displays "Email ou senha incorretos." when signInWithPassword returns invalid_credentials error', async () => {
      // Validates: Requirements 4.5
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'invalid_credentials',
          message: 'Invalid login credentials',
          status: 400,
        },
      });

      render(<LoginPage />);
      await fillAndSubmitLogin('test@example.com', 'wrongpassword');

      await waitFor(() => {
        expect(
          screen.getByText('Email ou senha incorretos.'),
        ).toBeInTheDocument();
      });
    });

    it('displays "Email ou senha incorretos." when signInWithPassword returns status 400 error', async () => {
      // Validates: Requirements 4.5
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'some_other_code',
          message: 'Bad request',
          status: 400,
        },
      });

      render(<LoginPage />);
      await fillAndSubmitLogin('test@example.com', 'wrongpassword');

      await waitFor(() => {
        expect(
          screen.getByText('Email ou senha incorretos.'),
        ).toBeInTheDocument();
      });
    });

    it('redirects to / on successful login', async () => {
      // Validates: Requirements 4.4
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-1' }, session: {} },
        error: null,
      });

      render(<LoginPage />);
      await fillAndSubmitLogin('test@example.com', 'correctpassword');

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  // ── Signup page: duplicate email → "Este email já está cadastrado." ────────

  describe('SignupPage', () => {
    it('displays "Este email já está cadastrado." when signUp returns user_already_exists error', async () => {
      // Validates: Requirements 4.6
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'user_already_exists',
          message: 'User already registered',
          status: 422,
        },
      });

      render(<SignupPage />);
      await fillAndSubmitSignup('João', 'existing@example.com', 'password123');

      await waitFor(() => {
        expect(
          screen.getByText('Este email já está cadastrado.'),
        ).toBeInTheDocument();
      });
    });

    it('displays "Este email já está cadastrado." when signUp returns status 422 error', async () => {
      // Validates: Requirements 4.6
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'some_code',
          message: 'Unprocessable entity',
          status: 422,
        },
      });

      render(<SignupPage />);
      await fillAndSubmitSignup('João', 'existing@example.com', 'password123');

      await waitFor(() => {
        expect(
          screen.getByText('Este email já está cadastrado.'),
        ).toBeInTheDocument();
      });
    });

    it('displays "Este email já está cadastrado." when signUp error message contains "already registered"', async () => {
      // Validates: Requirements 4.6
      mockSignUp.mockResolvedValue({
        data: { user: null, session: null },
        error: {
          code: 'email_exists',
          message: 'User has already been registered',
          status: 400,
        },
      });

      render(<SignupPage />);
      await fillAndSubmitSignup('João', 'existing@example.com', 'password123');

      await waitFor(() => {
        expect(
          screen.getByText('Este email já está cadastrado.'),
        ).toBeInTheDocument();
      });
    });

    it('redirects to / on successful signup', async () => {
      // Validates: Requirements 4.3
      mockSignUp.mockResolvedValue({
        data: { user: { id: 'new-user-1' }, session: {} },
        error: null,
      });

      render(<SignupPage />);
      await fillAndSubmitSignup('João', 'new@example.com', 'password123');

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });
});
