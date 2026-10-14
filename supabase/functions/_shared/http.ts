import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
export function headers(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers':
      'authorization,apikey,content-type,x-client-info',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    Vary: 'Origin',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }
}
export function reply(origin: string, status: number, value: unknown) {
  return new Response(JSON.stringify(value), {
    status,
    headers: headers(origin),
  })
}
// ALLOWED_ORIGIN is one exact origin or a comma-separated list of exact
// origins (e.g. local loopback + the published site). No wildcards/patterns.
export function allowed(req: Request) {
  const list = (Deno.env.get('ALLOWED_ORIGIN') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  const origin = req.headers.get('origin')
  if (!origin || !list.includes(origin)) return null
  return origin
}
export async function authenticate(req: Request) {
  const url = Deno.env.get('SUPABASE_URL')
  const publicKey = Deno.env.get('SUPABASE_ANON_KEY')
  const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const bearer = req.headers.get('authorization')
  if (!url || !publicKey || !secret || !bearer?.startsWith('Bearer '))
    return null
  const client = createClient(url, publicKey, {
    global: { headers: { Authorization: bearer } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) return null
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return { client, admin, user: data.user }
}
export async function body(req: Request) {
  if (Number(req.headers.get('content-length') ?? 0) > 16384)
    throw Error('Payload too large')
  const reader = req.body?.getReader()
  if (!reader) return {}
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const next = await reader.read()
    if (next.done) break
    size += next.value.length
    if (size > 16384) {
      await reader.cancel()
      throw Error('Payload too large')
    }
    chunks.push(next.value)
  }
  const joined = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.length
  }
  return JSON.parse(new TextDecoder().decode(joined)) as Record<string, unknown>
}
