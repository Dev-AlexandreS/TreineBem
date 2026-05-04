'use client'

import { useState, useEffect, useCallback } from 'react'
import { storageService } from '@/lib/storage/storage.service'
import { validateHeight } from '@/lib/validators/settings.validator'
import type { UserSettings, StorageError } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseSettingsReturn {
  settings: UserSettings | null
  saveSettings: (newSettings: UserSettings) => { success: boolean; error?: string }
  loading: boolean
  error: StorageError | null
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook para gerenciar as configurações do usuário.
 * Valida a altura antes de persistir.
 *
 * Requirements: 14.2, 14.3, 14.4
 */
export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<StorageError | null>(null)

  // ── Load on mount ─────────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const loaded = storageService.getUserSettings()
      setSettings(loaded)
    } catch (err) {
      setError(err as StorageError)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────────

  const saveSettings = useCallback(
    (newSettings: UserSettings): { success: boolean; error?: string } => {
      // Validate height if provided
      if (newSettings.heightCm !== undefined) {
        const result = validateHeight(newSettings.heightCm)
        if (!result.valid) {
          return { success: false, error: result.error }
        }
      }

      try {
        storageService.saveUserSettings(newSettings)
        setSettings(newSettings)
        return { success: true }
      } catch (err) {
        setError(err as StorageError)
        return { success: false, error: 'Erro ao salvar configurações.' }
      }
    },
    []
  )

  return { settings, saveSettings, loading, error }
}
