// Feature: password-reset
// Tests for: forgot password flow (login page) and reset password page

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Auth method mocks
const mockSignInWithPassword = vi.fn();
const mockResetPasswordForEmail = vi.fn();
const mockUpdateUser = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import LoginPage from '../login/page';
import ResetPasswordPage from '../reset-password/page';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Default onAuthStateChange: never fires PASSWORD_RECOVERY, no active session */
function setupNoSession() {
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
}

/** Simulate PASSWORD_RECOVERY event firing immediately */
function setupPasswordRecoverySession() {
  mockGetSession.mockResolvedValue({ data: { session: null } });
  mockOnAuthStateChange.mockImplementation((callback) => {
    // Fire the event synchronously so the component transitions to sessionReady
    callback('PASSWORD_RECOVERY', null);
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
}

/** Simulate an already-active session (e.g. page refresh after token exchange) */
function setupActiveSession() {
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } });
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
}

// ─── Login page — forgot password flow ───────────────────────────────────────

describe('LoginPage — forgot password flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
    // Default: successful login (used by tests that don't override)
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    });
  });

  // ── "Esqueci a senha" link is visible ─────────────────────────────────────

  it('renders "Esqueci a senha" link on the login form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /esqueci a senha/i })).toBeInTheDocument();
  });

  // ── Clicking the link switches to the forgot-password view ────────────────

  it('shows the forgot-password form when "Esqueci a senha" is clicked', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));

    expect(screen.getByRole('heading', { name: /esqueci a senha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar link de redefinição/i })).toBeInTheDocument();
  });

  // ── Email typed in login is pre-filled in forgot form ─────────────────────

  it('pre-fills the forgot-password email with whatever was typed in the login form', async () => {
    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('user@example.com');
  });

  // ── Back button returns to login ──────────────────────────────────────────

  it('returns to the login form when the back button is clicked', async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));
    expect(screen.getByRole('heading', { name: /esqueci a senha/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /esqueci a senha/i })).not.toBeInTheDocument();
  });

  // ── Successful reset email ────────────────────────────────────────────────

  it('shows the confirmation screen after a successful reset email request', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');

    await userEvent.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verifique seu email/i })).toBeInTheDocument();
    });

    // Shows the email address that was used
    expect(screen.getByText(/user@example\.com/i)).toBeInTheDocument();
  });

  // ── Confirmation screen has "Voltar para o login" button ──────────────────

  it('returns to login from the confirmation screen', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /verifique seu email/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /voltar para o login/i }));

    expect(screen.getByRole('heading', { name: /entrar/i })).toBeInTheDocument();
  });

  // ── Error from Supabase shows a toast ─────────────────────────────────────

  it('shows an error toast when resetPasswordForEmail fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: 'Network error' },
    });

    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    await waitFor(() => {
      expect(screen.getByText(/erro ao enviar email/i)).toBeInTheDocument();
    });

    // Should NOT show the confirmation screen
    expect(screen.queryByRole('heading', { name: /verifique seu email/i })).not.toBeInTheDocument();
  });

  // ── resetPasswordForEmail is called with correct args ─────────────────────

  it('calls resetPasswordForEmail with the entered email and a redirectTo URL', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    // jsdom sets window.location.origin to 'http://localhost'
    render(<LoginPage />);

    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'reset@example.com');
    await userEvent.click(screen.getByRole('button', { name: /enviar link de redefinição/i }));

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        'reset@example.com',
        expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') }),
      );
    });
  });

  // ── Normal login still works after visiting forgot-password view ──────────

  it('can still log in after navigating back from the forgot-password view', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    });

    render(<LoginPage />);

    // Go to forgot, then back
    await userEvent.click(screen.getByRole('button', { name: /esqueci a senha/i }));
    await userEvent.click(screen.getByRole('button', { name: /voltar/i }));

    // Now log in normally
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /^entrar$/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});

// ─── Reset password page ──────────────────────────────────────────────────────

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  // ── Loading state while waiting for token ─────────────────────────────────

  it('shows a loading spinner while waiting for the session token', () => {
    setupNoSession();
    render(<ResetPasswordPage />);

    expect(screen.getByText(/verificando link de redefinição/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /nova senha/i })).not.toBeInTheDocument();
  });

  // ── Form appears after PASSWORD_RECOVERY event ────────────────────────────

  it('shows the new-password form after PASSWORD_RECOVERY event fires', async () => {
    setupPasswordRecoverySession();
    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nova senha/i })).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/nova senha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /redefinir senha/i })).toBeInTheDocument();
  });

  // ── Form appears when there is already an active session ─────────────────

  it('shows the form when getSession returns an active session', async () => {
    setupActiveSession();
    render(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /nova senha/i })).toBeInTheDocument();
    });
  });

  // ── Password mismatch shows inline error ──────────────────────────────────

  it('shows inline mismatch error when confirm password differs from new password', async () => {
    setupPasswordRecoverySession();
    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'password123');
    await userEvent.type(confirmInput, 'different');

    expect(await screen.findByText(/as senhas não coincidem/i)).toBeInTheDocument();
  });

  // ── Submit button disabled when passwords don't match ─────────────────────

  it('disables the submit button when passwords do not match', async () => {
    setupPasswordRecoverySession();
    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'password123');
    await userEvent.type(confirmInput, 'mismatch');

    expect(screen.getByRole('button', { name: /redefinir senha/i })).toBeDisabled();
  });

  // ── Submit button enabled when passwords match ────────────────────────────

  it('enables the submit button when passwords match', async () => {
    setupPasswordRecoverySession();
    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'password123');
    await userEvent.type(confirmInput, 'password123');

    expect(screen.getByRole('button', { name: /redefinir senha/i })).not.toBeDisabled();
  });

  // ── Successful password update redirects to dashboard ────────────────────

  it('redirects to / after a successful password update', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupPasswordRecoverySession();
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'newpassword');
    await userEvent.type(confirmInput, 'newpassword');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'newpassword' });
    });

    // Advance the 1200ms redirect timer
    vi.advanceTimersByTime(1200);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    vi.useRealTimers();
  });

  // ── Supabase error shows a toast ──────────────────────────────────────────

  it('shows an error toast when updateUser fails', async () => {
    setupPasswordRecoverySession();
    mockUpdateUser.mockResolvedValue({
      error: { message: 'Token expired' },
    });

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'newpassword');
    await userEvent.type(confirmInput, 'newpassword');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(screen.getByText(/token expired/i)).toBeInTheDocument();
    });

    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ── Client-side validation: passwords don't match (form submit path) ──────

  it('shows toast error when submitted with mismatched passwords via form submit', async () => {
    setupPasswordRecoverySession();
    render(<ResetPasswordPage />);

    // Wait for the form to appear
    await screen.findByLabelText(/nova senha/i);

    await userEvent.type(screen.getByLabelText(/nova senha/i), 'abc123');
    await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'xyz789');

    // The button is disabled when they don't match, so updateUser should never be called
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  // ── updateUser called with the correct password ───────────────────────────

  it('calls updateUser with the new password value', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setupPasswordRecoverySession();
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const newPasswordInput = await screen.findByLabelText(/nova senha/i);
    const confirmInput = await screen.findByLabelText(/confirmar senha/i);

    await userEvent.type(newPasswordInput, 'supersecure99');
    await userEvent.type(confirmInput, 'supersecure99');
    await userEvent.click(screen.getByRole('button', { name: /redefinir senha/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: 'supersecure99' });
    });

    vi.useRealTimers();
  });

  // ── onAuthStateChange subscription is cleaned up on unmount ──────────────

  it('unsubscribes from onAuthStateChange when the component unmounts', () => {
    const unsubscribe = vi.fn();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe } },
    });

    const { unmount } = render(<ResetPasswordPage />);
    unmount();

    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
