import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { writeFile } from 'node:fs/promises'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import {
  readStagingCredential,
  protectStagingBaseline,
  readProtectedBaseline,
} from './staging-private.mjs'
import { restorePersonalCore } from './restore-personal-core.mjs'

const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const report = {
  projectRef: 'ibxubsegrabpspopdgep',
  records: [],
  remoteWrites: 0,
  remoteResets: 0,
}
let step = 'target'
try {
  const target = await readTarget()
  assert.equal(target.projectRef, report.projectRef)
  const env = loadEnv('development', process.cwd(), '')
  assert.equal(env.VITE_SUPABASE_URL, target.url)
  assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
  for (const label of ['A', 'B']) {
    step = label + ':sign-in'
    const credential = await readStagingCredential(label)
    assert.ok(credential)
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
    try {
      const login = await client.auth.signInWithPassword(credential)
      assert.ok(!login.error && login.data.session)
      const actor = login.data.user.id
      const current = await client.auth.getUser()
      assert.ok(
        !current.error &&
          current.data.user.id === actor &&
          !current.data.user.phone_confirmed_at,
      )
      step = label + ':owner-export'
      const exported = await client.rpc('export_personal_data')
      assert.ok(
        !exported.error &&
          exported.data.profile.id === actor &&
          exported.data.preferences.user_id === actor,
      )
      report.records.push({
        account: label,
        name: 'Hosted owner-scoped export accepted',
        status: exported.status,
        passed: true,
      })
      const snapshot = {
        version: 1,
        projectRef: target.projectRef,
        data: exported.data,
      }
      step = label + ':DPAPI-roundtrip'
      const privateFile = await protectStagingBaseline(
        snapshot,
        stamp + '-' + (label === 'A' ? '1' : '2'),
      )
      const decoded = await readProtectedBaseline(privateFile)
      assert.deepEqual(decoded, snapshot)
      report.records.push({
        account: label,
        name: 'Encrypted DPAPI export decrypts exactly; no plaintext file',
        passed: true,
      })
      step = label + ':local-restore'
      const result = await restorePersonalCore(decoded, actor)
      report.records.push({
        account: label,
        name: 'Owner export core restored to independent local PostgreSQL',
        passed: true,
        result,
      })
      for (const invalid of [
        { ...decoded, version: 0 },
        { ...decoded, projectRef: 'wrong' },
        {
          ...decoded,
          data: {
            ...decoded.data,
            preferences: {
              ...decoded.data.preferences,
              user_id: 'not-an-owner',
            },
          },
        },
      ]) {
        await assert.rejects(restorePersonalCore(invalid, actor))
      }
      report.records.push({
        account: label,
        name: 'Invalid version, target and cross-owner restore inputs rejected locally',
        passed: true,
      })
    } finally {
      await client.auth.signOut()
    }
  }
} catch {
  report.failed = true
  report.failureStep = step
  process.exitCode = 1
} finally {
  const file = 'docs/verification/cloud/personal-recovery-' + stamp + '.json'
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(
    JSON.stringify({
      file,
      passed: report.records.filter((x) => x.passed).length,
      failed: Boolean(report.failed),
      step: report.failed ? step : 'complete',
    }),
  )
}
