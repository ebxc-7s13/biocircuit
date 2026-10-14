import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import sharp from 'sharp'
import { readTarget, assertPublicKey } from './cloud-target.mjs'

// Actual anonymous staging requests only. No Auth user creation, approval,
// privileged key, successful content write or simulated verification.
const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env }
assert.equal(env.VITE_APP_MODE, 'connected')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
const sdk = createClient(target.url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, init) =>
      fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
  },
})
const records = []
const check = (name, pass, observed) => {
  records.push({
    name,
    status: pass ? 'PASS — LIVE VERIFIED' : 'FAIL — REPAIR REQUIRED',
    observed,
  })
}
const rpc = await sdk.rpc('public_snapshot', { before_cursor: null })
check(
  'Expected public snapshot RPC exists and returns a bounded, private-data-free page',
  !rpc.error &&
    rpc.data.posts.length <= 30 &&
    [
      'applications',
      'notifications',
      'roles',
      'bookmarks',
      'preferences',
      'audit',
    ].every((name) => rpc.data[name]?.length === 0),
  {
    path: '/rest/v1/rpc/public_snapshot',
    status: rpc.status,
    code: rpc.error?.code ?? null,
  },
)
for (const table of [
  'membership_applications',
  'notifications',
  'preferences',
  'bookmarks',
  'roles',
  'avatars',
  'project_images',
]) {
  const r = await sdk.from(table).select('*').limit(1)
  check('Anonymous private read denied: ' + table, r.error?.code === '42501', {
    status: r.status,
    code: r.error?.code ?? null,
  })
}
for (const name of [
  'community_action',
  'trust_action',
  'export_personal_data',
  'community_health',
  'storage_cleanup_batch',
  'prune_retained_data',
  'reserve_scholarly_request',
  'avatar_budget',
]) {
  const args = ['community_action', 'trust_action'].includes(name)
    ? {
        action_type: 'cloud_acceptance_probe',
        payload: {},
        request_id: randomUUID(),
      }
    : {}
  const r = await sdk.rpc(name, args)
  check(
    'Anonymous privileged/member RPC denied: ' + name,
    r.error?.code === '42501',
    { status: r.status, code: r.error?.code ?? null },
  )
}
const profileAttempt = await sdk
  .from('profiles')
  .update({ membership: 'approved', phone_verified: true })
  .eq('id', randomUUID())
check(
  'Anonymous attempt to write eligibility/phone flags denied',
  profileAttempt.error?.code === '42501',
  { status: profileAttempt.status, code: profileAttempt.error?.code ?? null },
)
const roleAttempt = await sdk
  .from('roles')
  .insert({ user_id: randomUUID(), role: 'admin' })
check(
  'Anonymous role escalation denied by privilege boundary',
  roleAttempt.error?.code === '42501',
  { status: roleAttempt.status, code: roleAttempt.error?.code ?? null },
)
const search = await sdk.rpc('search_community', {
  search_text: 'biosignal',
  page_cursor: {},
})
check(
  'Real anonymous search returns bounded RLS-filtered results',
  !search.error &&
    ['posts', 'profiles', 'projects', 'papers'].every(
      (name) => search.data[name].length <= 30,
    ),
  { status: search.status, code: search.error?.code ?? null },
)
const invalidIdentity = await sdk.auth.getUser('invalid-staging-denial-probe')
check(
  'Managed Auth rejects an invalid bearer',
  !!invalidIdentity.error && !invalidIdentity.data.user,
  { status: invalidIdentity.error?.status ?? null },
)
const privateSchema = await fetch(
  target.url + '/rest/v1/rate_limits?select=*',
  {
    headers: { apikey: key, 'Accept-Profile': 'private' },
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
  },
)
const privateSchemaBody = await privateSchema.json()
check(
  'Private schema is not exposed through PostgREST',
  privateSchema.status === 406 && privateSchemaBody.code === 'PGRST106',
  { status: privateSchema.status, code: privateSchemaBody.code },
)
for (const name of [
  'scholarly-search',
  'account-delete',
  'avatar',
  'project-images',
]) {
  const endpoint = target.url + '/functions/v1/' + name
  for (const [variant, origin, expected] of [
    ['allowed', target.frontendOrigin, 200],
    ['denied', 'https://invalid.example', 403],
  ]) {
    const r = await fetch(endpoint, {
      method: 'OPTIONS',
      headers: {
        apikey: key,
        Origin: origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,apikey,content-type',
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    const allowOrigin = r.headers.get('access-control-allow-origin')
    check(
      name + ' ' + variant + '-origin preflight',
      r.status === expected &&
        (variant === 'allowed'
          ? allowOrigin === target.frontendOrigin &&
            r.headers.get('cache-control') === 'no-store'
          : allowOrigin !== '*'),
      {
        status: r.status,
        exactAllowedOrigin: allowOrigin === target.frontendOrigin,
        wildcardOrigin: allowOrigin === '*',
      },
    )
    await r.arrayBuffer()
  }
  for (const token of [null, 'invalid-staging-denial-probe']) {
    const headers = {
      apikey: key,
      Origin: target.frontendOrigin,
      'Content-Type': 'application/json',
    }
    if (token) headers.Authorization = 'Bearer ' + token
    const r = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: '{}',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    check(
      name + (token ? ' invalid' : ' missing') + ' JWT denied at gateway',
      r.status === 401,
      {
        status: r.status,
        scope: 'JWT gateway, not a successful current-user handler journey',
      },
    )
    await r.arrayBuffer()
  }
}
// Valid harmless pixels avoid claiming that MIME/decoder failure proves RLS.
// Writes are expected to fail. Unexpected success is a failure, never concealed.
for (const [bucket, extension, format, contentType] of [
  ['avatars', 'webp', 'webp', 'image/webp'],
  ['project-files', 'png', 'png', 'image/png'],
]) {
  const pixels = await sharp({
    create: { width: 2, height: 2, channels: 3, background: '#2040ff' },
  })
    .toFormat(format)
    .toBuffer()
  const r = await sdk.storage
    .from(bucket)
    .upload(randomUUID() + '/' + randomUUID() + '.' + extension, pixels, {
      contentType,
      upsert: false,
    })
  check(
    'Anonymous direct valid-image upload denied: ' + bucket,
    !!r.error &&
      /row.level|permission|not authorized|unauthorized/i.test(r.error.message),
    {
      status: r.error?.statusCode ?? r.error?.status ?? null,
      uploaded: !r.error,
    },
  )
}
const settingsResponse = await fetch(target.url + '/auth/v1/settings', {
  headers: { apikey: key },
  signal: AbortSignal.timeout(15000),
  redirect: 'error',
})
const settings = settingsResponse.ok ? await settingsResponse.json() : null
const result = {
  projectRef: target.projectRef,
  scope:
    'Actual anonymous HTTP/SQL/Storage gateway checks. No account, OTP, academic approval, real JWT role, source success, processor or deletion simulation.',
  records,
  managedAuth: {
    status: settingsResponse.status,
    phoneEnabled: settings?.external?.phone ?? null,
    phoneAutoconfirm: settings?.phone_autoconfirm ?? null,
  },
  remaining:
    'Actual phone provider/CAPTCHA, managed-user role separation and authenticated source/Storage/export/delete journeys require external configuration.',
}
await mkdir('docs/verification/cloud', { recursive: true })
await writeFile(
  'docs/verification/cloud/resume-anonymous-http.json',
  JSON.stringify(result, null, 2) + '\n',
)
console.log(JSON.stringify(result, null, 2))
if (records.some((r) => r.status.startsWith('FAIL'))) process.exitCode = 1
