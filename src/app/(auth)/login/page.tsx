'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Toast from '@/components/ui/Toast';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

// ─── Types ────────────────────────────────────────────────────────────────────

type View = 'login' | 'forgot' | 'forgot-sent';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  // ── Shared state ───────────────────────────────────────────────────────────
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Login state ────────────────────────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── Forgot password state ──────────────────────────────────────────────────
  const [forgotEmail, setForgotEmail] = useState('');

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setLoading(false);
      const isInvalidCredentials =
        error.code === 'invalid_credentials' || error.status === 400;
      setToast({
        message: isInvalidCredentials
          ? 'Email ou senha incorretos.'
          : 'Erro de conexão. Tente novamente.',
        type: 'error',
      });
      return;
    }

    // Keep loading=true while router redirects — overlay stays visible
    router.push('/');
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setToast({ message: 'Erro ao enviar email. Tente novamente.', type: 'error' });
      return;
    }

    setView('forgot-sent');
  }

  // ── Render: forgot-sent confirmation ──────────────────────────────────────

  if (view === 'forgot-sent') {
    return (
      <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800 text-center space-y-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-900/40 border border-blue-700 mx-auto">
          <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">Verifique seu email</h1>
          <p className="mt-2 text-sm text-gray-400 leading-relaxed">
            Enviamos um link de redefinição de senha para{' '}
            <span className="text-gray-200 font-medium">{forgotEmail}</span>.
            <br />
            Verifique sua caixa de entrada e a pasta de spam.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setView('login');
            setForgotEmail('');
          }}
          className="w-full py-2.5 px-4 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors min-h-[44px]"
        >
          Voltar para o login
        </button>
      </div>
    );
  }

  // ── Render: forgot password form ──────────────────────────────────────────

  if (view === 'forgot') {
    return (
      <>
        {loading && <FullScreenLoader message="Enviando email..." />}

        <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setView('login')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Voltar
          </button>

          <h1 className="text-2xl font-bold text-white mb-2">Esqueci a senha</h1>
          <p className="text-sm text-gray-400 mb-6">
            Informe seu email e enviaremos um link para redefinir sua senha.
          </p>

          <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="forgot-email" className="text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" aria-hidden="true" />
                  Enviando…
                </>
              ) : (
                'Enviar link de redefinição'
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

  // ── Render: login form (default) ──────────────────────────────────────────

  return (
    <>
      {loading && <FullScreenLoader message="Entrando..." />}

      <div className="bg-gray-900 rounded-2xl p-8 shadow-xl border border-gray-800">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Entrar</h1>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="seu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-gray-300">
                Senha
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email); // pre-fill with whatever was typed
                  setView('forgot');
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Esqueci a senha
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold transition-colors min-h-[44px] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-transparent animate-spin" aria-hidden="true" />
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Não tem uma conta?{' '}
          <a href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Criar conta
          </a>
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
