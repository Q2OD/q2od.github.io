// Supabase Edge Function: Generate R2 Presigned Upload URL
// Deploy with: supabase functions deploy r2-upload-url

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Get R2 credentials from environment
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID')
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME')

    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
      throw new Error('Missing R2 configuration')
    }

    // Parse request body
    const { key, contentType } = await req.json()

    if (!key) {
      throw new Error('Missing required parameter: key')
    }

    // Generate presigned URL
    const uploadUrl = await createPresignedUrl(
      R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME,
      key,
      contentType || 'application/octet-stream'
    )

    // Generate public URL for accessing the file
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
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

async function createPresignedUrl(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucketName: string,
  key: string,
  contentType: string
): Promise<string> {
  const region = 'auto'
  const service = 's3'
  const host = `${bucketName}.${accountId}.r2.cloudflarestorage.com`

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
  const credential = `${accessKeyId}/${credentialScope}`

  const canonicalQuerystring = [
    `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
    `X-Amz-Credential=${encodeURIComponent(credential)}`,
    `X-Amz-Date=${amzDate}`,
    `X-Amz-Expires=3600`,
    `X-Amz-SignedHeaders=host`
  ].join('&')

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    canonicalQuerystring,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD'
  ].join('\n')

  const hashedRequest = await sha256(canonicalRequest)
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashedRequest
  ].join('\n')

  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service)
  const signature = await hmacHex(signingKey, stringToSign)

  return `https://${host}/${key}?${canonicalQuerystring}&X-Amz-Signature=${signature}`
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacHex(key: Uint8Array, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  )
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmac(key: Uint8Array | string, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyData = typeof key === 'string' ? encoder.encode(key) : key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    encoder.encode(message)
  )
  return new Uint8Array(signature)
}

async function getSignatureKey(
  key: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<Uint8Array> {
  const kDate = await hmac('AWS4' + key, dateStamp)
  const kRegion = await hmac(kDate, region)
  const kService = await hmac(kRegion, service)
  const kSigning = await hmac(kService, 'aws4_request')
  return kSigning
}
