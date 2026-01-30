# Quick Setup Checklist

Your credentials are ready! Follow these steps to get your gallery system running.

---

## ✅ What I've Done

- Updated `js/supabase-init.js` with your Supabase publishable key
- Added your R2 account ID to config
- Created `.env.example` with your R2 credentials (for Edge Functions)
- Updated `.gitignore` to protect secrets

---

## ⚠️ What You Need to Provide

### 1. Supabase Project URL

I have your publishable key, but I need your **Project URL**.

**Where to find it:**
1. Go to your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy **Project URL** (looks like: `https://abcdefgh.supabase.co`)

**Then update:** `js/supabase-init.js` line 14

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co'; // ← Replace this
```

### 2. R2 Bucket Public URL (Optional but Recommended)

For simplest setup, make your R2 bucket public.

**How to get it:**
1. Go to Cloudflare R2 dashboard
2. Click on your `caleb-media` bucket (or whatever you named it)
3. Click **Settings** tab
4. Under **Public Access**, click **"Allow Access"**
5. Copy the public URL (looks like: `https://pub-xxxxx.r2.dev`)

**Then update:** `js/supabase-init.js` line 19

```javascript
publicUrl: 'https://pub-xxxxx.r2.dev' // ← Replace with your actual URL
```

**Don't have a bucket yet?** See Step 3 below.

---

## 📋 Setup Steps

### Step 1: Supabase Database Setup (5 min)

1. Go to your Supabase project
2. Click **SQL Editor** in the left sidebar
3. Click **"New query"**
4. Open `supabase-schema.sql` from this repo
5. Copy all contents and paste into SQL Editor
6. Click **"Run"** (green button)
7. Verify: Go to **Table Editor** → You should see `galleries`, `media`, `analytics` tables

**Expected result:** 3 tables created with no errors

### Step 2: Create Admin User (2 min)

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `your-email@example.com`
4. Password: Choose a strong password
5. Toggle **"Email Confirm"** to ON (skip confirmation email)
6. Click **"Create user"**

**Save your admin email and password!** You'll use this to login.

### Step 3: R2 Bucket Setup (5 min)

**If you already have a bucket, skip to Step 3b.**

#### Step 3a: Create R2 Bucket

1. Go to https://dash.cloudflare.com
2. Click **"R2"** in left sidebar
3. Click **"Create bucket"**
4. Name: `caleb-media`
5. Location: **Automatic**
6. Click **"Create bucket"**

#### Step 3b: Make Bucket Public

1. Click on your `caleb-media` bucket
2. Click **"Settings"** tab
3. Under **Public Access**, click **"Allow Access"**
4. Copy the public URL shown (e.g., `media.calebthephotoguy.com`)
5. Update `js/supabase-init.js` line 19 with this URL

**Note:** Public bucket means anyone with a direct URL can access files. Since gallery URLs are UUIDs (unguessable), this is secure enough for MVP.

### Step 4: Test Locally (3 min)

```bash
# Start local server
cd q2od.github.io
python3 -m http.server 8000

# Open http://localhost:8000/admin.html
# Login with your admin email/password
```

**What to test:**
- [ ] Login works
- [ ] Dashboard loads (shows 0 galleries, 0 media, 0 views)
- [ ] Click "Create Gallery" button opens modal
- [ ] Can create a test gallery (client name, event, password)
- [ ] Gallery appears in dashboard

### Step 5: Test Upload (5 min)

1. Click **"Upload"** on your test gallery
2. Select a small photo (< 5MB)
3. Click **"Upload Files"**
4. Wait for upload to complete

**Expected behavior:**
- Upload progress shows
- Green checkmark appears
- Gallery card shows "1" photo

**If upload fails:**
- Check browser console (F12) for errors
- Verify R2 public URL is correct
- Make sure bucket allows public uploads (CORS settings)

### Step 6: Test Client Gallery (5 min)

1. Click **"Copy Link"** on your test gallery
2. Copy the gallery password you used
3. Open gallery link in **incognito/private window**
4. Enter the password
5. Verify photo displays

**Expected behavior:**
- Password prompt appears
- Correct password grants access
- Photo displays in grid
- Clicking photo opens lightbox

### Step 7: Deploy to Production (5 min)

```bash
# Make sure you updated the Supabase URL!
git add .
git commit -m "Configure Supabase + R2"
git push origin main

# Wait 2-3 minutes for GitHub Pages to deploy
# Then test: https://calebthephotoguy.com/admin.html
```

---

## 🔍 Troubleshooting

### "Cannot read properties of undefined"
- You forgot to update `SUPABASE_URL` in `js/supabase-init.js`
- Go to Supabase dashboard → Settings → API → Copy Project URL

### Login fails
- Check admin user exists: Supabase → Authentication → Users
- Make sure "Email Confirm" is toggled ON in user settings
- Try resetting password in Supabase dashboard

### Upload fails
- Check R2 public URL is correct
- Make sure R2 bucket allows public access
- Check browser console (F12) for specific error
- Verify CORS settings on R2 bucket

### Gallery password doesn't work
- Passwords are case-sensitive
- Clear browser cache and try again

### Files don't display
- Check R2 public URL format: `https://pub-xxxxx.r2.dev` (no trailing slash)
- Verify file was actually uploaded to R2 bucket
- Check browser console for CORS errors

---

## 🚀 What's Next?

Once testing works:

1. **Delete test gallery** (use Delete button)
2. **Create real gallery** for your first client
3. **Share via Instagram DM:**
   ```
   Hey [Client]! Your photos are ready 📸

   Gallery Link: [paste link]
   Password: [paste password]

   Download any photos you want!
   ```

4. **Monitor usage:**
   - Supabase dashboard: Check database size, users
   - R2 dashboard: Check storage usage, bandwidth

---

## 📞 Need Help?

**Configuration issues?**
- Check [SETUP-SUPABASE.md](SETUP-SUPABASE.md) for detailed guide
- Look at troubleshooting section above

**R2 setup issues?**
- R2 docs: https://developers.cloudflare.com/r2
- Make sure bucket is public and has CORS enabled

**Supabase questions?**
- Supabase docs: https://supabase.com/docs
- SQL Editor is helpful for checking tables

---

## ⚠️ Security Reminder

**Safe to commit:**
- ✅ Supabase URL
- ✅ Supabase publishable key
- ✅ R2 public URL
- ✅ R2 account ID

**NEVER commit:**
- ❌ Supabase private key (service_role)
- ❌ R2 access key ID
- ❌ R2 secret access key
- ❌ Admin passwords

Your sensitive keys are in `.env.example` which is gitignored. Don't commit them!

---

**Total setup time: 30 minutes** ⏱️

**Let's get started! Update those two config values and you're ready to go.** 🎉
