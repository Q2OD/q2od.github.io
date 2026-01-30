# Gallery System Setup Guide

This guide walks you through setting up the Caleb Media Gallery System.

---

## Prerequisites

- Node.js 18+ installed
- Firebase account (free tier is fine)
- Cloudflare account (for R2, optional for MVP)

---

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it: `caleb-media-gallery`
4. Disable Google Analytics (not needed)
5. Click "Create project"

### 1.2 Enable Firebase Services

**Enable Firestore:**
1. In Firebase Console, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Choose "Start in production mode"
4. Select location (choose closest to Orlando, FL)
5. Click "Enable"

**Enable Storage:**
1. Go to "Build" → "Storage"
2. Click "Get started"
3. Keep default security rules
4. Choose same location as Firestore
5. Click "Done"

**Enable Authentication:**
1. Go to "Build" → "Authentication"
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### 1.3 Create Admin User

1. In Authentication, click "Users" tab
2. Click "Add user"
3. Enter email: `calebthephotoguy@gmail.com` (or your preferred email)
4. Enter a secure password (save this!)
5. Click "Add user"

### 1.4 Get Firebase Config

1. Click the gear icon → "Project settings"
2. Scroll to "Your apps" section
3. Click the web icon `</>`
4. Name it: `Gallery System`
5. Don't enable Firebase Hosting
6. Click "Register app"
7. Copy the `firebaseConfig` object

**Update `js/firebase-init.js`:**
Replace lines 17-23 with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## Step 2: Deploy Firebase Security Rules

### 2.1 Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2.2 Login to Firebase

```bash
firebase login
```

### 2.3 Initialize Firebase in Project

```bash
cd q2od.github.io
firebase init
```

When prompted:
- **Features:** Select "Firestore", "Functions", and "Storage" (use spacebar to select)
- **Use existing project:** Select your project
- **Firestore rules:** Use `firestore.rules`
- **Firestore indexes:** Use default
- **Language:** JavaScript
- **ESLint:** No
- **Install dependencies:** Yes
- **Storage rules:** Use `storage.rules`

### 2.4 Deploy Security Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## Step 3: Deploy Cloud Functions (Optional - For R2 Support)

### 3.1 Install Function Dependencies

```bash
cd functions
npm install
cd ..
```

### 3.2 Set R2 Credentials (If Using Cloudflare R2)

**Get R2 credentials:**
1. Go to https://dash.cloudflare.com
2. Click "R2" in sidebar
3. Create a bucket: `caleb-media-videos`
4. Click "Manage R2 API Tokens"
5. Create API token with "Edit" permissions
6. Save Access Key ID and Secret Access Key

**Set credentials:**

```bash
firebase functions:config:set r2.access_key="YOUR_R2_ACCESS_KEY"
firebase functions:config:set r2.secret_key="YOUR_R2_SECRET_KEY"
firebase functions:config:set r2.endpoint="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
firebase functions:config:set r2.bucket="caleb-media-videos"
```

### 3.3 Deploy Functions

```bash
firebase deploy --only functions
```

**Note:** For MVP, you can skip R2 setup. Videos will upload to Firebase Storage instead. R2 is only needed when you exceed Firebase's 1GB free tier.

---

## Step 4: Test Locally

### 4.1 Start Local Server

```bash
# Option 1: Python 3
python3 -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000
```

### 4.2 Test Admin Panel

1. Open http://localhost:8000/admin.html
2. Login with your admin email/password
3. Create a test gallery:
   - Client Name: "Test Client"
   - Event Name: "Test Event"
   - Password: "test123"
4. Upload test photos/videos
5. Copy the shareable link

### 4.3 Test Client Gallery

1. Open the shareable link in incognito/private window
2. Enter password: "test123"
3. Verify photos/videos display
4. Test lightbox (click on media)
5. Test download button

---

## Step 5: Deploy to GitHub Pages

### 5.1 Commit Changes

```bash
git add .
git commit -m "Add gallery system"
```

### 5.2 Push to GitHub

```bash
git push origin main
```

### 5.3 Verify Live Site

1. Wait 2-3 minutes for GitHub Pages to deploy
2. Visit https://calebthephotoguy.com/admin.html
3. Test admin login and gallery creation
4. Test client gallery access

---

## Step 6: Production Checklist

- [ ] Admin account created with secure password
- [ ] Firebase config updated in `js/firebase-init.js`
- [ ] Security rules deployed
- [ ] Test gallery created and verified
- [ ] Client gallery accessible with password
- [ ] Photos upload successfully
- [ ] Videos upload successfully
- [ ] Lightbox works on mobile and desktop
- [ ] Download button works
- [ ] Analytics tracking works (check Firestore)

---

## Security Best Practices

### ✅ Safe to Commit (Already in Repo)
- Firebase config in `js/firebase-init.js`
- All HTML/JS/CSS files
- Security rules files

### ❌ NEVER Commit
- R2 credentials (use Firebase Functions config)
- Admin passwords (stored in Firebase Auth)
- `.firebase/` directory (in .gitignore)
- `functions/node_modules/` (in .gitignore)
- `functions/.runtimeconfig.json` (in .gitignore)

### Firebase Security Layers
1. **Security Rules** enforce who can read/write
2. **Gallery UUIDs** are unguessable (can't enumerate)
3. **Hashed passwords** in Firestore (SHA-256)
4. **Admin authentication** required for management
5. **R2 presigned URLs** expire after 1 hour (optional)

---

## Common Issues

### "Permission denied" errors in Firestore
- Check Security Rules are deployed: `firebase deploy --only firestore:rules`
- Verify admin user is signed in
- Check browser console for auth errors

### Photos/videos not uploading
- Check Firebase Storage is enabled
- Verify Storage Rules are deployed: `firebase deploy --only storage:rules`
- Check browser console for CORS errors
- Ensure files are under 10MB (Firebase free tier limit)

### Gallery password not working
- Verify password is hashed correctly (check Firestore)
- Try lowercase password (passwords are case-sensitive)
- Clear browser cache and try again

### Functions not working
- Verify functions are deployed: `firebase deploy --only functions`
- Check function logs: `firebase functions:log`
- Ensure R2 credentials are set (if using R2)

---

## Cost Estimates

### At 10 clients/month (20 photos + 2 videos each)

**Firebase:**
- Firestore: Free (within 1GB)
- Storage: Free (within 1GB photos)
- Functions: Free (within 125K invocations)
- Authentication: Free (unlimited)

**Cloudflare R2 (if used):**
- Storage: Free (within 10GB)
- Egress: $0 (always free)

**Total: $0/month**

### At 30 clients/month (60 photos + 6 videos each)

**Firebase:**
- Firestore: $0.03/month (1.2GB)
- Storage: $0.03/month (1.2GB)
- Functions: $0 (still within free tier)

**Cloudflare R2:**
- Storage: $0.18/month (12GB videos)

**Total: ~$0.24/month**

---

## Next Steps

1. **Analytics Dashboard** - Add UI to view analytics data
2. **Download All as ZIP** - Implement client-side ZIP generation
3. **Gallery Expiration** - Add UI to set expiration dates
4. **Drag-and-Drop Upload** - Improve upload UX
5. **Progress Bars** - Show upload progress visually
6. **Switch to R2** - Move videos to R2 when approaching 1GB limit

---

## Support

Questions or issues? Check:
- Firebase docs: https://firebase.google.com/docs
- Cloudflare R2 docs: https://developers.cloudflare.com/r2
- GitHub repo: https://github.com/q2od/q2od.github.io

---

Built with ❤️ for Caleb Media
