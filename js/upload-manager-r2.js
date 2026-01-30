/**
 * Upload Manager for Supabase Storage
 * Handles file uploads to Supabase Storage bucket
 */

class UploadManager {
  constructor() {
    this.db = window.supabaseInit.supabase;
    this.generateUUID = window.supabaseInit.generateUUID;
    this.formatFileSize = window.supabaseInit.formatFileSize;
    this.BUCKET_NAME = 'gallery-media'; // Supabase Storage bucket
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

        // Upload to Supabase Storage
        const storageUrl = await this.uploadToStorage(file, galleryId);

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
   * Upload file to Supabase Storage
   * @param {File} file - File to upload
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} Public URL
   */
  async uploadToStorage(file, galleryId) {
    const filename = `${Date.now()}_${file.name}`;
    const path = `galleries/${galleryId}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await this.db.storage
      .from(this.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = this.db.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);

    return urlData.publicUrl;
  }

  /**
   * Delete media file from Supabase Storage
   * @param {string} mediaId - Media ID
   * @param {string} storageUrl - Storage URL
   */
  async deleteMedia(mediaId, storageUrl) {
    try {
      // Extract path from storage URL
      const urlObj = new URL(storageUrl);
      const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);

      if (pathMatch) {
        const path = pathMatch[1];

        // Delete from Supabase Storage
        const { error } = await this.db.storage
          .from(this.BUCKET_NAME)
          .remove([path]);

        if (error) {
          console.error('Failed to delete from storage:', error);
        }
      }

      // Delete from database
      await this.db
        .from('media')
        .delete()
        .eq('media_id', mediaId);

    } catch (error) {
      console.error('Failed to delete media:', error);
      // Still try to delete from database even if storage delete fails
      await this.db
        .from('media')
        .delete()
        .eq('media_id', mediaId);
    }
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
