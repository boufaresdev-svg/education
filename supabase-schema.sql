-- Create formations table in Supabase
-- Go to: https://supabase.com/dashboard/project/qggjjzrfquvxxfshhujb/editor
-- Click "SQL Editor" → "New query" → Paste this code → Run

-- Drop existing table if you need to recreate it (⚠️ WARNING: This deletes all data!)
-- DROP TABLE IF EXISTS formations CASCADE;

CREATE TABLE IF NOT EXISTS formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('thermo', 'automatisme', 'process')),
    description TEXT,
    objectives TEXT,
    level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
    image TEXT, -- URL to image in storage bucket
    contents JSONB DEFAULT '[]'::jsonb, -- Array of course content modules
    access_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    total_duration INTEGER -- Duration in minutes
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_formations_category ON formations(category);
CREATE INDEX IF NOT EXISTS idx_formations_created_at ON formations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_formations_level ON formations(level);

-- Enable Row Level Security (RLS)
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for development)
-- ⚠️ FOR PRODUCTION: Create proper authentication policies!
DROP POLICY IF EXISTS "Enable all operations for formations" ON formations;
CREATE POLICY "Enable all operations for formations" ON formations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create storage bucket policies for file uploads
-- First, make sure the bucket exists (create it via Dashboard if not exists)
-- Then run these policies:

-- Allow public read access to formations bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('formations', 'formations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated and anonymous uploads to formations bucket
DROP POLICY IF EXISTS "Allow public uploads to formations" ON storage.objects;
CREATE POLICY "Allow public uploads to formations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'formations');

-- Allow public reads from formations bucket
DROP POLICY IF EXISTS "Allow public reads from formations" ON storage.objects;
CREATE POLICY "Allow public reads from formations"
ON storage.objects FOR SELECT
USING (bucket_id = 'formations');

-- Allow public deletes from formations bucket
DROP POLICY IF EXISTS "Allow public deletes from formations" ON storage.objects;
CREATE POLICY "Allow public deletes from formations"
ON storage.objects FOR DELETE
USING (bucket_id = 'formations');

-- Allow public updates to formations bucket
DROP POLICY IF EXISTS "Allow public updates to formations" ON storage.objects;
CREATE POLICY "Allow public updates to formations"
ON storage.objects FOR UPDATE
USING (bucket_id = 'formations');

-- ✅ Now you can upload files to the "formations" bucket
-- Example structure for contents JSONB field:
-- [
--   {
--     "id": "unique-id",
--     "title": "Module 1",
--     "description": "Introduction",
--     "video_url": "https://qggjjzrfquvxxfshhujb.supabase.co/storage/v1/object/public/formations/videos/file.mp4",
--     "pdf_url": "https://qggjjzrfquvxxfshhujb.supabase.co/storage/v1/object/public/formations/pdfs/file.pdf",
--     "duration": "30"
--   }
-- ]

