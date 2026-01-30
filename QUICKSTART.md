# Gallery System Quick Start

Get your gallery system running in 15 minutes.

---

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Firebase account created
- [ ] Git installed
- [ ] Code editor (VS Code, etc.)

---

## 5-Step Setup

### 1. Create Firebase Project (3 min)

1. Go to https://console.firebase.google.com
2. Click "Add project" → Name: `caleb-media-gallery`
3. Disable Google Analytics → Create project
4. Enable **Firestore**: Build → Firestore Database → Create (production mode)
5. Enable **Storage**: Build → Storage → Get started
6. Enable **Authentication**: Build → Authentication → Get started → Email/Password

### 2. Create Admin User (1 min)

1. Authentication → Users → Add user
2. Email: `your-email@example.com`
3. Password: `your-secure-password`
4. Save credentials somewhere safe!

### 3. Get Firebase Config (2 min)

1. Project Settings (gear icon) → Your apps
2. Click web icon `</>`
3. Name: `Gallery System` → Register app
4. Copy the `firebaseConfig` object

**Edit `js/firebase-init.js` (lines 17-23):**

```javascript
const firebaseConfig = {
  apiKey: "AIza...",                    // Paste your values
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123...",
  appId: "1:123..."
};
```

### 4. Deploy Security Rules (3 min)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in project directory)
cd q2od.github.io
firebase init

# Select: Firestore, Functions, Storage
# Use existing project: your-project
# Accept all defaults

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

### 5. Test & Deploy (6 min)

```bash
# Test locally
python3 -m http.server 8000

# Visit http://localhost:8000/admin.html
# Login with your admin credentials
# Create a test gallery
# Upload test photos

# Deploy to production
git add .
git commit -m "Add gallery system"
git push origin main

# Wait 2-3 minutes, then visit:
# https://calebthephotoguy.com/admin.html
```

---

## Usage

### Create a Gallery

1. Login to `/admin.html`
2. Click "Create Gallery"
3. Enter client name, event name, password
4. Click "Create Gallery"
5. Copy shareable link + password
6. Send to client via Instagram DM

### Upload Media

1. Click "Upload" on gallery card
2. Select photos/videos
3. Click "Upload Files"
4. Wait for completion

### Share with Client

Send via Instagram DM:
```
Hey [Client]! Your photos are ready 📸

Gallery Link:
https://calebthephotoguy.com/gallery.html?id=abc123...

Password: [password]

Let me know if you have any issues!
```

---

## Troubleshooting

**"Permission denied" errors?**
- Deploy security rules: `firebase deploy --only firestore:rules,storage:rules`

**Login not working?**
- Check admin user exists in Firebase Console → Authentication
- Verify email/password are correct

**Files not uploading?**
- Check file size (max 10MB on free tier)
- Check browser console for errors
- Verify Storage is enabled in Firebase

**Gallery password not working?**
- Passwords are case-sensitive
- Clear browser cache and try again

---

## File Reference

**Config to Update:**
- `js/firebase-init.js` (lines 17-23) - Firebase config

**Admin Panel:**
- URL: `/admin.html`
- Login: Your admin email/password
- Features: Create galleries, upload media, view stats

**Client Gallery:**
- URL: `/gallery.html?id={galleryId}`
- Password: Set when creating gallery
- Features: View media, download files, fullscreen viewer

---

## Next Steps

1. **Read Full Docs**: See [GALLERY.md](GALLERY.md)
2. **Setup Guide**: See [SETUP.md](SETUP.md) for detailed instructions
3. **Add R2 Support**: See SETUP.md Step 3 (optional, for videos over 1GB)

---

## Free Tier Limits

**Firebase:**
- Storage: 1GB (photos only = 200-300 photos)
- Bandwidth: 10GB/month (360 downloads)
- Firestore: 50K reads/day (plenty for galleries)

**Cloudflare R2 (optional):**
- Storage: 10GB (20-50 videos)
- Egress: Unlimited free

**When to upgrade:**
- Over 1GB of photos → Add R2 for videos
- Over 30 clients/month → Expect ~$0.24/month cost
- Over 100 clients/month → Expect ~$2-3/month cost

---

## Support

- Full docs: [GALLERY.md](GALLERY.md)
- Setup guide: [SETUP.md](SETUP.md)
- Firebase docs: https://firebase.google.com/docs
- Common issues: See SETUP.md "Common Issues" section

---

Ready to create your first gallery? Go to `/admin.html` and get started! 🚀
