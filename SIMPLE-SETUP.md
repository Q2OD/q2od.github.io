# Super Simple Setup (No Edge Functions!)

Just 3 things to configure, then you're done.

---

## ✅ What's Already Done

I've configured your credentials in the code:
- ✅ Supabase publishable key
- ✅ R2 account ID
- ✅ R2 bucket name: `caleb-media-videos`

---

## 🎯 You Only Need 3 Things:

### 1. Supabase Project URL (2 min)

**Get it:**
1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings** → **API**
4. Copy **Project URL** (e.g., `https://abcdefgh.supabase.co`)

**Update:** `js/supabase-init.js` line 17:
```javascript
const SUPABASE_URL = 'https://abcdefgh.supabase.co'; // ← Paste your URL here
```

### 2. R2 Public URL (3 min)

**Get it:**
1. Go to https://dash.cloudflare.com
2. Click **R2** in sidebar
3. Click on your `caleb-media-videos` bucket
4. Click **Settings** tab
5. Under **Public Access**, click **"Allow Access"** (if not already enabled)
6. Copy the public URL shown (e.g., `media.calebthephotoguy.com`)

**Update:** `js/supabase-init.js` line 25:
```javascript
publicUrl: 'media.calebthephotoguy.com' // ← Paste your URL
```

### 3. Run Database Setup (5 min)

**Do it:**
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase-schema.sql` from your project folder
4. Copy everything and paste into SQL Editor
5. Click **"Run"** button

**Create admin user:**
1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Email: your email
4. Password: create strong password
5. Toggle **"Email Confirm"** ON
6. Click **"Create user"**

---

## 🚀 That's It! Now Test:

```bash
# Start local server
python3 -m http.server 8000

# Open http://localhost:8000/admin.html
# Login with your email/password
# Create a test gallery
# Upload a small photo (< 5MB)
```

**If it works locally, deploy:**
```bash
git add .
git commit -m "Configure Supabase + R2"
git push origin main
```

---

## ❌ No Edge Functions Needed!

The system now uses **direct uploads to public R2 bucket**.

**Pros:**
- ✅ Much simpler setup
- ✅ No serverless functions to deploy
- ✅ Faster uploads (direct to R2)
- ✅ $0 cost

**Cons:**
- ⚠️ Files are technically "public" (but URLs are unguessable UUIDs)
- ⚠️ Can't delete files from R2 (they stay but won't show in galleries)

**Security:** Gallery URLs use UUIDs which are unguessable. Even though bucket is "public", nobody can find your files without the exact URL.

---

## 🔧 Troubleshooting

### "supabase has already been declared"
- ✅ **FIXED!** Refresh your browser and clear cache

### "Cannot read properties of undefined"
- Check Supabase URL is correct (must start with `https://` and end with `.supabase.co`)

### Upload fails with CORS error
- Make sure R2 bucket allows public access
- Check R2 public URL is correct (no trailing slash)

### Login doesn't work
- Check admin user exists in Supabase **Authentication** → **Users**
- Make sure **Email Confirm** is toggled ON

---

## 💰 Cost

**Your setup:**
- Supabase: $0/month (free tier)
- R2: $0/month (10GB free, you'll use ~2-5GB)
- **Total: $0/month**

---

**That's literally it!** Update those 2 URLs and you're done. 🎉
