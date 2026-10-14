import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { writeFile } from 'node:fs/promises'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'

const report = {
  projectRef: 'ibxubsegrabpspopdgep',
  scope:
    'Real current-user refresh/global logout; existing controlled accounts only; no password, profile or role change',
  checks: [],
}
let step = 'target'
const clients = []
const check = (name, pass, observed = {}) => {
  assert.ok(pass)
  report.checks.push({ name, passed: true, ...observed })
}
try {
  const target = await readTarget(),
    env = loadEnv('development', process.cwd(), '')
  assert.equal(target.projectRef, report.projectRef)
  assert.equal(env.VITE_SUPABASE_URL, target.url)
  assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  const credentials = {
    A: await readStagingCredential('A'),
    B: await readStagingCredential('B'),
  }
  const users = []
  for (const label of ['A', 'A', 'B']) {
    step = 'ordinary-login-' + label
    const client = createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
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
    clients.push(client)
    const login = await client.auth.signInWithPassword(credentials[label])
    assert.ok(!login.error && login.data.session)
    users.push(login.data.user.id)
  }
  check(
    'Two independent A sessions and distinct B identity authenticated',
    users[0] === users[1] && users[0] !== users[2],
  )
  for (const c of Object.values(credentials)) {
    c.email = ''
    c.password = ''
  }
  step = 'managed-renewal'
  const renewed = await clients[1].auth.refreshSession()
  check(
    'Managed A renewal returns same identity',
    !renewed.error && renewed.data.user?.id === users[0],
  )
  step = 'global-A-logout'
  const logout = await clients[0].auth.signOut({ scope: 'global' })
  check(
    'Actual global logout accepted and initiating session cleared',
    !logout.error && !(await clients[0].auth.getSession()).data.session,
  )
  step = 'revoked-A-renewal'
  const refused = await clients[1].auth.refreshSession()
  const allowedCodes = [
    'refresh_token_not_found',
    'refresh_token_already_used',
    'session_not_found',
  ]
  check(
    'Other A refresh rejected by hosted Auth after global logout',
    Boolean(refused.error) &&
      allowedCodes.includes(refused.error.code) &&
      !refused.data.session,
    {
      httpStatus: refused.error?.status,
      errorCode: allowedCodes.includes(refused.error?.code)
        ? refused.error.code
        : null,
    },
  )
  step = 'unrelated-B-renewal'
  const independent = await clients[2].auth.refreshSession()
  check(
    'B remains authenticated and renews after A global logout',
    !independent.error && independent.data.user?.id === users[2],
  )
  report.limit =
    'Existing signed access JWTs may remain valid until expiry per managed Auth design; this test proves refresh revocation, not immediate access-JWT invalidation.'
} catch {
  report.failed = true
  report.failureStep = step
  process.exitCode = 1
} finally {
  for (const client of clients) await client.auth.signOut({ scope: 'local' })
  const file = `docs/verification/cloud/revocation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      file,
      passed: report.checks.length,
      failed: Boolean(report.failed),
      step: report.failed ? step : 'complete',
    }),
  )
}
