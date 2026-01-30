/**
 * Admin Panel Logic (Supabase Version)
 * Handles authentication, gallery management, and file uploads
 */

console.log('🚀 Admin panel loading...');
console.log('📦 window.supabaseInit:', window.supabaseInit);

const { supabase, generateUUID, hashPassword, formatFileSize, formatTimestamp } = window.supabaseInit;

console.log('✅ Supabase client:', supabase);
console.log('✅ Helpers loaded:', { generateUUID, hashPassword });

const uploadManager = new UploadManager();

let currentGalleryId = null;
let currentUser = null;

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const createGalleryBtn = document.getElementById('createGalleryBtn');
const createGalleryModal = document.getElementById('createGalleryModal');
const closeCreateModal = document.getElementById('closeCreateModal');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const createGalleryForm = document.getElementById('createGalleryForm');
const uploadMediaModal = document.getElementById('uploadMediaModal');
const closeUploadModal = document.getElementById('closeUploadModal');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadFilesBtn = document.getElementById('uploadFilesBtn');
const galleriesList = document.getElementById('galleriesList');
const emptyState = document.getElementById('emptyState');

// Auth State
supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session');

  if (session) {
    console.log('✅ User logged in:', session.user.email);
    currentUser = session.user;
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadDashboard();
  } else {
    console.log('❌ No session - showing login screen');
    currentUser = null;
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('🔐 Login form submitted');

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  console.log('📧 Email:', email);
  console.log('🔑 Password length:', password.length);

  // Clear previous errors
  loginError.classList.add('hidden');
  loginError.textContent = '';

  // Get submit button
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  try {
    // Show loading state
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    console.log('⏳ Calling Supabase auth...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log('📦 Auth response:', { data, error });

    if (error) throw error;

    console.log('✅ Login successful!');
    // Success - error will stay hidden
  } catch (error) {
    console.error('❌ Login error:', error);

    // Show user-friendly error messages
    let errorMessage = '';

    if (error.message.includes('Invalid login credentials')) {
      errorMessage = '❌ Incorrect email or password. Please try again.';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = '⚠️ Please confirm your email address before logging in.';
    } else if (error.message.includes('User not found')) {
      errorMessage = '❌ No account found with this email address.';
    } else if (error.message.includes('Too many requests')) {
      errorMessage = '⏳ Too many login attempts. Please wait a few minutes and try again.';
    } else if (error.message.includes('Invalid email')) {
      errorMessage = '⚠️ Please enter a valid email address.';
    } else {
      // Fallback to original error message
      errorMessage = `❌ Login failed: ${error.message}`;
    }

    loginError.textContent = errorMessage;
    loginError.classList.remove('hidden');

    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// Create Gallery Modal
createGalleryBtn.addEventListener('click', () => {
  createGalleryModal.classList.remove('hidden');
});

closeCreateModal.addEventListener('click', () => {
  createGalleryModal.classList.add('hidden');
  createGalleryForm.reset();
});

cancelCreateBtn.addEventListener('click', () => {
  createGalleryModal.classList.add('hidden');
  createGalleryForm.reset();
});

// Create Gallery
createGalleryForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const clientName = document.getElementById('clientName').value;
  const eventName = document.getElementById('eventName').value;
  const galleryPassword = document.getElementById('galleryPassword').value;

  try {
    const galleryId = generateUUID();
    const passwordHash = await hashPassword(galleryPassword);
    const shareableLink = `${window.location.origin}/gallery.html?id=${galleryId}`;

    const { data, error } = await supabase
      .from('galleries')
      .insert([{
        gallery_id: galleryId,
        client_name: clientName,
        event_name: eventName,
        password_hash: passwordHash,
        shareable_link: shareableLink,
        photo_count: 0,
        video_count: 0,
        view_count: 0,
        download_count: 0,
        is_active: true,
        expires_at: null
      }])
      .select();

    if (error) throw error;

    createGalleryModal.classList.add('hidden');
    createGalleryForm.reset();
    loadDashboard();

    // Show success message with shareable link
    alert(`Gallery created!\n\nShareable Link:\n${shareableLink}\n\nPassword: ${galleryPassword}\n\nShare these with your client.`);
  } catch (error) {
    alert('Error creating gallery: ' + error.message);
  }
});

// Upload Media Modal
closeUploadModal.addEventListener('click', () => {
  uploadMediaModal.classList.add('hidden');
  document.getElementById('mediaFiles').value = '';
  document.getElementById('uploadProgress').classList.add('hidden');
});

cancelUploadBtn.addEventListener('click', () => {
  uploadMediaModal.classList.add('hidden');
  document.getElementById('mediaFiles').value = '';
  document.getElementById('uploadProgress').classList.add('hidden');
});

// Upload Files
uploadFilesBtn.addEventListener('click', async () => {
  const files = document.getElementById('mediaFiles').files;

  if (!files.length) {
    alert('Please select files to upload');
    return;
  }

  if (!currentGalleryId) {
    alert('No gallery selected');
    return;
  }

  const uploadProgress = document.getElementById('uploadProgress');
  const uploadList = document.getElementById('uploadList');
  uploadProgress.classList.remove('hidden');
  uploadList.innerHTML = '';

  try {
    await uploadManager.uploadFiles(files, currentGalleryId, (filename, current, total, status, error) => {
      let progressItem = document.getElementById(`upload-${current}`);

      if (!progressItem) {
        progressItem = document.createElement('div');
        progressItem.id = `upload-${current}`;
        progressItem.className = 'flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10';
        uploadList.appendChild(progressItem);
      }

      let statusText = '';
      let statusColor = '';

      if (status === 'uploading') {
        statusText = '⏳ Uploading...';
        statusColor = 'text-yellow-400';
      } else if (status === 'completed') {
        statusText = '✓ Completed';
        statusColor = 'text-green-400';
      } else if (status === 'failed') {
        statusText = `✗ Failed: ${error}`;
        statusColor = 'text-red-400';
      }

      progressItem.innerHTML = `
        <div class="flex-1 truncate text-sm">${current}/${total}: ${filename}</div>
        <div class="text-sm ${statusColor}">${statusText}</div>
      `;
    });

    alert('Upload completed!');
    uploadMediaModal.classList.add('hidden');
    document.getElementById('mediaFiles').value = '';
    uploadProgress.classList.add('hidden');
    loadDashboard();
  } catch (error) {
    alert('Upload failed: ' + error.message);
  }
});

// Load Dashboard
async function loadDashboard() {
  await loadStats();
  await loadGalleries();
}

// Load Stats
async function loadStats() {
  try {
    // Get total galleries
    const { count: galleriesCount } = await supabase
      .from('galleries')
      .select('*', { count: 'exact', head: true });

    // Get total media
    const { count: mediaCount } = await supabase
      .from('media')
      .select('*', { count: 'exact', head: true });

    // Get total views
    const { data: galleries } = await supabase
      .from('galleries')
      .select('view_count');

    let totalViews = 0;
    if (galleries) {
      totalViews = galleries.reduce((sum, g) => sum + (g.view_count || 0), 0);
    }

    document.getElementById('statTotalGalleries').textContent = galleriesCount || 0;
    document.getElementById('statTotalMedia').textContent = mediaCount || 0;
    document.getElementById('statTotalViews').textContent = totalViews;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load Galleries
async function loadGalleries() {
  try {
    const { data: galleries, error } = await supabase
      .from('galleries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!galleries || galleries.length === 0) {
      galleriesList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    galleriesList.innerHTML = '';

    galleries.forEach(gallery => {
      const card = createGalleryCard(gallery);
      galleriesList.appendChild(card);
    });
  } catch (error) {
    console.error('Failed to load galleries:', error);
  }
}

// Create Gallery Card
function createGalleryCard(gallery) {
  const card = document.createElement('div');
  card.className = 'bg-white/5 backdrop-blur-xl rounded-2xl p-6 ring-soft hover:shadow-glow transition-all';

  card.innerHTML = `
    <div class="flex items-start justify-between mb-4">
      <div>
        <h3 class="font-display text-2xl text-gradient mb-1">${gallery.client_name}</h3>
        <p class="text-paper/60 text-sm">${gallery.event_name}</p>
      </div>
      <div class="flex gap-2">
        <button
          class="upload-btn px-4 py-2 bg-blaze hover:bg-blaze2 rounded-lg font-semibold transition-colors text-sm"
          data-gallery-id="${gallery.gallery_id}"
        >
          Upload
        </button>
        <button
          class="copy-btn px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-sm"
          data-gallery-id="${gallery.gallery_id}"
          data-link="${gallery.shareable_link}"
        >
          Copy Link
        </button>
        <button
          class="delete-btn px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg border border-red-600/30 transition-colors text-sm text-red-400"
          data-gallery-id="${gallery.gallery_id}"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div>
        <div class="text-xs text-paper/60 mb-1">Photos</div>
        <div class="text-lg font-semibold">${gallery.photo_count || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Videos</div>
        <div class="text-lg font-semibold">${gallery.video_count || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Views</div>
        <div class="text-lg font-semibold">${gallery.view_count || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Downloads</div>
        <div class="text-lg font-semibold">${gallery.download_count || 0}</div>
      </div>
    </div>

    <div class="flex items-center gap-4 text-xs text-paper/60">
      <div>Created: ${formatTimestamp(gallery.created_at)}</div>
      <div>ID: ${gallery.gallery_id.substring(0, 8)}...</div>
    </div>
  `;

  // Upload button
  card.querySelector('.upload-btn').addEventListener('click', () => {
    currentGalleryId = gallery.gallery_id;
    uploadMediaModal.classList.remove('hidden');
  });

  // Copy link button
  card.querySelector('.copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(gallery.shareable_link);
      alert(`Link copied!\n\n${gallery.shareable_link}\n\nRemember to share the password with your client.`);
    } catch (error) {
      alert(`Link: ${gallery.shareable_link}`);
    }
  });

  // Delete button
  card.querySelector('.delete-btn').addEventListener('click', async () => {
    if (!confirm(`Delete gallery for ${gallery.client_name}?\n\nThis will delete all photos and videos. This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all media files from R2
      await uploadManager.deleteGalleryMedia(gallery.gallery_id);

      // Delete gallery (media records will cascade delete)
      const { error } = await supabase
        .from('galleries')
        .delete()
        .eq('gallery_id', gallery.gallery_id);

      if (error) throw error;

      loadDashboard();
      alert('Gallery deleted successfully');
    } catch (error) {
      alert('Failed to delete gallery: ' + error.message);
    }
  });

  return card;
}
