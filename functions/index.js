/**
 * Firebase Cloud Functions
 * Handles R2 presigned URL generation for video uploads/downloads
 *
 * SETUP INSTRUCTIONS:
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Initialize functions: firebase init functions
 * 3. Install dependencies: cd functions && npm install
 * 4. Set R2 credentials:
 *    firebase functions:config:set r2.access_key="YOUR_R2_ACCESS_KEY"
 *    firebase functions:config:set r2.secret_key="YOUR_R2_SECRET_KEY"
 *    firebase functions:config:set r2.endpoint="YOUR_R2_ENDPOINT"
 *    firebase functions:config:set r2.bucket="YOUR_R2_BUCKET_NAME"
 * 5. Deploy: firebase deploy --only functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const AWS = require('aws-sdk');
const busboy = require('busboy');
const cors = require('cors')({ origin: true });

admin.initializeApp();

/**
 * Upload video to Cloudflare R2
 * POST /uploadToR2
 * Body: FormData with 'file', 'galleryId', 'filename'
 */
exports.uploadToR2 = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const config = functions.config();

      // Configure R2 client (compatible with S3 API)
      const s3 = new AWS.S3({
        endpoint: config.r2.endpoint,
        accessKeyId: config.r2.access_key,
        secretAccessKey: config.r2.secret_key,
        signatureVersion: 'v4',
        region: 'auto'
      });

      // Parse multipart form data
      const bb = busboy({ headers: req.headers });

      let fileBuffer = null;
      let filename = '';
      let galleryId = '';

      bb.on('file', (fieldname, file, info) => {
        filename = info.filename;
        const chunks = [];

        file.on('data', (data) => {
          chunks.push(data);
        });

        file.on('end', () => {
          fileBuffer = Buffer.concat(chunks);
        });
      });

      bb.on('field', (fieldname, val) => {
        if (fieldname === 'galleryId') galleryId = val;
        if (fieldname === 'filename') filename = val;
      });

      bb.on('finish', async () => {
        if (!fileBuffer || !galleryId || !filename) {
          res.status(400).send('Missing required fields');
          return;
        }

        try {
          // Upload to R2
          const key = `galleries/${galleryId}/videos/${Date.now()}_${filename}`;

          await s3.putObject({
            Bucket: config.r2.bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: 'video/mp4'
          }).promise();

          // Generate public URL
          const url = `${config.r2.endpoint}/${config.r2.bucket}/${key}`;

          res.status(200).json({
            success: true,
            url
          });
        } catch (error) {
          console.error('R2 upload error:', error);
          res.status(500).json({
            success: false,
            error: error.message
          });
        }
      });

      bb.end(req.rawBody);

    } catch (error) {
      console.error('Function error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * Generate presigned URL for video download
 * GET /getVideoUrl?key=galleries/xxx/videos/xxx.mp4
 */
exports.getVideoUrl = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const key = req.query.key;

      if (!key) {
        res.status(400).send('Missing key parameter');
        return;
      }

      const config = functions.config();

      const s3 = new AWS.S3({
        endpoint: config.r2.endpoint,
        accessKeyId: config.r2.access_key,
        secretAccessKey: config.r2.secret_key,
        signatureVersion: 'v4',
        region: 'auto'
      });

      // Generate presigned URL (expires in 1 hour)
      const url = s3.getSignedUrl('getObject', {
        Bucket: config.r2.bucket,
        Key: key,
        Expires: 3600 // 1 hour
      });

      res.status(200).json({
        success: true,
        url
      });

    } catch (error) {
      console.error('Presigned URL error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});
