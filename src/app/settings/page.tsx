'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { useToast } from '@/hooks/useToast'
import { useProgressPhotos } from '@/hooks/useProgressPhotos'
import { validateHeight } from '@/lib/validators/settings.validator'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import SkeletonCard from '@/components/ui/SkeletonCard'
import { ToastStack } from '@/components/ui/Toast'
import ProgressPhotoGallery from '@/components/settings/ProgressPhotoGallery'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Página de Configurações do usuário.
 *
 * Requirements: 14.1–14.6
 */
export default function SettingsPage() {
  const { settings, saveSettings, loading } = useSettings()
  const { toasts, showSuccess, showError, dismiss } = useToast()
  const { photos, addPhoto, deletePhoto } = useProgressPhotos()
  const router = useRouter()

  // ── Form state ─────────────────────────────────────────────────────────────

  const [displayName, setDisplayName] = useState('')
  const [heightStr, setHeightStr] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [heightError, setHeightError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // ── Load user email from Supabase ──────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  // ── Pre-fill form from settings ────────────────────────────────────────────

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? '')
      setHeightStr(settings.heightCm !== undefined ? String(settings.heightCm) : '')
      setBirthDate(settings.birthDate ?? '')
    }
  }, [settings])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleHeightChange(v: string) {
    setHeightStr(v)
    if (heightError) setHeightError(null)
  }

  async function handleSave() {
    // Validate height if provided
    if (heightStr !== '') {
      const heightNum = parseInt(heightStr)
      const result = validateHeight(heightNum)
      if (!result.valid) {
        setHeightError(result.error ?? 'Altura inválida.')
        return
      }
    }

    setIsSaving(true)
    try {
      const result = saveSettings({
        displayName: displayName.trim() || undefined,
        heightCm: heightStr !== '' ? parseInt(heightStr) : undefined,
        birthDate: birthDate || undefined,
      })

      if (result.success) {
        showSuccess('Configurações salvas com sucesso!')
      } else {
        showError(result.error ?? 'Erro ao salvar configurações.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function handleAddPhoto(file: File) {
    try {
      await addPhoto(file)
      showSuccess('Foto adicionada com sucesso!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar foto.'
      showError(message)
    }
  }

  async function handleDeletePhoto(id: string) {
    try {
      await deletePhoto(id)
      showSuccess('Foto excluída.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir foto.'
      showError(message)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="h-8 bg-gray-700 rounded-full w-1/3 animate-pulse" />
        <SkeletonCard lines={4} height={160} />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-24">
      <ToastStack toasts={toasts} onDismiss={dismiss} />

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sair da conta?"
        description="Você será desconectado e redirecionado para a tela de login."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <h1 className="text-2xl font-bold text-white">Configurações</h1>

      {/* Dados da conta (somente leitura) */}
      <section aria-label="Dados da conta" className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-3">
        <h2 className="text-base font-semibold text-white">Conta</h2>
        <div>
          <p className="text-xs font-medium text-gray-400 mb-1">E-mail</p>
          <p className="text-sm text-gray-300 bg-gray-700/50 rounded-lg px-3 py-2.5">
            {userEmail ?? '—'}
          </p>
          <p className="text-xs text-gray-500 mt-1">O e-mail não pode ser alterado aqui.</p>
        </div>
      </section>

      {/* Dados pessoais */}
      <section aria-label="Dados pessoais" className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-4">
        <h2 className="text-base font-semibold text-white">Dados pessoais</h2>

        {/* Nome de exibição */}
        <div className="flex flex-col gap-1">
          <label htmlFor="display-name" className="text-sm font-medium text-gray-300">
            Nome de exibição{' '}
            <span className="text-gray-500 text-xs">opcional</span>
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como você quer ser chamado?"
            className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          />
        </div>

        {/* Altura */}
        <div className="flex flex-col gap-1">
          <label htmlFor="height" className="text-sm font-medium text-gray-300">
            Altura (cm){' '}
            <span className="text-gray-500 text-xs">usado para calcular o IMC</span>
          </label>
          <input
            id="height"
            type="number"
            inputMode="numeric"
            min={100}
            max={250}
            value={heightStr}
            onChange={(e) => handleHeightChange(e.target.value)}
            aria-invalid={heightError !== null}
            aria-describedby={heightError ? 'height-error' : undefined}
            placeholder="Ex: 175"
            className={[
              'rounded-lg bg-gray-700 border px-3 py-2 text-white text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500',
              heightError ? 'border-red-500' : 'border-gray-600',
            ].join(' ')}
          />
          {heightError && (
            <p id="height-error" role="alert" className="text-xs text-red-400">
              {heightError}
            </p>
          )}
        </div>

        {/* Data de nascimento */}
        <div className="flex flex-col gap-1">
          <label htmlFor="birth-date" className="text-sm font-medium text-gray-300">
            Data de nascimento{' '}
            <span className="text-gray-500 text-xs">opcional</span>
          </label>
          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Salvar */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full min-h-[48px] rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </section>

      {/* Fotos de Progresso */}
      <section aria-label="Fotos de progresso" className="rounded-2xl bg-gray-800 border border-gray-700 p-4 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-white">Fotos de Progresso</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Registre fotos para acompanhar sua evolução visual ao longo do tempo.
          </p>
        </div>
        <ProgressPhotoGallery
          photos={photos}
          onAdd={handleAddPhoto}
          onDelete={handleDeletePhoto}
        />
      </section>

      {/* Sair */}
      <section aria-label="Sessão" className="rounded-2xl bg-gray-800 border border-gray-700 p-4">
        <h2 className="text-base font-semibold text-white mb-3">Sessão</h2>
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full min-h-[48px] rounded-xl border border-red-700/50 text-red-400 text-sm font-medium hover:bg-red-900/20 transition-colors"
        >
          Sair da conta
        </button>
      </section>
    </div>
  )
}
