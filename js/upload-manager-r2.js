/**
 * Upload Manager for R2 Storage
 * Handles file uploads to Cloudflare R2
 */

class UploadManager {
  constructor() {
    this.supabase = window.supabaseInit.supabase;
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
        const { data, error } = await this.supabase
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
        const { data: gallery } = await this.supabase
          .from('galleries')
          .select(countField)
          .eq('gallery_id', galleryId)
          .single();

        await this.supabase
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
   * Upload file to R2
   * @param {File} file - File to upload
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} R2 URL
   */
  async uploadToR2(file, galleryId) {
    const filename = `${Date.now()}_${file.name}`;
    const key = `galleries/${galleryId}/${filename}`;

    // OPTION 1: Upload via presigned URL (requires Supabase Edge Function)
    // This is the secure approach - backend generates presigned URL
    try {
      // Call Supabase Edge Function to get presigned upload URL
      const { data: urlData, error: urlError } = await this.supabase.functions.invoke('r2-upload-url', {
        body: {
          key,
          contentType: file.type
        }
      });

      if (urlError) throw urlError;

      // Upload to R2 using presigned URL
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error(`R2 upload failed: ${uploadResponse.statusText}`);
      }

      // Return the public URL
      return urlData.publicUrl;

    } catch (error) {
      console.error('R2 upload error:', error);

      // OPTION 2: Fallback to direct upload if public bucket
      // WARNING: Only use this if your R2 bucket allows public uploads
      // This is NOT recommended for production
      if (this.R2_CONFIG.publicUrl) {
        console.warn('Falling back to public R2 upload - configure Edge Function for production');
        return await this.uploadToPublicR2(file, key);
      }

      throw new Error('R2 upload failed. Please configure Supabase Edge Function (see SETUP.md)');
    }
  }

  /**
   * Upload to public R2 bucket (fallback, not recommended for production)
   * @param {File} file - File to upload
   * @param {string} key - R2 object key
   * @returns {Promise<string>} R2 URL
   */
  async uploadToPublicR2(file, key) {
    // This only works if your R2 bucket allows public uploads
    // Configure CORS on your R2 bucket:
    // [{"AllowedOrigins": ["*"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["*"]}]

    const url = `${this.R2_CONFIG.publicUrl}/${key}`;

    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      throw new Error(`Public R2 upload failed: ${response.statusText}`);
    }

    return url;
  }

  /**
   * Delete media file from R2
   * @param {string} mediaId - Media ID
   * @param {string} storageUrl - Storage URL
   */
  async deleteMedia(mediaId, storageUrl) {
    try {
      // Delete from R2 via Edge Function
      const key = this.extractKeyFromUrl(storageUrl);

      const { error } = await this.supabase.functions.invoke('r2-delete', {
        body: { key }
      });

      if (error) {
        console.warn('R2 delete failed:', error);
      }
    } catch (error) {
      console.warn('R2 delete error:', error);
    }

    // Delete from Supabase
    await this.supabase
      .from('media')
      .delete()
      .eq('media_id', mediaId);
  }

  /**
   * Delete all media in a gallery
   * @param {string} galleryId - Gallery ID
   */
  async deleteGalleryMedia(galleryId) {
    const { data: media, error } = await this.supabase
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

  /**
   * Extract R2 key from URL
   * @param {string} url - Full R2 URL
   * @returns {string} R2 object key
   */
  extractKeyFromUrl(url) {
    // Extract key from R2 URL
    // Examples:
    // https://pub-xxxxx.r2.dev/galleries/123/file.jpg -> galleries/123/file.jpg
    // https://account.r2.cloudflarestorage.com/bucket/galleries/123/file.jpg -> galleries/123/file.jpg

    const parts = url.split('/');
    const galleriesIndex = parts.indexOf('galleries');

    if (galleriesIndex === -1) {
      throw new Error('Invalid R2 URL format');
    }

    return parts.slice(galleriesIndex).join('/');
  }
}

// Export for use in admin.js
window.UploadManager = UploadManager;
