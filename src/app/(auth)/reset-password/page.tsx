'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Password reset page.
 *
 * Supabase redirects here after the user clicks the reset link in their email.
 * The URL contains a token that Supabase's client SDK picks up automatically
 * via the onAuthStateChange PASSWORD_RECOVERY event.
 */
export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Wait for Supabase to exchange the token from the URL ──────────────────

  useEffect(() => {
    const supabase = createClient();

    // Supabase SSR client automatically processes the token in the URL hash/query.
    // We listen for PASSWORD_RECOVERY to know the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if there's already an active session (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (password !== confirm) {
      setToast({ message: 'As senhas não coincidem.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'A senha deve ter pelo menos 6 caracteres.', type: 'error' });
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setToast({ message: `Erro: ${error.message}`, type: 'error' });
      return;
    }

    // Keep loading=true while redirecting
    setToast({ message: 'Senha redefinida com sucesso!', type: 'success' });
    setTimeout(() => router.push('/'), 1200);
  }

  // ── Loading: waiting for token exchange ───────────────────────────────────

  if (!sessionReady) {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 text-center space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm text-gray-400">Verificando link de redefinição...</p>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {loading && <FullScreenLoader message="Salvando nova senha..." />}

      <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-900/40 border border-blue-700 mx-auto mb-5">
          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">Nova senha</h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Escolha uma senha forte com pelo menos 6 caracteres.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-sm font-medium text-gray-300">
              Nova senha
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-sm font-medium text-gray-300">
              Confirmar senha
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={[
                'w-full px-3 py-2.5 rounded-lg bg-gray-800 border text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
                confirm && confirm !== password
                  ? 'border-red-500'
                  : 'border-gray-700',
              ].join(' ')}
              placeholder="••••••••"
            />
            {confirm && confirm !== password && (
              <p role="alert" className="text-xs text-red-400">
                As senhas não coincidem.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!!confirm && confirm !== password)}
            className="mt-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" aria-hidden="true" />
                Salvando…
              </>
            ) : (
              'Redefinir senha'
            )}
          </button>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
