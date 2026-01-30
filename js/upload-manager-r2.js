/**
 * Upload Manager for R2 Storage (via Supabase Edge Function)
 * Handles file uploads to Cloudflare R2 using presigned URLs
 */

class UploadManager {
  constructor() {
    this.db = window.supabaseInit.supabase;
    this.generateUUID = window.supabaseInit.generateUUID;
    this.formatFileSize = window.supabaseInit.formatFileSize;
  }

  /**
   * Upload multiple files to a gallery
   * @param {FileList} files - Files to upload
   * @param {string} galleryId - Gallery ID
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Array>} Uploaded media records
   */
  async uploadFiles(files, galleryId, onProgress) {
    const results = {
      succeeded: [],
      failed: [],
      total: 0
    };

    const fileArray = Array.from(files);
    results.total = fileArray.length;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const isVideo = file.type.startsWith('video/');
      const isPhoto = file.type.startsWith('image/');

      if (!isPhoto && !isVideo) {
        console.warn(`Skipping unsupported file: ${file.name}`);
        results.failed.push({ filename: file.name, error: 'Unsupported file type' });
        continue;
      }

      try {
        onProgress?.(file.name, i + 1, fileArray.length, 'uploading');

        // Upload to R2 via Edge Function
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

        results.succeeded.push({ filename: file.name, data });
        onProgress?.(file.name, i + 1, fileArray.length, 'completed');

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        results.failed.push({ filename: file.name, error: error.message });
        onProgress?.(file.name, i + 1, fileArray.length, 'failed', error.message);
      }
    }

    return results;
  }

  /**
   * Upload file to R2 using presigned URL from Edge Function
   * @param {File} file - File to upload
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} Public URL
   */
  async uploadToR2(file, galleryId) {
    // Generate unique key (timestamp + random UUID + filename)
    const timestamp = Date.now();
    const randomId = this.generateUUID().substring(0, 8);
    const key = `galleries/${galleryId}/${timestamp}_${randomId}_${file.name}`;

    // Call Edge Function to get presigned upload URL
    const { data, error } = await this.db.functions.invoke('r2-upload-url', {
      body: {
        key,
        contentType: file.type
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(`Failed to get upload URL: ${error.message || JSON.stringify(error)}`);
    }

    if (!data) {
      throw new Error('Edge Function returned no data');
    }

    console.log('Edge Function response:', data);

    if (data.error) {
      throw new Error(`Edge Function error: ${data.error}`);
    }

    if (!data.uploadUrl || !data.publicUrl) {
      throw new Error(`Invalid response from upload URL generator: ${JSON.stringify(data)}`);
    }

    // Upload file to R2 using presigned URL
    const uploadResponse = await fetch(data.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`R2 upload failed: ${uploadResponse.statusText}`);
    }

    // Return public URL for accessing the file
    return data.publicUrl;
  }

  /**
   * Delete media file from R2
   * @param {string} mediaId - Media ID
   * @param {string} storageUrl - Storage URL
   */
  async deleteMedia(mediaId, storageUrl) {
    // Note: Deletion from R2 requires another Edge Function
    // For now, just delete from database
    console.warn('R2 file deletion not implemented - file will remain in R2');

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
