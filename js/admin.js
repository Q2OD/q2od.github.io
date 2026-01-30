/**
 * Admin Panel Logic
 * Handles authentication, gallery management, and file uploads
 */

const { auth, db, generateUUID, hashPassword, formatFileSize, formatTimestamp } = window.firebaseInit;
const uploadManager = new UploadManager();

let currentGalleryId = null;

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
auth.onAuthStateChanged(user => {
  if (user) {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadDashboard();
  } else {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginError.classList.add('hidden');
  } catch (error) {
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
  }
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
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

    const galleryData = {
      galleryId,
      clientName,
      eventName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      password: passwordHash,
      expiresAt: null,
      isActive: true,
      shareableLink,
      photoCount: 0,
      videoCount: 0,
      viewCount: 0,
      downloadCount: 0
    };

    await db.collection('galleries').doc(galleryId).set(galleryData);

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
    const galleriesSnapshot = await db.collection('galleries').get();
    const mediaSnapshot = await db.collection('media').get();

    let totalViews = 0;
    galleriesSnapshot.forEach(doc => {
      totalViews += doc.data().viewCount || 0;
    });

    document.getElementById('statTotalGalleries').textContent = galleriesSnapshot.size;
    document.getElementById('statTotalMedia').textContent = mediaSnapshot.size;
    document.getElementById('statTotalViews').textContent = totalViews;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load Galleries
async function loadGalleries() {
  try {
    const snapshot = await db.collection('galleries').orderBy('createdAt', 'desc').get();

    if (snapshot.empty) {
      galleriesList.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    galleriesList.innerHTML = '';

    snapshot.forEach(doc => {
      const gallery = doc.data();
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
        <h3 class="font-display text-2xl text-gradient mb-1">${gallery.clientName}</h3>
        <p class="text-paper/60 text-sm">${gallery.eventName}</p>
      </div>
      <div class="flex gap-2">
        <button
          class="upload-btn px-4 py-2 bg-blaze hover:bg-blaze2 rounded-lg font-semibold transition-colors text-sm"
          data-gallery-id="${gallery.galleryId}"
        >
          Upload
        </button>
        <button
          class="copy-btn px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors text-sm"
          data-gallery-id="${gallery.galleryId}"
          data-link="${gallery.shareableLink}"
        >
          Copy Link
        </button>
        <button
          class="delete-btn px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg border border-red-600/30 transition-colors text-sm text-red-400"
          data-gallery-id="${gallery.galleryId}"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
      <div>
        <div class="text-xs text-paper/60 mb-1">Photos</div>
        <div class="text-lg font-semibold">${gallery.photoCount || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Videos</div>
        <div class="text-lg font-semibold">${gallery.videoCount || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Views</div>
        <div class="text-lg font-semibold">${gallery.viewCount || 0}</div>
      </div>
      <div>
        <div class="text-xs text-paper/60 mb-1">Downloads</div>
        <div class="text-lg font-semibold">${gallery.downloadCount || 0}</div>
      </div>
    </div>

    <div class="flex items-center gap-4 text-xs text-paper/60">
      <div>Created: ${formatTimestamp(gallery.createdAt)}</div>
      <div>ID: ${gallery.galleryId.substring(0, 8)}...</div>
    </div>
  `;

  // Upload button
  card.querySelector('.upload-btn').addEventListener('click', () => {
    currentGalleryId = gallery.galleryId;
    uploadMediaModal.classList.remove('hidden');
  });

  // Copy link button
  card.querySelector('.copy-btn').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(gallery.shareableLink);
      alert(`Link copied!\n\n${gallery.shareableLink}\n\nRemember to share the password with your client.`);
    } catch (error) {
      alert(`Link: ${gallery.shareableLink}`);
    }
  });

  // Delete button
  card.querySelector('.delete-btn').addEventListener('click', async () => {
    if (!confirm(`Delete gallery for ${gallery.clientName}?\n\nThis will delete all photos and videos. This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete all media
      await uploadManager.deleteGalleryMedia(gallery.galleryId);

      // Delete gallery
      await db.collection('galleries').doc(gallery.galleryId).delete();

      loadDashboard();
      alert('Gallery deleted successfully');
    } catch (error) {
      alert('Failed to delete gallery: ' + error.message);
    }
  });

  return card;
}
