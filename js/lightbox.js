/**
 * Lightbox Component
 * Fullscreen photo/video viewer with navigation and keyboard controls
 */

class Lightbox {
  constructor() {
    this.media = [];
    this.currentIndex = 0;
    this.isOpen = false;
    this.createLightbox();
    this.bindEvents();
  }

  /**
   * Create lightbox HTML
   */
  createLightbox() {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'fixed inset-0 z-50 hidden bg-black/95 backdrop-blur-sm';
    lightbox.innerHTML = `
      <!-- Close Button -->
      <button
        id="lightboxClose"
        class="absolute top-5 right-5 z-50 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>

      <!-- Download Button -->
      <button
        id="lightboxDownload"
        class="absolute top-5 right-20 z-50 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Download"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      </button>

      <!-- Navigation Buttons -->
      <button
        id="lightboxPrev"
        class="absolute left-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Previous"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <button
        id="lightboxNext"
        class="absolute right-5 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Next"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>

      <!-- Media Container -->
      <div id="lightboxMedia" class="w-full h-full flex items-center justify-center p-16">
        <!-- Media will be inserted here -->
      </div>

      <!-- Counter -->
      <div class="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-white/10 rounded-full text-sm">
        <span id="lightboxCounter">1 / 1</span>
      </div>
    `;

    document.body.appendChild(lightbox);

    this.lightbox = lightbox;
    this.mediaContainer = document.getElementById('lightboxMedia');
    this.counter = document.getElementById('lightboxCounter');
    this.closeBtn = document.getElementById('lightboxClose');
    this.downloadBtn = document.getElementById('lightboxDownload');
    this.prevBtn = document.getElementById('lightboxPrev');
    this.nextBtn = document.getElementById('lightboxNext');
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.close());

    // Download button
    this.downloadBtn.addEventListener('click', () => this.download());

    // Navigation buttons
    this.prevBtn.addEventListener('click', () => this.prev());
    this.nextBtn.addEventListener('click', () => this.next());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;

      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Click outside to close
    this.lightbox.addEventListener('click', (e) => {
      if (e.target === this.lightbox) this.close();
    });
  }

  /**
   * Open lightbox
   * @param {Array} media - Array of media objects
   * @param {number} index - Starting index
   */
  open(media, index = 0) {
    this.media = media;
    this.currentIndex = index;
    this.isOpen = true;

    this.lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    this.render();
  }

  /**
   * Close lightbox
   */
  close() {
    this.isOpen = false;
    this.lightbox.classList.add('hidden');
    document.body.style.overflow = '';

    // Stop video if playing
    const video = this.mediaContainer.querySelector('video');
    if (video) video.pause();
  }

  /**
   * Navigate to previous media
   */
  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.media.length) % this.media.length;
    this.render();
  }

  /**
   * Navigate to next media
   */
  next() {
    this.currentIndex = (this.currentIndex + 1) % this.media.length;
    this.render();
  }

  /**
   * Download current media
   */
  async download() {
    const current = this.media[this.currentIndex];

    try {
      const response = await fetch(current.storageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = current.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Track download in analytics
      if (window.trackDownload) {
        window.trackDownload(current.mediaId);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  }

  /**
   * Render current media
   */
  render() {
    const current = this.media[this.currentIndex];

    // Update counter
    this.counter.textContent = `${this.currentIndex + 1} / ${this.media.length}`;

    // Show/hide navigation buttons
    this.prevBtn.style.display = this.media.length > 1 ? 'flex' : 'none';
    this.nextBtn.style.display = this.media.length > 1 ? 'flex' : 'none';

    // Render media
    if (current.type === 'video') {
      this.mediaContainer.innerHTML = `
        <video
          src="${current.storageUrl}"
          controls
          autoplay
          class="max-w-full max-h-full rounded-lg"
          style="max-height: calc(100vh - 8rem);"
        ></video>
      `;
    } else {
      this.mediaContainer.innerHTML = `
        <img
          src="${current.storageUrl}"
          alt="${current.filename}"
          class="max-w-full max-h-full rounded-lg object-contain"
          style="max-height: calc(100vh - 8rem);"
        />
      `;
    }
  }
}

// Export for use in gallery.js
window.Lightbox = Lightbox;
