# Firebase Cloud Functions

Backend functions for Caleb Media Gallery System.

## Functions

### `uploadToR2`
Uploads videos to Cloudflare R2 storage.

**Endpoint:** `POST /uploadToR2`

**Body:** FormData
- `file` - Video file
- `galleryId` - Gallery UUID
- `filename` - Original filename

**Response:**
```json
{
  "success": true,
  "url": "https://...r2.cloudflarestorage.com/..."
}
```

### `getVideoUrl`
Generates presigned URL for video download (expires in 1 hour).

**Endpoint:** `GET /getVideoUrl?key=galleries/xxx/videos/xxx.mp4`

**Response:**
```json
{
  "success": true,
  "url": "https://...presigned_url..."
}
```

## Setup

### Install Dependencies
```bash
cd functions
npm install
```

### Set R2 Credentials
```bash
firebase functions:config:set r2.access_key="YOUR_ACCESS_KEY"
firebase functions:config:set r2.secret_key="YOUR_SECRET_KEY"
firebase functions:config:set r2.endpoint="https://ACCOUNT_ID.r2.cloudflarestorage.com"
firebase functions:config:set r2.bucket="caleb-media-videos"
```

### Deploy
```bash
firebase deploy --only functions
```

## Development

### Local Emulator
```bash
npm run serve
```

### View Logs
```bash
npm run logs
```

## Dependencies

- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `aws-sdk` - S3-compatible API for R2
- `busboy` - Multipart form parsing
- `cors` - CORS middleware

## Notes

**For MVP:** R2 functions are optional. Videos upload to Firebase Storage by default.

**When to use R2:**
- Video storage exceeds 1GB
- Need unlimited egress (Firebase charges after 1GB/day)
- Have 20+ videos uploaded

**R2 Benefits:**
- 10GB free storage (vs 1GB Firebase)
- Unlimited free egress (Firebase charges $0.12/GB)
- S3-compatible API (easy migration)

## Cost

**Firebase Functions:**
- Free tier: 125K invocations/month
- Free tier: 40K GB-seconds/month
- Typical usage: < 1K invocations/month (well within free tier)

**Cloudflare R2:**
- Free tier: 10GB storage
- Free tier: Unlimited egress
- Typical usage: 3-5GB (within free tier for 10-20 videos)

## Security

**Environment Variables:**
- R2 credentials stored in Firebase Functions config
- Never committed to repository
- Accessed via `functions.config()`

**CORS:**
- Enabled for all origins (safe for public API)
- Can restrict to specific domain if needed

**Access Control:**
- R2 bucket is private (no public access)
- Presigned URLs expire after 1 hour
- Only authenticated admins can upload

## Troubleshooting

**"Permission denied" errors:**
- Check R2 credentials are set correctly
- Verify R2 bucket exists
- Check R2 API token has Edit permissions

**"CORS" errors:**
- CORS is enabled by default
- Check browser console for specific error
- Verify Cloud Function is deployed

**Slow uploads:**
- Large videos (200-500MB) take time
- Check internet connection speed
- Consider chunked uploads for resumability

## Future Improvements

- [ ] Chunked uploads (resumable)
- [ ] Upload progress tracking
- [ ] Video transcoding (optimize size)
- [ ] Thumbnail generation
- [ ] Video compression
- [ ] Batch operations

---

See [../SETUP.md](../SETUP.md) for full setup instructions.
