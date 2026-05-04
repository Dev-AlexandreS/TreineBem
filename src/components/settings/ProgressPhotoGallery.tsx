'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { ProgressPhoto } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressPhotoGalleryProps {
  photos: ProgressPhoto[];
  onAdd: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string to a human-readable Portuguese date.
 * e.g. "2025-01-12" → "12 jan 2025"
 */
function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  photo: ProgressPhoto;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function Lightbox({ photo, onClose, onDelete }: LightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(photo.id);
    onClose();
  }

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Foto de progresso de ${formatDate(photo.date)}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      {/* Content — stop propagation so clicks inside don't close */}
      <div
        className="relative flex flex-col items-center gap-4 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
        >
          ✕
        </button>

        {/* Photo */}
        <div className="relative w-full aspect-[3/4] max-h-[70vh] rounded-xl overflow-hidden bg-gray-800">
          <Image
            src={photo.url}
            alt={`Foto de progresso de ${formatDate(photo.date)}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 512px"
            unoptimized
          />
        </div>

        {/* Date */}
        <p className="text-sm text-gray-300">{formatDate(photo.date)}</p>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className={[
            'w-full min-h-[48px] rounded-xl text-sm font-medium transition-colors',
            confirmDelete
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'border border-red-700/50 text-red-400 hover:bg-red-900/20',
          ].join(' ')}
        >
          {confirmDelete ? 'Confirmar exclusão' : 'Excluir foto'}
        </button>

        {confirmDelete && (
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-gray-400 hover:text-gray-300"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Gallery of progress photos with add and delete functionality.
 *
 * - "Adicionar foto de progresso" opens the native file picker
 * - Photos are displayed in chronological order with their date
 * - Tapping a photo opens a full-screen lightbox with delete option
 *
 * Requirements: 15.1, 15.2, 15.3, 15.5
 */
export default function ProgressPhotoGallery({
  photos,
  onAdd,
  onDelete,
}: ProgressPhotoGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAddClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so the same file can be re-selected after an error
    e.target.value = '';

    setIsUploading(true);
    try {
      await onAdd(file);
    } finally {
      setIsUploading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-hidden="true"
        onChange={handleFileChange}
      />

      {/* Add button */}
      <button
        type="button"
        onClick={handleAddClick}
        disabled={isUploading}
        className="w-full min-h-[48px] rounded-xl border border-dashed border-gray-600 text-gray-300 text-sm font-medium hover:border-blue-500 hover:text-blue-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {isUploading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          <>
            <span aria-hidden="true">📷</span>
            Adicionar foto de progresso
          </>
        )}
      </button>

      {/* Gallery grid */}
      {photos.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">
          Nenhuma foto registrada ainda.
        </p>
      ) : (
        <div
          role="list"
          aria-label="Galeria de fotos de progresso"
          className="grid grid-cols-3 gap-2"
        >
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              role="listitem"
              aria-label={`Foto de progresso de ${formatDate(photo.date)}`}
              onClick={() => setSelectedPhoto(photo)}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-700 hover:ring-2 hover:ring-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all group"
            >
              <Image
                src={photo.url}
                alt={`Foto de progresso de ${formatDate(photo.date)}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 160px"
                unoptimized
              />
              {/* Date overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white text-center truncate">
                  {formatDate(photo.date)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}
