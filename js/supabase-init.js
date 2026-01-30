/**
 * Supabase SDK Initialization
 * This file sets up Supabase client for the gallery system
 *
 * SECURITY NOTE: This config is SAFE to commit to public repos.
 * Row Level Security (RLS) policies enforce access control, not this config.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace SUPABASE_URL and SUPABASE_ANON_KEY below
 * 4. Run supabase-schema.sql in SQL Editor
 * 5. Create admin user in Authentication > Users
 */

(function() {
  // Supabase configuration
  const SUPABASE_URL = 'https://gjdzcdgqfapwucroxfpb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZHpjZGdxZmFwd3Vjcm94ZnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3NDkzNzEsImV4cCI6MjA4NTMyNTM3MX0.vW4Poycjy5vxpCAY5obxZWqM0I-WEP50E7lQGfiyqg8';

  // Cloudflare R2 configuration
  const R2_CONFIG = {
    accountId: '3f053b5175a3dc2df64c852741820067',
    bucketName: 'caleb-media-videos',
    publicUrl: 'https://media.calebthephotoguy.com'
  };

  // Initialize Supabase client
  const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Helper: Generate UUID v4
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Helper: Hash password (SHA-256)
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Helper: Verify password
  async function verifyPassword(password, hash) {
    const inputHash = await hashPassword(password);
    return inputHash === hash;
  }

  // Helper: Format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  // Helper: Format timestamp
  function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper: Check if gallery is expired
  function isGalleryExpired(expiresAt) {
    if (!expiresAt) return false;
    const expiry = new Date(expiresAt);
    return expiry < new Date();
  }

  // Helper: Get R2 presigned URL for upload
  async function getR2UploadUrl(filename, fileType) {
    const key = `galleries/${Date.now()}_${filename}`;

    // Option 1: If using public R2 bucket (simplest)
    if (R2_CONFIG.publicUrl) {
      return `${R2_CONFIG.publicUrl}/${key}`;
    }

    throw new Error('R2 upload URL generation not configured. See supabase-init.js comments.');
  }

  // Helper: Get R2 presigned URL for download
  async function getR2DownloadUrl(key) {
    // Option 1: If using public R2 bucket
    if (R2_CONFIG.publicUrl) {
      return `${R2_CONFIG.publicUrl}/${key}`;
    }

    throw new Error('R2 download URL generation not configured. See supabase-init.js comments.');
  }

  // Export for use in other files (ONLY GLOBAL)
  window.supabaseInit = {
    supabase: db,
    R2_CONFIG,
    generateUUID,
    hashPassword,
    verifyPassword,
    formatFileSize,
    formatTimestamp,
    isGalleryExpired,
    getR2UploadUrl,
    getR2DownloadUrl
  };

  console.log('Supabase initialized:', SUPABASE_URL);
})();
