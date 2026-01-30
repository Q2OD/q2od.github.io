# Gallery System Setup Guide (Supabase + R2)

Complete setup instructions for the Caleb Media Gallery System using Supabase and Cloudflare R2.

---

## What You'll Get

- **Database**: Supabase PostgreSQL (500MB free)
- **Authentication**: Supabase Auth (unlimited users)
- **Storage**: Cloudflare R2 (10GB free, unlimited egress)
- **Cost**: $0/month for 20-30 clients

---

## Step 1: Create Supabase Project (5 min)

### 1.1 Sign Up for Supabase

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub/Google (free account)

### 1.2 Create New Project

1. Click "New Project"
2. Organization: Choose or create one
3. Project name: `caleb-media-gallery`
4. Database Password: Generate strong password (save it!)
5. Region: Choose closest to Orlando, FL (e.g., `us-east-1`)
6. Click "Create new project"
7. Wait 2-3 minutes for setup

### 1.3 Get Project Credentials

1. Go to **Settings** (gear icon) → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (long string)

**Save these!** You'll need them next.

---

## Step 2: Set Up Database (5 min)

### 2.1 Run Schema SQL

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase-schema.sql` from your project
4. Copy all contents and paste into SQL Editor
5. Click **"Run"**
6. Verify: Go to **Table Editor** → You should see `galleries`, `media`, `analytics` tables

### 2.2 Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `your-email@example.com`
4. Password: Create strong password (save it!)
5. Email Confirm: Toggle ON (skip email confirmation)
6. Click **"Create user"**

**Save your admin email and password!**

---

## Step 3: Configure Project Files (3 min)

### 3.1 Update Supabase Config

Edit `js/supabase-init.js` (lines 13-14):

```javascript
// Replace with YOUR values from Step 1.3
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbG...your-anon-key...';
```

### 3.2 Test Locally

```bash
# Start local server
python3 -m http.server 8000

# Open http://localhost:8000/admin.html
# Try logging in with your admin email/password
# If login works, Supabase is configured correctly!
```

---

## Step 4: Set Up Cloudflare R2 (10 min)

### 4.1 Create Cloudflare Account

1. Go to https://dash.cloudflare.com
2. Sign up (free account, no credit card needed for R2 free tier)
3. Verify email

### 4.2 Enable R2

1. In Cloudflare dashboard, click **"R2"** in left sidebar
2. If prompted, click **"Purchase R2"** (it's free, just enabling the service)
3. Click **"Create bucket"**
4. Name: `caleb-media`
5. Location: **Automatic** (or closest to you)
6. Click **"Create bucket"**

### 4.3 Make Bucket Public (Simplest Option)

**Option A: Public Bucket** (easiest, recommended for MVP)

1. Click on your `caleb-media` bucket
2. Click **"Settings"** tab
3. Under **"Public Access"**, click **"Allow Access"**
4. Click **"Connect Domain"** (or use the default `pub-xxxxx.r2.dev` URL)
5. Copy the public bucket URL (e.g., `https://pub-12345.r2.dev`)

Update `js/supabase-init.js` (line 16):

```javascript
const R2_CONFIG = {
  accountId: 'YOUR_ACCOUNT_ID', // Found in R2 dashboard URL
  bucketName: 'caleb-media',
  publicUrl: 'https://pub-12345.r2.dev' // Your public R2 URL
};
```

**With public bucket, you're done! No Edge Functions needed.**

---

### 4.4 Private Bucket with Presigned URLs (Optional, More Secure)

**Option B: Private Bucket + Edge Functions** (production recommended)

If you want more security, keep bucket private and use Edge Functions:

1. Create R2 API Token:
   - In R2 dashboard, click **"Manage R2 API Tokens"**
   - Click **"Create API Token"**
   - Name: `gallery-system`
   - Permissions: **"Admin Read & Write"**
   - Click **"Create API Token"**
   - **Save the Access Key ID and Secret Access Key!**

2. Install Supabase CLI:
```bash
npm install -g supabase
```

3. Login and link project:
```bash
supabase login
supabase link --project-ref your-project-ref
```

4. Set R2 environment variables:
```bash
supabase secrets set R2_ACCOUNT_ID=your_account_id
supabase secrets set R2_ACCESS_KEY_ID=your_access_key_id
supabase secrets set R2_SECRET_ACCESS_KEY=your_secret_access_key
supabase secrets set R2_BUCKET_NAME=caleb-media
```

5. Deploy Edge Functions:
```bash
supabase functions deploy r2-upload-url
supabase functions deploy r2-delete
```

6. Update `js/supabase-init.js`:
```javascript
const R2_CONFIG = {
  accountId: 'YOUR_ACCOUNT_ID',
  bucketName: 'caleb-media',
  // Remove or comment out publicUrl to use Edge Functions
  // publicUrl: '...'
};
```

---

## Step 5: Deploy to GitHub Pages (5 min)

### 5.1 Commit Changes

```bash
git add .
git commit -m "Switch to Supabase + R2"
git push origin main
```

### 5.2 Wait for Deployment

- GitHub Pages auto-deploys in 2-3 minutes
- Check status: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

### 5.3 Test Live Site

1. Visit `https://calebthephotoguy.com/admin.html`
2. Login with admin credentials
3. Create test gallery
4. Upload test photo (< 5MB)
5. Copy gallery link
6. Open link in incognito/private window
7. Enter password, verify gallery loads

---

## Step 6: Verification Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (3 tables exist)
- [ ] Admin user created
- [ ] Supabase config updated in `supabase-init.js`
- [ ] R2 bucket created (public or private)
- [ ] R2 config updated in `supabase-init.js`
- [ ] Local testing successful
- [ ] Code pushed to GitHub
- [ ] Production admin login works
- [ ] Gallery creation works
- [ ] File upload works (test with 1 photo)
- [ ] Client gallery access works with password
- [ ] Lightbox viewer works

---

## Troubleshooting

### "Cannot read properties of undefined"
- Check Supabase URL and anon key are correct
- Verify you copied the **anon public** key, not service_role key

### "Failed to fetch" or CORS errors
- Check Supabase project is active (not paused)
- Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)

### Login fails with correct password
- Check admin user exists in Supabase **Authentication → Users**
- Verify Email Confirm is toggled ON in user settings
- Try resetting password in Supabase dashboard

### Upload fails
- **Public R2**: Check public URL is correct and bucket allows public access
- **Private R2**: Verify Edge Functions are deployed and secrets are set
- Check file size (< 100MB for R2 free tier)
- Check browser console for specific error

### Gallery password doesn't work
- Passwords are case-sensitive
- Clear browser cache and try again
- Check `password_hash` exists in Supabase **Table Editor → galleries**

### Files don't display
- **Public R2**: Check public URL format is correct
- **Private R2**: Check Edge Function `r2-upload-url` returns valid URLs
- Open browser console, check for CORS or 404 errors

---

## Cost Breakdown

### Supabase Free Tier
- Database: 500MB (plenty for metadata)
- Bandwidth: 5GB/month egress
- Users: Unlimited
- Edge Functions: 500K invocations/month

### Cloudflare R2 Free Tier
- Storage: 10GB (20-50 videos, 2000-3000 photos)
- Egress: **Unlimited** (no bandwidth charges!)
- Operations: 1M Class A/month, 10M Class B/month

### Real-World Usage

**At 10 clients/month:**
- Database: ~10MB (well under 500MB)
- R2 Storage: ~2GB (well under 10GB)
- **Cost: $0/month**

**At 30 clients/month:**
- Database: ~30MB (still under 500MB)
- R2 Storage: ~6GB (still under 10GB)
- **Cost: $0/month**

**At 50+ clients/month:**
- May exceed 10GB storage: R2 charges $0.015/GB/month
- Example: 15GB storage = $0.075/month (7.5 cents)
- Still incredibly cheap!

---

## Public vs Private R2 Bucket

### Public Bucket (Recommended for MVP)
✅ Simpler setup (no Edge Functions)
✅ Direct uploads from browser
✅ No API call costs
✅ Faster uploads (direct to R2)

⚠️ Anyone with URL can access files
⚠️ Gallery URLs are unguessable (UUIDs provide security)

### Private Bucket + Edge Functions
✅ More secure (presigned URLs)
✅ URLs expire after 1 hour
✅ Better for sensitive content

⚠️ More complex setup
⚠️ Requires Supabase Edge Functions
⚠️ Uses Edge Function invocations

**Recommendation:** Start with public bucket for MVP. Switch to private later if needed.

---

## Next Steps

1. **Create your first real gallery** for a client
2. **Share with client** via Instagram DM
3. **Monitor usage** in Supabase and R2 dashboards
4. **Add features** as needed (analytics UI, download-all, etc.)

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **R2 Docs**: https://developers.cloudflare.com/r2
- **GitHub Issues**: Report bugs in your repo

---

## Differences from Firebase

| Feature | Firebase | Supabase |
|---------|----------|----------|
| Database | Firestore (NoSQL) | PostgreSQL (SQL) |
| Storage Free Tier | 1GB | N/A (using R2: 10GB) |
| Bandwidth | 1GB/day free | 5GB/month (+ unlimited R2) |
| Auth | Firebase Auth | Supabase Auth |
| Queries | `.get()`, `.where()` | `.select()`, `.eq()` |
| Real-time | Yes | Yes (optional) |
| Dashboard | Firebase Console | Supabase Dashboard |

**Key advantages of Supabase:**
- More familiar SQL instead of NoSQL
- Better free tier for database
- R2 unlimited egress (Firebase charges $0.12/GB)
- Simpler authentication setup
- Open source (can self-host later)

---

**Ready to launch?** Follow this guide step by step and you'll be live in 30 minutes! 🚀
