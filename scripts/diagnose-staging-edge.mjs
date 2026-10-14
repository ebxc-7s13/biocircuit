import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { readStagingCredential } from './staging-private.mjs'
import { writeFile } from 'node:fs/promises'
const e = loadEnv('development', process.cwd(), '')
const url = e.VITE_SUPABASE_URL
if (url !== 'https://ibxubsegrabpspopdgep.supabase.co')
  throw Error('Wrong target')
const c = createClient(url, e.VITE_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const cred = await readStagingCredential('A')
const a = await c.auth.signInWithPassword(cred)
if (a.error || !a.data.session) throw Error('Sign in unavailable')
const token = a.data.session.access_token
const h = JSON.parse(Buffer.from(token.split('.')[0], 'base64url'))
const out = {
  projectRef: 'ibxubsegrabpspopdgep',
  algorithm: ['ES256', 'RS256', 'HS256'].includes(h.alg) ? h.alg : 'other',
  probes: [],
}
const d = createClient(url, e.VITE_SUPABASE_PUBLISHABLE_KEY, {
  global: { headers: { Authorization: 'Bearer ' + token } },
  auth: { persistSession: false, autoRefreshToken: false },
})
const u = await d.auth.getUser()
out.globalHeaderCurrentUserAccepted = !u.error && !!u.data.user
for (const name of ['scholarly-search', 'avatar', 'project-images']) {
  const r = await fetch(url + '/functions/v1/' + name, {
    method: 'POST',
    headers: {
      apikey: e.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: 'Bearer ' + token,
      Origin: 'http://127.0.0.1:5190',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'biomedical imaging',
      operation: 'metadata',
    }),
    signal: AbortSignal.timeout(20000),
  })
  const body = await r.json().catch(() => ({}))
  const label =
    body.message === 'Invalid JWT'
      ? 'GATEWAY_INVALID_JWT'
      : body.error === 'Sign in required'
        ? 'HANDLER_SIGN_IN_REQUIRED'
        : body.error === 'Search unavailable. Wait and retry.'
          ? 'HANDLER_SEARCH_RESTRICTED'
          : 'OTHER_RESPONSE_REDACTED'
  out.probes.push({
    function: name,
    status: r.status,
    classification: label,
    exactCors:
      r.headers.get('access-control-allow-origin') === 'http://127.0.0.1:5190',
  })
}
await c.auth.signOut({ scope: 'local' })
cred.email = ''
cred.password = ''
const file = 'docs/verification/cloud/edge-auth-diagnostic.json'
await writeFile(file, JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify(out))
