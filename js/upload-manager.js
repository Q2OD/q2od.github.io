/**
 * Upload Manager
 * Handles file uploads to Firebase Storage (photos) and Cloudflare R2 (videos)
 */

class UploadManager {
  constructor() {
    this.storage = window.firebaseInit.storage;
    this.db = window.firebaseInit.db;
    this.generateUUID = window.firebaseInit.generateUUID;
    this.formatFileSize = window.firebaseInit.formatFileSize;

    // Cloud Function URL for R2 uploads (set after deployment)
    this.cloudFunctionUrl = 'https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/uploadToR2';
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

        let storageUrl;
        if (isVideo) {
          storageUrl = await this.uploadVideo(file, galleryId);
        } else {
          storageUrl = await this.uploadPhoto(file, galleryId);
        }

        // Create media record in Firestore
        const mediaId = this.generateUUID();
        const mediaData = {
          mediaId,
          galleryId,
          type: isVideo ? 'video' : 'photo',
          storageUrl,
          filename: file.name,
          fileSizeBytes: file.size,
          uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
          sortOrder: i
        };

        await this.db.collection('media').doc(mediaId).set(mediaData);

        // Update gallery photo/video count
        const countField = isVideo ? 'videoCount' : 'photoCount';
        await this.db.collection('galleries').doc(galleryId).update({
          [countField]: firebase.firestore.FieldValue.increment(1)
        });

        uploadedMedia.push(mediaData);
        onProgress?.(file.name, i + 1, fileArray.length, 'completed');

      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        onProgress?.(file.name, i + 1, fileArray.length, 'failed', error.message);
      }
    }

    return uploadedMedia;
  }

  /**
   * Upload photo to Firebase Storage
   * @param {File} file - Photo file
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} Download URL
   */
  async uploadPhoto(file, galleryId) {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = this.storage.ref(`galleries/${galleryId}/photos/${filename}`);

    const uploadTask = storageRef.put(file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        reject,
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadURL);
        }
      );
    });
  }

  /**
   * Upload video to Cloudflare R2 via Cloud Function
   * @param {File} file - Video file
   * @param {string} galleryId - Gallery ID
   * @returns {Promise<string>} R2 URL
   */
  async uploadVideo(file, galleryId) {
    // For MVP: Upload to Firebase Storage (simpler)
    // Later: Switch to R2 via Cloud Function for better free tier
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = this.storage.ref(`galleries/${galleryId}/videos/${filename}`);

    const uploadTask = storageRef.put(file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        null,
        reject,
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          resolve(downloadURL);
        }
      );
    });

    // TODO: Implement R2 upload via Cloud Function
    // const formData = new FormData();
    // formData.append('file', file);
    // formData.append('galleryId', galleryId);
    // formData.append('filename', file.name);
    //
    // const response = await fetch(this.cloudFunctionUrl, {
    //   method: 'POST',
    //   body: formData
    // });
    //
    // if (!response.ok) throw new Error('R2 upload failed');
    // const data = await response.json();
    // return data.url;
  }

  /**
   * Delete media file
   * @param {string} mediaId - Media ID
   * @param {string} storageUrl - Storage URL
   * @param {string} type - Media type (photo/video)
   */
  async deleteMedia(mediaId, storageUrl, type) {
    try {
      // Delete from Storage
      const storageRef = this.storage.refFromURL(storageUrl);
      await storageRef.delete();
    } catch (error) {
      console.warn('Storage delete failed (may not exist):', error);
    }

    // Delete from Firestore
    await this.db.collection('media').doc(mediaId).delete();
  }

  /**
   * Delete all media in a gallery
   * @param {string} galleryId - Gallery ID
   */
  async deleteGalleryMedia(galleryId) {
    const mediaSnapshot = await this.db
      .collection('media')
      .where('galleryId', '==', galleryId)
      .get();

    const deletePromises = [];
    mediaSnapshot.forEach(doc => {
      const media = doc.data();
      deletePromises.push(this.deleteMedia(media.mediaId, media.storageUrl, media.type));
    });

    await Promise.all(deletePromises);
  }
}

// Export for use in admin.js
window.UploadManager = UploadManager;
