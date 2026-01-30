# Deployment Checklist

Follow this checklist before deploying the gallery system to production.

---

## Pre-Deployment

### 1. Firebase Configuration ✓
- [ ] Firebase project created
- [ ] Firestore enabled (production mode)
- [ ] Storage enabled
- [ ] Authentication enabled (Email/Password)
- [ ] Admin user created (save credentials!)
- [ ] Firebase config updated in `js/firebase-init.js` (lines 17-23)

### 2. Security Rules ✓
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in to Firebase (`firebase login`)
- [ ] Project initialized (`firebase init`)
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Storage rules deployed (`firebase deploy --only storage:rules`)

### 3. Cloud Functions (Optional)
- [ ] R2 bucket created on Cloudflare
- [ ] R2 credentials obtained (Access Key + Secret)
- [ ] Function dependencies installed (`cd functions && npm install`)
- [ ] R2 config set (see SETUP.md Step 3.2)
- [ ] Functions deployed (`firebase deploy --only functions`)

### 4. Local Testing ✓
- [ ] Started local server (`python3 -m http.server 8000`)
- [ ] Admin login works (http://localhost:8000/admin.html)
- [ ] Gallery creation works
- [ ] Photo upload works
- [ ] Video upload works
- [ ] Client gallery access works
- [ ] Password protection works
- [ ] Lightbox viewer works
- [ ] Download button works
- [ ] Mobile responsive (test on phone)

---

## Deployment

### 5. Git Commit
```bash
git status                              # Check what changed
git add .                               # Stage all changes
git commit -m "Add gallery system"     # Commit with message
```

### 6. Push to GitHub
```bash
git push origin main                    # Deploy to GitHub Pages
```

### 7. Wait for Deployment
- Wait 2-3 minutes for GitHub Pages to build
- Check deployment status: https://github.com/q2od/q2od.github.io/actions

---

## Post-Deployment

### 8. Production Testing
- [ ] Visit https://calebthephotoguy.com/admin.html
- [ ] Admin login works with production credentials
- [ ] Create test gallery
- [ ] Upload test photos (2-3 files)
- [ ] Upload test video (1 file)
- [ ] Copy shareable link
- [ ] Open shareable link in incognito window
- [ ] Enter password, verify access
- [ ] View photos/videos in grid
- [ ] Open lightbox, test navigation
- [ ] Download individual files
- [ ] Check analytics in Firestore Console

### 9. Cross-Browser Testing
- [ ] Chrome (desktop)
- [ ] Safari (desktop)
- [ ] Firefox (desktop)
- [ ] Chrome (mobile)
- [ ] Safari (iOS mobile)

### 10. Security Verification
- [ ] Admin panel requires login (can't access without auth)
- [ ] Wrong password denied on client gallery
- [ ] Gallery URLs are unguessable (UUIDs)
- [ ] Firestore rules prevent unauthorized access
- [ ] Storage rules prevent unauthorized access
- [ ] R2 credentials not exposed in code

---

## Monitoring

### 11. Firebase Console Checks
- [ ] Firestore usage within limits
- [ ] Storage usage within limits
- [ ] Authentication working
- [ ] No errors in Functions logs (if deployed)

### 12. Analytics Verification
- [ ] Views tracked in Firestore (`analytics` collection)
- [ ] Downloads tracked in Firestore
- [ ] Gallery counts update correctly

---

## Rollback Plan

If something goes wrong:

### Option 1: Revert Git Commit
```bash
git log                                 # Find previous commit hash
git revert <commit-hash>                # Revert to previous version
git push origin main                    # Deploy rollback
```

### Option 2: Disable Gallery System
1. Remove links to `/admin.html` and `/gallery.html` from main site
2. Firebase backend remains but won't be accessed
3. Investigate and fix issues offline

### Option 3: Quick Fix
1. Make changes locally
2. Test thoroughly
3. Commit and push fix
4. Verify fix in production

---

## First Client Walkthrough

### Create Gallery for First Client
1. Login to https://calebthephotoguy.com/admin.html
2. Click "Create Gallery"
3. Enter:
   - Client Name: "John Smith"
   - Event Name: "Basketball Game vs Rivals - Jan 30, 2026"
   - Password: "game2026" (easy to remember, share via DM)
4. Click "Create Gallery"
5. Copy shareable link

### Upload Media
1. Click "Upload" on gallery card
2. Select 15-30 photos
3. Select 1-2 videos (if applicable)
4. Click "Upload Files"
5. Wait for completion (progress shown)

### Share with Client
Send via Instagram DM:
```
Hey John! Your highlights are ready 🔥🏀

Gallery Link:
https://calebthephotoguy.com/gallery.html?id=abc123...

Password: game2026

Download any photos/videos you want! Let me know if you have any issues.

Need more content? Just DM "BOOK" anytime!
```

### Monitor Usage
1. Check Firestore Console → `analytics` collection
2. See when client views gallery
3. See when client downloads files
4. Track most popular photos/videos

---

## Maintenance Schedule

### Daily (First Week)
- Check Firebase Console for errors
- Monitor storage usage
- Review analytics data
- Respond to client feedback

### Weekly (First Month)
- Review total galleries created
- Review total media uploaded
- Check storage approaching limits
- Update documentation if needed

### Monthly (Ongoing)
- Review Firebase usage report
- Check for Firebase SDK updates
- Backup important gallery data
- Archive old galleries if needed

---

## Success Criteria

The deployment is successful when:
- [x] Admin can login and create galleries
- [x] Admin can upload photos and videos
- [x] Clients can access galleries with password
- [x] Clients can view and download media
- [x] Analytics tracking works
- [x] No errors in Firebase Console
- [x] Site loads in < 3 seconds
- [x] Mobile experience is smooth
- [x] No security vulnerabilities

---

## Emergency Contacts

**Firebase Support:**
- Console: https://console.firebase.google.com
- Docs: https://firebase.google.com/docs
- Status: https://status.firebase.google.com

**Cloudflare R2 Support:**
- Console: https://dash.cloudflare.com
- Docs: https://developers.cloudflare.com/r2
- Status: https://www.cloudflarestatus.com

**GitHub Pages Support:**
- Docs: https://docs.github.com/pages
- Status: https://www.githubstatus.com

---

## Next Steps After Launch

1. **Week 1:** Monitor daily, fix any issues
2. **Week 2-4:** Gather client feedback
3. **Month 2:** Add analytics dashboard UI
4. **Month 3:** Add download-all-as-ZIP feature
5. **Month 4-6:** Add drag-and-drop, progress bars
6. **Month 6+:** Consider premium features

---

## Documentation Reference

- [QUICKSTART.md](QUICKSTART.md) - 15-minute setup
- [SETUP.md](SETUP.md) - Detailed setup guide
- [GALLERY.md](GALLERY.md) - System documentation
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation details

---

**Ready to deploy?** Follow this checklist step by step. Good luck! 🚀
