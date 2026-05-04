-- CreateTable: progress_photos
-- Stores metadata for user progress photos. The actual image files
-- are stored in Supabase Storage bucket "progress-photos".
CREATE TABLE "progress_photos" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "storage_path" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_photos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "progress_photos" ADD CONSTRAINT "progress_photos_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "progress_photos_user_id_idx" ON "progress_photos"("user_id");
CREATE INDEX "progress_photos_date_idx" ON "progress_photos"("date");

-- ─── Supabase Storage: create bucket "progress-photos" ────────────────────────
-- This uses the Supabase storage schema (storage.buckets / storage.objects).
-- The bucket is private (public = false); access is controlled via RLS policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'progress-photos',
    'progress-photos',
    false,
    5242880,  -- 5 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── RLS Policies for storage.objects ────────────────────────────────────────
-- Each user can only SELECT, INSERT, UPDATE, DELETE their own objects.
-- The owner column in storage.objects is set to auth.uid() on upload.

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own progress photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own photos
CREATE POLICY "Users can view their own progress photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own photos
CREATE POLICY "Users can delete their own progress photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own photos
CREATE POLICY "Users can update their own progress photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'progress-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
