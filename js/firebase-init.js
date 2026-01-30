/**
 * Firebase SDK Initialization
 * This file sets up Firebase services for the gallery system
 *
 * SECURITY NOTE: This config is SAFE to commit to public repos.
 * Firebase Security Rules enforce access control, not this config.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Firebase project at https://console.firebase.google.com
 * 2. Enable Firestore, Storage, and Authentication
 * 3. Replace the firebaseConfig below with your project's config
 * 4. Deploy Firebase Security Rules (firestore.rules, storage.rules)
 */

// Firebase configuration (replace with your project's config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase (only once)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Enable offline persistence for better UX
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: Multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: Browser not supported');
  }
});

// Helper: Generate UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Helper: Hash password (simple bcrypt-style for client-side)
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
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
  const expiry = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
  return expiry < new Date();
}

// Export for use in other files
window.firebaseInit = {
  auth,
  db,
  storage,
  generateUUID,
  hashPassword,
  verifyPassword,
  formatFileSize,
  formatTimestamp,
  isGalleryExpired
};
