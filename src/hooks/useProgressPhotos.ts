'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  saveProgressPhotoMetadata,
  getProgressPhotosAction,
  deleteProgressPhotoAction,
} from '@/app/settings/actions';
import type { ProgressPhoto } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const BUCKET = 'progress-photos';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseProgressPhotosReturn {
  photos: ProgressPhoto[];
  loading: boolean;
  error: string | null;
  addPhoto: (file: File) => Promise<void>;
  deletePhoto: (id: string) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validates a file before upload.
 * Returns an error message string if invalid, or null if valid.
 */
function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return 'Arquivo inválido. Use uma imagem JPEG, PNG ou WebP de até 5 MB.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Arquivo inválido. Use uma imagem JPEG, PNG ou WebP de até 5 MB.';
  }
  return null;
}

/**
 * Returns the file extension for a given MIME type.
 */
function mimeToExt(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimeType] ?? 'jpg';
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Manages progress photos: loading, uploading, and deleting.
 *
 * Upload flow:
 * 1. Validate file (type + size) — show Toast error immediately if invalid
 * 2. Upload file to Supabase Storage via browser client (anon key + RLS)
 * 3. Save metadata (id, date, storagePath) to database via server action
 *
 * Requirements: 15.2, 15.4
 */
export function useProgressPhotos(): UseProgressPhotosReturn {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Load photos on mount ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await getProgressPhotosAction();

      if (cancelled) return;

      if (result.success && result.photos) {
        setPhotos(result.photos);
      } else {
        setError(result.error ?? 'Erro ao carregar fotos.');
      }

      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // ── Add photo ─────────────────────────────────────────────────────────────

  const addPhoto = useCallback(async (file: File): Promise<void> => {
    // 1. Validate before attempting upload
    const validationError = validateFile(file);
    if (validationError) {
      // Throw so the caller (component) can show a Toast
      throw new Error(validationError);
    }

    const supabase = createClient();

    // 2. Get current user to build the storage path
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    const photoId = crypto.randomUUID();
    const ext = mimeToExt(file.type);
    const today = new Date().toISOString().split('T')[0];
    // Path: {userId}/{photoId}.{ext} — matches RLS policy folder check
    const storagePath = `${user.id}/${photoId}.${ext}`;

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao enviar foto: ${uploadError.message}`);
    }

    // 4. Save metadata via server action
    const result = await saveProgressPhotoMetadata(photoId, today, storagePath);
    if (!result.success) {
      // Attempt to clean up the uploaded file
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw new Error(result.error ?? 'Erro ao salvar metadados da foto.');
    }

    // 5. Generate a signed URL for immediate display
    const { data: signedData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    const newPhoto: ProgressPhoto = {
      id: photoId,
      date: today,
      url: signedData?.signedUrl ?? '',
      storagePath,
    };

    setPhotos((prev) => [...prev, newPhoto].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  // ── Delete photo ──────────────────────────────────────────────────────────

  const deletePhoto = useCallback(async (id: string): Promise<void> => {
    const result = await deleteProgressPhotoAction(id);
    if (!result.success) {
      throw new Error(result.error ?? 'Erro ao excluir foto.');
    }
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { photos, loading, error, addPhoto, deletePhoto };
}
