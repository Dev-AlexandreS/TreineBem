'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// ─── Progress Photo Actions ───────────────────────────────────────────────────

/**
 * Saves progress photo metadata to the database after the file has been
 * uploaded to Supabase Storage by the client.
 *
 * Requirements: 15.3
 */
export async function saveProgressPhotoMetadata(
  id: string,
  date: string,
  storagePath: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    await prisma.progressPhoto.upsert({
      where: { id },
      update: {
        date: new Date(date),
        storage_path: storagePath,
      },
      create: {
        id,
        user_id: user.id,
        date: new Date(date),
        storage_path: storagePath,
      },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return { success: false, error: message };
  }
}

/**
 * Retrieves all progress photos for the authenticated user.
 * Returns metadata with signed URLs valid for 1 hour.
 *
 * Requirements: 15.3
 */
export async function getProgressPhotosAction(): Promise<{
  success: boolean;
  photos?: Array<{ id: string; date: string; url: string; storagePath: string }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const rows = await prisma.progressPhoto.findMany({
      where: { user_id: user.id },
      orderBy: { date: 'asc' },
    });

    const photos = await Promise.all(
      rows.map(async (row) => {
        const { data } = await supabase.storage
          .from('progress-photos')
          .createSignedUrl(row.storage_path, 3600);

        return {
          id: row.id,
          date:
            row.date instanceof Date
              ? row.date.toISOString().split('T')[0]
              : String(row.date),
          url: data?.signedUrl ?? '',
          storagePath: row.storage_path,
        };
      }),
    );

    return { success: true, photos };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return { success: false, error: message };
  }
}

/**
 * Deletes a progress photo from both Supabase Storage and the database.
 *
 * Requirements: 15.3
 */
export async function deleteProgressPhotoAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuário não autenticado.' };
    }

    const row = await prisma.progressPhoto.findFirst({
      where: { id, user_id: user.id },
    });

    if (!row) {
      return { success: false, error: 'Foto não encontrada.' };
    }

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from('progress-photos')
      .remove([row.storage_path]);

    if (storageError) {
      return { success: false, error: storageError.message };
    }

    // Delete metadata from database
    await prisma.progressPhoto.delete({
      where: { id, user_id: user.id },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    return { success: false, error: message };
  }
}
