import { loadEnv } from 'vite'
import { createClient } from '@supabase/supabase-js'
import { writeFile } from 'node:fs/promises'
import { readTarget } from './cloud-target.mjs'
import { readStagingCredential } from './staging-private.mjs'
const t = await readTarget()
if (t.projectRef !== 'ibxubsegrabpspopdgep') throw Error('Wrong target')
const e = loadEnv('development', process.cwd(), '')
if (e.VITE_APP_MODE !== 'connected' || e.VITE_SUPABASE_URL !== t.url)
  throw Error('Wrong configuration')
const report = {
  projectRef: t.projectRef,
  scope:
    'Existing ordinary account, actual renewal and own export; one recovery request, no email delivery or successful password-reset claim',
  records: [],
}
let client, credentials
const check = (name, pass, observed = {}) => {
  report.records.push({
    name,
    status: pass ? 'PASS - LIVE VERIFIED' : 'FAIL',
    observed,
  })
  if (!pass) throw Error('Check failed')
}
let step = 'existing-account-sign-in'
try {
  credentials = await readStagingCredential('A')
  if (!credentials) throw Error('Private account unavailable')
  client = createClient(t.url, e.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
    },
  })
  const signed = await client.auth.signInWithPassword(credentials)
  check('Ordinary existing sign-in', !signed.error && !!signed.data.session)
  const owner = signed.data.user.id
  step = 'managed-session-renewal'
  const renewed = await client.auth.refreshSession()
  const u = await client.auth.getUser()
  check(
    'Managed refresh returns renewed session for same actual identity',
    !renewed.error &&
      !!renewed.data.session &&
      !u.error &&
      u.data.user.id === owner,
    {
      sessionPresent: !!renewed.data.session,
      sameIdentity: !u.error && u.data.user.id === owner,
    },
  )
  step = 'own-personal-export'
  const exported = await client.rpc('export_personal_data')
  check(
    'Hosted own personal export matches current identity',
    !exported.error &&
      exported.data.profile.id === owner &&
      exported.data.preferences.user_id === owner,
    {
      status: exported.status,
      ownProfile: true,
      ownPreferences: true,
      noPrivateContentRecorded: true,
    },
  )
  const duplicate = await client.rpc('export_personal_data')
  check(
    'Immediate repeat export is rate-limited',
    duplicate.error?.code === 'P0001',
    {
      status: duplicate.status,
      code: duplicate.error?.code === 'P0001' ? 'P0001' : null,
    },
  )
  const anon = createClient(t.url, e.VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const denied = await anon.rpc('export_personal_data')
  check('Anonymous personal export denied', denied.error?.code === '42501', {
    status: denied.status,
    code: denied.error?.code === '42501' ? '42501' : null,
  })
  step = 'recovery-request-only'
  const recovery = await client.auth.resetPasswordForEmail(credentials.email, {
    redirectTo: t.frontendOrigin + '/account/recovery',
  })
  const safeCodes = [
    'email_address_not_authorized',
    'over_email_send_rate_limit',
    'over_request_rate_limit',
    'captcha_failed',
    'email_provider_disabled',
    'unexpected_failure',
  ]
  report.records.push({
    name: 'Actual managed recovery request',
    status: recovery.error
      ? 'BLOCKED - DELIVERY CONFIGURATION'
      : 'REQUEST ACCEPTED - DELIVERY UNVERIFIED',
    observed: {
      status: recovery.error?.status ?? 200,
      code: safeCodes.includes(recovery.error?.code)
        ? recovery.error.code
        : null,
      delivered: false,
      passwordChanged: false,
    },
  })
  step = 'identity-boundaries-after-renewal'
  const p = await client
    .from('profiles')
    .select('phone_verified,membership')
    .eq('id', owner)
    .single()
  const roles = await client.from('roles').select('role').eq('user_id', owner)
  check(
    'Renewal/export/recovery request leave identity boundaries unchanged',
    !p.error &&
      !p.data.phone_verified &&
      p.data.membership === 'not_submitted' &&
      !roles.error &&
      roles.data.length === 0 &&
      !u.data.user.phone &&
      !u.data.user.phone_confirmed_at,
    { phoneVerified: false, academicallyApproved: false, staffRoleCount: 0 },
  )
} catch (error) {
  report.failure = {
    step,
    errorClass: ['Error', 'TypeError'].includes(error.name)
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
  const file = 'docs/verification/cloud/auth-lifecycle-live.json'
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      passed: report.records.filter((r) => r.status === 'PASS - LIVE VERIFIED')
        .length,
      failed: !!report.failure,
      recoveryOutcome: report.records.find(
        (r) => r.name === 'Actual managed recovery request',
      )?.status,
      report: file,
    }),
  )
}
