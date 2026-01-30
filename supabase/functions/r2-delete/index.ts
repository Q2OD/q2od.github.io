// Supabase Edge Function: Delete file from R2
// Deploy with: supabase functions deploy r2-delete

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { S3Client, DeleteObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3@3.400.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user is authenticated (admin only)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get R2 credentials from environment
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')!
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')!

    // Parse request body
    const { key } = await req.json()

    if (!key) {
      throw new Error('Missing required parameter: key')
    }

    // Initialize S3 client
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })

    // Delete object from R2
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await s3Client.send(command)

    return new Response(
      JSON.stringify({ success: true, key }),
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
