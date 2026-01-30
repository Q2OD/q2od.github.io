// Supabase Edge Function: Generate R2 Presigned Upload URL
// Deploy with: supabase functions deploy r2-upload-url

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.400.0'
import { getSignedUrl } from 'https://esm.sh/@aws-sdk/s3-request-presigner@3.400.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'calebthephotoguy.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get R2 credentials from environment
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')!

    // Parse request body
    const { key, contentType } = await req.json()

    if (!key) {
      throw new Error('Missing required parameter: key')
    }

    // Initialize S3 client (R2 is S3-compatible)
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    // Generate presigned URL for upload (valid for 1 hour)
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    // Generate public URL for accessing the file (using custom domain)
    const publicUrl = `https://media.calebthephotoguy.com/${key}`

    return new Response(
      JSON.stringify({
        uploadUrl,
        publicUrl,
        key,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
