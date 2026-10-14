import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'
import { verifyStagingBoundaries } from './staging-boundaries.mjs'
const target = await readTarget()
if (target.projectRef !== 'ibxubsegrabpspopdgep') throw Error('Wrong target')
const env = loadEnv('development', process.cwd(), '')
if (env.VITE_APP_MODE !== 'connected' || env.VITE_SUPABASE_URL !== target.url)
  throw Error('Wrong frontend')
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const report = {
  projectRef: target.projectRef,
  scope:
    'New non-destructive A safeguards only; no B impersonation, account creation, elevated flag or deletion',
  records: [],
}
let client,
  credentials,
  step = 'existing-a-sign-in'
const check = (name, pass, observed = {}) => {
  step = name
  report.records.push({
    name,
    status: pass ? 'PASS - LIVE VERIFIED' : 'FAIL',
    observed,
  })
  if (!pass) throw Error('Boundary check failed')
}
try {
  credentials = await readStagingCredential('A')
  if (!credentials) throw Error('Credentials unavailable')
  client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  })
  const a = await client.auth.signInWithPassword(credentials)
  check('Existing account A ordinary sign-in', !a.error && !!a.data.session)
  await verifyStagingBoundaries({
    client,
    target,
    publicKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    uid: a.data.user.id,
    check,
    observe: (status, detail) => report.records.push({ status, detail }),
  })
} catch (error) {
  report.failure = {
    step,
    errorClass: ['Error', 'TypeError', 'AssertionError'].includes(error.name)
      ? error.name
      : 'Error',
  }
  process.exitCode = 1
} finally {
  await client?.auth.signOut({ scope: 'local' })
  if (credentials) {
    credentials.email = ''
    credentials.password = ''
  }
  const stamp = new Date()
    .toISOString()
    .replaceAll(':', '-')
    .replaceAll('.', '-')
  const file = 'docs/verification/cloud/safe-boundaries-' + stamp + '.json'
  await mkdir('docs/verification/cloud', { recursive: true })
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      passed: report.records.filter((r) => r.status === 'PASS - LIVE VERIFIED')
        .length,
      failed: !!report.failure,
      report: file,
    }),
  )
}
