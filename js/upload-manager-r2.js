/**
 * Upload Manager for R2 Storage (Simplified - Public Bucket Only)
 * Handles file uploads directly to Cloudflare R2
 */

class UploadManager {
  constructor() {
    this.db = window.supabaseInit.supabase;
    this.generateUUID = window.supabaseInit.generateUUID;
    this.formatFileSize = window.supabaseInit.formatFileSize;
    this.R2_CONFIG = window.supabaseInit.R2_CONFIG;
  }

  /**
   * Upload multiple files to a gallery
   * @param {FileList} files - Files to upload
   * @param {string} galleryId - Gallery ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Uploaded media records
   */
  async uploadFiles(files, galleryId, onProgress) {
    const uploadedMedia = [];
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const isVideo = file.type.startsWith('video/');
      const isPhoto = file.type.startsWith('image/');

      if (!isPhoto && !isVideo) {
        console.warn(`Skipping unsupported file: ${file.name}`);
        continue;
      }

      try {
        onProgress?.(file.name, i + 1, fileArray.length, 'uploading');

        // Upload to R2
        const storageUrl = await this.uploadToR2(file, galleryId);

        // Create media record in Supabase
        const mediaId = this.generateUUID();
        const { data, error } = await this.db
          .from('media')
          .insert([{
            media_id: mediaId,
            gallery_id: galleryId,
            type: isVideo ? 'video' : 'photo',
            storage_url: storageUrl,
            filename: file.name,
            file_size_bytes: file.size,
            sort_order: i
          }])
          .select()
          .single();

        if (error) throw error;

        // Update gallery photo/video count
        const countField = isVideo ? 'video_count' : 'photo_count';
        const { data: gallery } = await this.db
          .from('galleries')
          .select(countField)
          .eq('gallery_id', galleryId)
          .single();

        await this.db
          .from('galleries')
          .update({ [countField]: (gallery[countField] || 0) + 1 })
          .eq('gallery_id', galleryId);

        uploadedMedia.push(data);
        onProgress?.(file.name, i + 1, fileArray.length, 'completed');

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        onProgress?.(file.name, i + 1, fileArray.length, 'failed', error.message);
      }
    }

    return uploadedMedia;
  }

  /**
   * Upload file directly to public R2 bucket
   * @param {File} file - File to upload
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} R2 URL
   */
  async uploadToR2(file, galleryId) {
    if (!this.R2_CONFIG.publicUrl) {
      throw new Error('R2 public URL not configured. Please update js/supabase-init.js');
    }

    const filename = `${Date.now()}_${file.name}`;
    const key = `galleries/${galleryId}/${filename}`;
    const url = `${this.R2_CONFIG.publicUrl}/${key}`;

    // Upload directly to public R2 bucket
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.statusText}`);
    }

    return url;
  }

  /**
   * Delete media file from R2
   * @param {string} mediaId - Media ID
   * @param {string} storageUrl - Storage URL
   */
  async deleteMedia(mediaId, storageUrl) {
    // Note: Deleting from public R2 bucket requires API credentials
    // For now, we just delete from database
    // Files will remain in R2 but won't be accessible via gallery
    console.warn('File deletion from R2 not implemented (requires API credentials)');
    console.warn('File will be removed from database but remain in R2');

    // Delete from Supabase
    await this.db
      .from('media')
      .delete()
      .eq('media_id', mediaId);
  }

  /**
   * Delete all media in a gallery
   * @param {string} galleryId - Gallery ID
   */
  async deleteGalleryMedia(galleryId) {
    const { data: media, error } = await this.db
      .from('media')
      .select('*')
      .eq('gallery_id', galleryId);

    if (error) {
      console.error('Failed to fetch media for deletion:', error);
      return;
    }

    const deletePromises = media.map(m =>
      this.deleteMedia(m.media_id, m.storage_url)
    );

    await Promise.all(deletePromises);
  }
}

// Export for use in admin.js
window.UploadManager = UploadManager;
