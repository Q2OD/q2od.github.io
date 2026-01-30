/**
 * Client Gallery Viewer (Supabase Version)
 * Password verification, media loading, and display logic
 */

(function() {
  // Get references without using "supabase" as an identifier
  const db = window.supabaseInit.supabase;
  const verifyPassword = window.supabaseInit.verifyPassword;
  const isGalleryExpired = window.supabaseInit.isGalleryExpired;
  const lightbox = new Lightbox();

  let currentGallery = null;
  let galleryMedia = [];

  // DOM Elements
  const passwordScreen = document.getElementById('passwordScreen');
  const galleryView = document.getElementById('galleryView');
  const passwordForm = document.getElementById('passwordForm');
  const passwordError = document.getElementById('passwordError');
  const galleryTitle = document.getElementById('galleryTitle');
  const gallerySubtitle = document.getElementById('gallerySubtitle');
  const photoCount = document.getElementById('photoCount');
  const videoCount = document.getElementById('videoCount');
  const mediaGrid = document.getElementById('mediaGrid');
  const emptyMediaState = document.getElementById('emptyMediaState');
  const loadingState = document.getElementById('loadingState');

  // Get gallery ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const galleryId = urlParams.get('id');

  // Validate gallery ID
  if (!galleryId) {
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-5 text-center">
        <div>
          <div class="text-6xl mb-4">⚠️</div>
          <h1 class="font-display text-4xl text-gradient mb-2">Invalid Gallery Link</h1>
          <p class="text-paper/60">Please check your link and try again.</p>
        </div>
      </div>
    `;
  }

  // Password Form
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;

    try {
      // Load gallery
      const { data: gallery, error } = await db
        .from('galleries')
        .select('*')
        .eq('gallery_id', galleryId)
        .single();

      if (error || !gallery) {
        passwordError.textContent = 'Gallery not found';
        passwordError.classList.remove('hidden');
        return;
      }

      currentGallery = gallery;

      // Check if active
      if (!currentGallery.is_active) {
        passwordError.textContent = 'This gallery is no longer active';
        passwordError.classList.remove('hidden');
        return;
      }

      // Check if expired
      if (isGalleryExpired(currentGallery.expires_at)) {
        passwordError.textContent = 'This gallery has expired';
        passwordError.classList.remove('hidden');
        return;
      }

      // Verify password
      const isValid = await verifyPassword(password, currentGallery.password_hash);

      if (!isValid) {
        passwordError.textContent = 'Incorrect password';
        passwordError.classList.remove('hidden');
        return;
      }

      // Password correct - show gallery
      passwordScreen.classList.add('hidden');
      galleryView.classList.remove('hidden');

      // Increment view count
      await db
        .from('galleries')
        .update({ view_count: currentGallery.view_count + 1 })
        .eq('gallery_id', galleryId);

      // Track analytics
      await db
        .from('analytics')
        .insert([{
          gallery_id: galleryId,
          type: 'view',
          media_id: null
        }]);

      // Load gallery
      await loadGallery();

    } catch (error) {
      console.error('Error accessing gallery:', error);
      passwordError.textContent = 'Error accessing gallery. Please try again.';
      passwordError.classList.remove('hidden');
    }
  });

  /**
   * Load gallery data and media
   */
  async function loadGallery() {
    try {
      // Update header
      galleryTitle.textContent = currentGallery.client_name;
      gallerySubtitle.textContent = currentGallery.event_name;

      // Load media
      const { data: media, error } = await db
        .from('media')
        .select('*')
        .eq('gallery_id', galleryId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      galleryMedia = media || [];

      // Update counts
      const photos = galleryMedia.filter(m => m.type === 'photo');
      const videos = galleryMedia.filter(m => m.type === 'video');

      photoCount.textContent = photos.length;
      videoCount.textContent = videos.length;

      // Hide loading state
      loadingState.classList.add('hidden');

      // Render media grid
      if (galleryMedia.length === 0) {
        emptyMediaState.classList.remove('hidden');
      } else {
        emptyMediaState.classList.add('hidden');
        renderMediaGrid();
      }

    } catch (error) {
      console.error('Failed to load gallery:', error);
      loadingState.innerHTML = `
        <div class="text-center py-20">
          <div class="text-6xl mb-4">⚠️</div>
          <h3 class="font-display text-3xl text-gradient mb-2">Error Loading Gallery</h3>
          <p class="text-paper/60">Please try again later.</p>
        </div>
      `;
    }
  }

  /**
   * Render media grid
   */
  function renderMediaGrid() {
    mediaGrid.innerHTML = '';

    galleryMedia.forEach((media, index) => {
      const item = createMediaItem(media, index);
      mediaGrid.appendChild(item);
    });
  }

  /**
   * Create media item
   * @param {Object} media - Media object
   * @param {number} index - Index in gallery
   * @returns {HTMLElement} Media item element
   */
  function createMediaItem(media, index) {
    const item = document.createElement('div');
    item.className = 'media-item bg-white/5 rounded-lg overflow-hidden ring-soft hover:shadow-glow transition-all';

    if (media.type === 'video') {
      item.innerHTML = `
        <video src="${media.storage_url}" class="pointer-events-none" crossorigin="anonymous"></video>
        <div class="video-badge">▶ VIDEO</div>
      `;
    } else {
      const img = document.createElement('img');
      img.src = media.storage_url;
      img.alt = media.filename;
      img.loading = 'lazy';
      img.crossOrigin = 'anonymous';

      // Add error handling
      img.onerror = function() {
        console.error('Failed to load image:', media.storage_url);
        this.parentElement.innerHTML = `
          <div class="flex items-center justify-center h-full bg-red-900/20 text-red-400 text-sm p-4">
            ⚠️ Failed to load<br>${media.filename}
          </div>
        `;
      };

      item.appendChild(img);
    }

    // Click to open lightbox
    item.addEventListener('click', () => {
      lightbox.open(galleryMedia, index);
    });

    return item;
  }

  /**
   * Track download in analytics (exposed globally for lightbox)
   * @param {string} mediaId - Media ID
   */
  window.trackDownload = async function(mediaId) {
    try {
      // Increment gallery download count
      await db
        .from('galleries')
        .update({ download_count: currentGallery.download_count + 1 })
        .eq('gallery_id', galleryId);

      // Track analytics
      await db
        .from('analytics')
        .insert([{
          gallery_id: galleryId,
          type: 'download',
          media_id: mediaId
        }]);
    } catch (error) {
      console.error('Failed to track download:', error);
    }
  };
})();
