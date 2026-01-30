-- Supabase Database Schema for Caleb Media Gallery System
-- Run this in Supabase SQL Editor to set up your database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- Galleries table
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  event_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  shareable_link TEXT NOT NULL,
  photo_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media table
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  media_id TEXT UNIQUE NOT NULL,
  gallery_id TEXT NOT NULL REFERENCES galleries(gallery_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'video')),
  storage_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id TEXT NOT NULL REFERENCES galleries(gallery_id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('view', 'download', 'download_all')),
  media_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_galleries_gallery_id ON galleries(gallery_id);
CREATE INDEX idx_galleries_created_at ON galleries(created_at DESC);
CREATE INDEX idx_media_gallery_id ON media(gallery_id);
CREATE INDEX idx_media_sort_order ON media(sort_order);
CREATE INDEX idx_analytics_gallery_id ON analytics(gallery_id);
CREATE INDEX idx_analytics_timestamp ON analytics(timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Galleries policies
-- Admin (authenticated users) can do everything
CREATE POLICY "Admins can view all galleries"
  ON galleries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert galleries"
  ON galleries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update galleries"
  ON galleries FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete galleries"
  ON galleries FOR DELETE
  TO authenticated
  USING (true);

-- Public (anon users) can only read galleries (password check happens in app)
CREATE POLICY "Public can view galleries"
  ON galleries FOR SELECT
  TO anon
  USING (true);

-- Media policies
-- Admin can do everything
CREATE POLICY "Admins can view all media"
  ON media FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert media"
  ON media FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update media"
  ON media FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete media"
  ON media FOR DELETE
  TO authenticated
  USING (true);

-- Public can only read media
CREATE POLICY "Public can view media"
  ON media FOR SELECT
  TO anon
  USING (true);

-- Analytics policies
-- Admin can read everything
CREATE POLICY "Admins can view all analytics"
  ON analytics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can delete analytics"
  ON analytics FOR DELETE
  TO authenticated
  USING (true);

-- Public can only insert (track views/downloads)
CREATE POLICY "Public can insert analytics"
  ON analytics FOR INSERT
  TO anon
  WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_galleries_updated_at
  BEFORE UPDATE ON galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert test data
-- INSERT INTO galleries (gallery_id, client_name, event_name, password_hash, shareable_link)
-- VALUES (
--   'test-gallery-123',
--   'Test Client',
--   'Test Event',
--   '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', -- "password" hashed
--   'https://calebthephotoguy.com/gallery.html?id=test-gallery-123'
-- );

-- ============================================================================
-- NOTES
-- ============================================================================

-- Password Security:
-- - Passwords are hashed with SHA-256 in the client before storing
-- - Never store plaintext passwords
-- - Password verification happens client-side by comparing hashes

-- RLS Security:
-- - Authenticated users (admins) have full access
-- - Anonymous users (clients) can only read galleries/media and insert analytics
-- - Gallery access control happens in application code via password check

-- Storage:
-- - All media files stored in Cloudflare R2 (not Supabase Storage)
-- - storage_url points to R2 presigned URLs
-- - Presigned URLs generated on-demand for security
