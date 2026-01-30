# Client Gallery System

Password-protected photo and video galleries for Caleb Media clients.

## Features

### For Clients
- Password-protected access to their photos/videos
- Responsive grid layout (mobile-friendly)
- Fullscreen lightbox viewer
- Individual file downloads
- No account creation needed

### For Admin
- Secure admin panel with Firebase Auth
- Create galleries with client info and password
- Upload photos (Firebase Storage) and videos (Firebase Storage/R2)
- Track views and downloads
- Delete galleries and media
- Copy shareable links

## Architecture

**Frontend:** Vanilla JavaScript + Tailwind CSS (CDN)
**Database:** Firebase Firestore
**Storage:** Firebase Storage (photos) + Cloudflare R2 (videos, optional)
**Auth:** Firebase Authentication (admin only)
**Backend:** Firebase Cloud Functions (for R2 integration)

## File Structure

```
q2od.github.io/
├── admin.html              # Admin panel UI
├── gallery.html            # Client gallery viewer
├── js/
│   ├── firebase-init.js    # Firebase SDK setup
│   ├── admin.js            # Admin panel logic
│   ├── gallery.js          # Gallery viewer logic
│   ├── upload-manager.js   # File upload handling
│   └── lightbox.js         # Fullscreen viewer
├── functions/
│   ├── index.js            # Cloud Functions (R2 integration)
│   └── package.json        # Function dependencies
├── firestore.rules         # Firestore security rules
├── storage.rules           # Storage security rules
└── SETUP.md                # Setup instructions
```

## Data Model

### Firestore Collections

**galleries/**
- `galleryId` (string, UUID)
- `clientName` (string)
- `eventName` (string)
- `password` (string, SHA-256 hash)
- `shareableLink` (string)
- `photoCount` (number)
- `videoCount` (number)
- `viewCount` (number)
- `downloadCount` (number)
- `createdAt` (timestamp)
- `expiresAt` (timestamp, nullable)
- `isActive` (boolean)

**media/**
- `mediaId` (string, UUID)
- `galleryId` (string, foreign key)
- `type` (string: "photo" | "video")
- `storageUrl` (string)
- `filename` (string)
- `fileSizeBytes` (number)
- `uploadedAt` (timestamp)
- `sortOrder` (number)

**analytics/**
- `galleryId` (string)
- `type` (string: "view" | "download" | "download_all")
- `timestamp` (timestamp)
- `mediaId` (string, nullable)

## Security

### Safe to Commit to Public Repo
✅ Firebase config (enforced by Security Rules)
✅ All HTML/JS/CSS files
✅ Security Rules files
✅ Cloud Functions code

### Never Commit
❌ R2 credentials (stored in Firebase Functions config)
❌ Admin passwords (stored in Firebase Auth)
❌ `.firebase/` directory
❌ `functions/node_modules/`

### Security Layers
1. Firebase Security Rules (enforce access control)
2. Gallery UUIDs (unguessable, can't enumerate)
3. Hashed passwords (SHA-256 in Firestore)
4. Admin authentication (Firebase Auth)
5. R2 presigned URLs (expire after 1 hour)

## URLs

**Admin Panel:**
- https://calebthephotoguy.com/admin.html

**Client Gallery:**
- https://calebthephotoguy.com/gallery.html?id={galleryId}
- Password provided separately via Instagram DM

## Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

Quick start:
1. Create Firebase project
2. Enable Firestore, Storage, Authentication
3. Create admin user
4. Update Firebase config in `js/firebase-init.js`
5. Deploy security rules: `firebase deploy --only firestore:rules,storage:rules`
6. Test locally: `python3 -m http.server 8000`
7. Deploy: `git push origin main`

## Cost Estimates

**Free tier (10-20 clients/month):** $0/month
- Firebase: Within free tier (1GB storage, 10GB bandwidth)
- R2: Within free tier (10GB storage, unlimited egress)

**30 clients/month:** ~$0.24/month
- Firebase: $0.06 (over 1GB storage)
- R2: $0.18 (over 10GB storage)

## Tech Decisions

### Why Vanilla JS?
- Matches existing codebase
- No build process needed
- Simpler deployment
- Smaller bundle size

### Why Firebase?
- Free tier sufficient for MVP
- Easy authentication
- Real-time database
- Generous storage limits

### Why R2 for Videos?
- 10GB free storage (vs 1GB on Firebase)
- Unlimited free egress (Firebase charges)
- S3-compatible API (easy integration)

### Why Hybrid Storage?
- Photos: Small files (1-5MB) → Firebase Storage
- Videos: Large files (200-500MB) → Cloudflare R2
- Maximizes free tier usage

## Future Enhancements

- [ ] Analytics dashboard UI
- [ ] Download all as ZIP
- [ ] Gallery expiration dates UI
- [ ] Drag-and-drop upload
- [ ] Upload progress bars
- [ ] Gallery editing (change password, etc.)
- [ ] Reorder media (manual sorting)
- [ ] Bulk delete media

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

Mobile browsers supported on iOS 14+ and Android 10+.

## Performance

- Lazy loading images (native `loading="lazy"`)
- Firestore offline persistence
- Firebase CDN for media delivery
- Tailwind CSS via CDN (no build)

## Troubleshooting

See [SETUP.md](SETUP.md) "Common Issues" section.

---

Built for Caleb Media | January 2026
