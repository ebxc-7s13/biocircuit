import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { chromium, expect } from '@playwright/test'
import { loadEnv } from 'vite'
import { verifyStagingBoundaries } from './staging-boundaries.mjs'
import { readTarget, assertPublicKey } from './cloud-target.mjs'
import {
  readStagingCredential,
  protectStagingBaseline,
} from './staging-private.mjs'

const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const env = loadEnv('development', process.cwd(), '')
assert.equal(env.VITE_APP_MODE, 'connected')
assert.equal(env.VITE_SUPABASE_URL, target.url)
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
assert.ok(
  process.argv
    .slice(2)
    .every((x) =>
      ['--register-second-account', '--cross-user-only'].includes(x),
    ),
)
const crossUserOnly = process.argv.includes('--cross-user-only')
const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const file = `docs/verification/cloud/persistence-${stamp}.json`
const report = {
  projectRef: target.projectRef,
  scope:
    'Real staging persistence; two independent ordinary identities only when controlled credentials supplied. No approval, phone flag, privileged role, admin Auth, delete or reset.',
  mode: crossUserOnly ? 'cross-user-only' : 'full-persistence',
  records: [],
  browser: { uncaughtErrors: 0, consoleErrors: 0, signupRequests: 0 },
  restoration: [],
}
let step = 'read-private-credentials'
let accountLabel = 'A'
const code = (value) =>
  [
    '42501',
    '23514',
    '23505',
    'P0001',
    'PGRST106',
    'PGRST202',
    'invalid_credentials',
    'user_already_exists',
    'over_request_rate_limit',
    'ERR_ASSERTION',
  ].includes(value)
    ? value
    : null
const check = (name, pass, observed = {}) => {
  report.records.push({
    name,
    account: accountLabel,
    status: pass ? 'PASS - LIVE VERIFIED' : 'FAIL - REPAIR REQUIRED',
    observed,
  })
  if (!pass) throw Error('Acceptance check failed')
}
const blocked = (name, detail) =>
  report.records.push({
    name,
    status: 'BLOCKED - EXTERNAL DEPENDENCY',
    observed: { detail },
  })
const options = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: (url, init) =>
      fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
  },
}
const makeClient = () =>
  createClient(target.url, env.VITE_SUPABASE_PUBLISHABLE_KEY, options)
const fields = [
  'name',
  'handle',
  'institution',
  'degree',
  'bio',
  'methods',
  'equipment',
  'interests',
  'available',
  'visibility',
]
const pick = (value) => Object.fromEntries(fields.map((k) => [k, value[k]]))
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const accounts = []
let browser, server
let pageForDiagnostics
try {
  const a = await readStagingCredential('A')
  if (!a) {
    blocked(
      'Account A unavailable',
      'Private existing A credentials required; no identity simulated',
    )
    process.exitCode = 2
  } else {
    const b = await readStagingCredential('B')
    if (b) assert.notEqual(a.email.toLowerCase(), b.email.toLowerCase())
    for (const [label, credentials] of [['A', a], ...(b ? [['B', b]] : [])]) {
      accountLabel = label
      step = 'ordinary-managed-authentication'
      const client = makeClient()
      const auth =
        label === 'B' && process.argv.includes('--register-second-account')
          ? await client.auth.signUp(credentials)
          : await client.auth.signInWithPassword(credentials)
      check(
        'Ordinary managed ' +
          (label === 'B' && process.argv.includes('--register-second-account')
            ? 'signup'
            : 'existing-account sign-in'),
        !auth.error && !!auth.data.session,
        {
          status: auth.error?.status ?? 200,
          code: code(auth.error?.code),
          sessionPresent: !!auth.data.session,
        },
      )
      const user = await client.auth.getUser()
      check(
        'Actual managed user has no phone confirmation',
        !user.error &&
          !user.data.user.phone &&
          !user.data.user.phone_confirmed_at,
      )
      const uid = user.data.user.id
      const p = await client.from('profiles').select('*').eq('id', uid).single()
      check(
        'Ordinary profile remains unverified, unapproved and unsuspended',
        !p.error &&
          !p.data.phone_verified &&
          p.data.membership === 'not_submitted' &&
          !p.data.suspended,
        { status: p.status },
      )
      const roles = await client.from('roles').select('role').eq('user_id', uid)
      check('No staff role assigned', !roles.error && roles.data.length === 0, {
        status: roles.status,
        roleCount: roles.data?.length,
      })
      const pref = await client
        .from('preferences')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
      check('Own baseline preferences readable', !pref.error, {
        status: pref.status,
        rowPresent: !!pref.data,
      })
      const marker = randomUUID().replaceAll('-', '').slice(0, 12)
      const fixture = {
        ...pick(p.data),
        name: `Staging persistence ${label}`,
        handle: `phase2_${label.toLowerCase()}_${marker}`,
        bio: `Nonclinical staging isolation fixture for account ${label}.`,
        interests: ['Biomedical imaging'],
        visibility: 'private',
      }
      accounts.push({
        label,
        credentials,
        client,
        uid,
        baselineProfile: pick(p.data),
        baselinePref: pref.data,
        fixture,
        profileWritten: false,
        prefWritten: false,
      })
    }
    if (accounts.length === 2)
      check(
        'Independent actual Auth identities differ',
        accounts[0].uid !== accounts[1].uid,
      )
    step = 'encrypt-baseline-before-writes'
    report.privateBaseline = await protectStagingBaseline(
      accounts.map((x) => ({
        label: x.label,
        profile: x.baselineProfile,
        preferences: x.baselinePref,
      })),
      stamp,
    )
    // Fails if another server (e.g. npm run recovery:serve) holds the exact origin.
    step = 'reserve-exact-frontend-origin'
    const reservation = createServer()
    await new Promise((resolve, reject) => {
      reservation.once('error', reject)
      reservation.listen(
        Number(new URL(target.frontendOrigin).port),
        '127.0.0.1',
        resolve,
      )
    })
    await new Promise((r) => reservation.close(r))
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        '--host',
        '127.0.0.1',
        '--port',
        new URL(target.frontendOrigin).port,
        '--strictPort',
      ],
      {
        windowsHide: true,
        stdio: 'ignore',
        env: { ...process.env, VITE_APP_MODE: 'connected' },
      },
    )
    for (let n = 0; n < 100; n++) {
      if (server.exitCode !== null) throw Error('Local server unavailable')
      try {
        if ((await fetch(target.frontendOrigin)).ok) break
      } catch {
        /* Startup */
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    browser = await chromium.launch({ headless: true })
    const state = async (x) => {
      const p = await x.client
        .from('profiles')
        .select('*')
        .eq('id', x.uid)
        .single()
      const v = await x.client
        .from('preferences')
        .select('*')
        .eq('user_id', x.uid)
        .single()
      return { profile: p.data, pref: v.data, error: p.error || v.error }
    }
    const invoke = (x, type, payload, id = randomUUID()) =>
      x.client.rpc('community_action', {
        action_type: type,
        payload,
        request_id: id,
      })
    const uiLogin = async (x) => {
      accountLabel = x.label
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      })
      const page = await context.newPage()
      page.on('request', (r) => {
        if (new URL(r.url()).pathname === '/auth/v1/signup')
          report.browser.signupRequests++
      })
      pageForDiagnostics = page
      page.on('pageerror', () => report.browser.uncaughtErrors++)
      page.on('console', (m) => {
        if (m.type() !== 'error') return
        report.browser.consoleErrors++
        // Sanitized class only: HTTP status + same-service path, never text, ids or queries.
        let path = 'other'
        try {
          const u = new URL(m.location().url)
          if ([target.url, target.frontendOrigin].includes(u.origin))
            path = u.pathname.replace(/[0-9a-f-]{36}/gi, ':id')
        } catch {
          /* no location */
        }
        const status = /status of (\d{3})/.exec(m.text())?.[1] ?? 'none'
        ;(report.browser.consoleErrorKinds ??= []).push({ status, path, step })
      })
      step = 'ui-open-feed'
      await page.goto(target.frontendOrigin + '/feed', {
        waitUntil: 'domcontentloaded',
      })
      step = 'ui-open-account-control'
      await page
        .getByRole('button', { name: 'Account & eligibility', exact: true })
        .click()
      const dialog = page.getByRole('dialog')
      step = 'ui-fill-private-email-and-password'
      await dialog
        .getByLabel('Email address', { exact: true })
        .fill(x.credentials.email)
      await dialog
        .getByLabel('Password', { exact: true })
        .fill(x.credentials.password)
      step = 'ui-submit-sign-in'
      await dialog.getByRole('button', { name: 'Sign in with email' }).click()
      step = 'ui-await-real-unverified-account'
      await dialog
        .getByText('Signed in; phone verification still required.', {
          exact: true,
        })
        .waitFor()
      step = 'ui-close-auth-dialog'
      await dialog.getByRole('button', { name: 'Close dialog' }).click()
      return { context, page }
    }
    const uiState = async (x, page, phase) => {
      accountLabel = x.label
      step = 'profile-read-after-' + phase
      await page.goto(target.frontendOrigin + '/profile', {
        waitUntil: 'domcontentloaded',
      })
      await page
        .getByRole('button', { name: 'Edit profile & interests', exact: true })
        .click()
      await expect(page.getByLabel('Name', { exact: true })).toHaveValue(
        x.fixture.name,
        { timeout: 15000 },
      )
      check(
        'Profile fixture persists through ' + phase,
        (await page.getByLabel('Name', { exact: true }).inputValue()) ===
          x.fixture.name &&
          (await page.getByLabel('Handle', { exact: true }).inputValue()) ===
            x.fixture.handle &&
          (await page.getByLabel('Bio', { exact: true }).inputValue()) ===
            x.fixture.bio &&
          (await page
            .getByRole('combobox', { name: 'Visibility', exact: true })
            .inputValue()) === 'private',
      )
      await page
        .getByRole('button', { name: 'Cancel editing', exact: true })
        .click()
      step = 'preferences-read-after-' + phase
      await page.goto(target.frontendOrigin + '/settings', {
        waitUntil: 'domcontentloaded',
      })
      await page
        .getByRole('checkbox', { name: 'In-app notifications', exact: true })
        .waitFor()
      await expect(
        page.getByRole('checkbox', {
          name: 'In-app notifications',
          exact: true,
        }),
      ).not.toBeChecked({ timeout: 15000 })
      check(
        'Preference toggle persists through ' + phase,
        !(await page
          .getByRole('checkbox', { name: 'In-app notifications', exact: true })
          .isChecked()),
      )
      const s = await state(x)
      check(
        'Independent hosted profile/preferences read matches after ' + phase,
        !s.error &&
          s.profile.handle === x.fixture.handle &&
          s.profile.bio === x.fixture.bio &&
          s.pref.in_app === false,
        { databaseReadMatched: !s.error },
      )
    }
    if (crossUserOnly) {
      for (const x of accounts) {
        accountLabel = x.label
        step = 'minimum-private-fixture-through-permitted-rpc'
        x.profileWritten = true
        const profile = await invoke(x, 'profile', x.fixture)
        check('Minimum private profile fixture accepted', !profile.error, {
          status: profile.status,
          code: code(profile.error?.code),
        })
        x.prefWritten = true
        const pref = await invoke(x, 'preferences', {
          interests: ['Biomedical imaging'],
          muted: [],
          in_app: false,
        })
        const persisted = await state(x)
        check(
          'Minimum own fixtures verified by independent hosted reads',
          !pref.error &&
            !persisted.error &&
            persisted.profile.handle === x.fixture.handle &&
            persisted.profile.bio === x.fixture.bio &&
            persisted.profile.visibility === 'private' &&
            persisted.pref.in_app === false,
          {
            status: pref.status,
            populatedProfile: true,
            populatedPreferences: true,
          },
        )
      }
    } else
      for (const x of accounts) {
        accountLabel = x.label
        step = 'profile-write-through-connected-ui'
        let ui = await uiLogin(x)
        step = 'ui-open-profile-for-write'
        await ui.page.goto(target.frontendOrigin + '/profile', {
          waitUntil: 'domcontentloaded',
        })
        step = 'ui-open-profile-editor'
        await ui.page
          .getByRole('button', {
            name: 'Edit profile & interests',
            exact: true,
          })
          .click()
        for (const [label, value] of [
          ['Name', x.fixture.name],
          ['Handle', x.fixture.handle],
          ['Bio', x.fixture.bio],
        ]) {
          step = 'ui-fill-profile-' + label.toLowerCase()
          await ui.page.getByLabel(label, { exact: true }).fill(value)
        }
        await ui.page
          .getByRole('combobox', { name: 'Visibility', exact: true })
          .selectOption('private')
        const profileResponse = ui.page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname === '/rest/v1/rpc/community_action' &&
            r.request().method() === 'POST',
        )
        await ui.page
          .getByRole('button', {
            name: 'Save public-safe profile',
            exact: true,
          })
          .click()
        const written = await profileResponse
        x.profileWritten = written.ok()
        check(
          'Connected UI profile write accepted by hosted RPC',
          written.ok(),
          {
            status: written.status(),
          },
        )
        await ui.page
          .getByRole('button', {
            name: 'Edit profile & interests',
            exact: true,
          })
          .waitFor()
        step = 'preferences-write-through-connected-ui'
        await ui.page.goto(target.frontendOrigin + '/settings', {
          waitUntil: 'domcontentloaded',
        })
        const toggle = ui.page.getByRole('checkbox', {
          name: 'In-app notifications',
          exact: true,
        })
        await toggle.waitFor()
        if (!(await toggle.isChecked())) {
          const r = await invoke(x, 'preferences', {
            interests: ['Biomedical imaging'],
            muted: [],
            in_app: true,
          })
          check(
            'Prepare opposite preference state through permitted RPC',
            !r.error,
            { status: r.status, code: code(r.error?.code) },
          )
          x.prefWritten = true
          await ui.page.reload({ waitUntil: 'domcontentloaded' })
          await toggle.waitFor()
        }
        const prefResponse = ui.page.waitForResponse(
          (r) =>
            new URL(r.url()).pathname === '/rest/v1/rpc/community_action' &&
            r.request().method() === 'POST',
        )
        // The controlled input settles after the hosted RPC and snapshot refresh.
        // Track the potential write before interaction so cleanup covers failures.
        x.prefWritten = true
        step = 'preferences-click-through-connected-ui'
        await toggle.click()
        step = 'preferences-await-hosted-response'
        const prefWritten = await prefResponse
        step = 'preferences-await-server-backed-control'
        await expect(toggle).not.toBeChecked({ timeout: 15000 })
        check(
          'Connected UI preference write accepted by hosted RPC',
          prefWritten.ok(),
          { status: prefWritten.status() },
        )
        await ui.page.reload({ waitUntil: 'domcontentloaded' })
        await uiState(x, ui.page, 'page refresh')
        await ui.page
          .getByRole('button', { name: 'Sign out', exact: true })
          .click()
        await ui.page.waitForFunction(
          () =>
            !Object.keys(localStorage).some((k) =>
              /^sb-.+-auth-token$/.test(k),
            ),
        )
        await ui.context.close()
        ui = await uiLogin(x)
        await uiState(x, ui.page, 'logout and login in a new browser context')
        await ui.context.close()
        step = 'duplicate-write-and-input-failure'
        const receipt = randomUUID()
        const first = await invoke(x, 'profile', x.fixture, receipt)
        const duplicate = await invoke(
          x,
          'profile',
          {
            ...x.fixture,
            bio: 'This duplicate payload must not replace the first write.',
          },
          receipt,
        )
        const after = await state(x)
        check(
          'Same request ID acknowledges without overwriting original profile',
          !first.error &&
            !duplicate.error &&
            after.profile.bio === x.fixture.bio,
          {
            firstStatus: first.status,
            duplicateStatus: duplicate.status,
            persistedFirstPayload: true,
          },
        )
        const reuse = await invoke(
          x,
          'preferences',
          { in_app: true, interests: [], muted: [] },
          receipt,
        )
        check(
          'Request ID reused for another action is rejected',
          reuse.error?.code === 'P0001',
          { status: reuse.status, code: code(reuse.error?.code) },
        )
        const invalid = await invoke(x, 'profile', { ...x.fixture, name: 'x' })
        const unchanged = await state(x)
        check(
          'Invalid profile write rolls back and retains prior value',
          invalid.error?.code === 'P0001' &&
            unchanged.profile.name === x.fixture.name,
          {
            status: invalid.status,
            code: code(invalid.error?.code),
            unchanged: true,
          },
        )
        const categories = await x.client.rpc('notification_preferences', {
          selected_categories: ['reply', 'membership'],
        })
        const pref = await state(x)
        check(
          'Own notification-category update persists',
          !categories.error &&
            same(pref.pref.categories, ['reply', 'membership']),
          { status: categories.status, code: code(categories.error?.code) },
        )
        const invalidCategories = await x.client.rpc(
          'notification_preferences',
          {
            selected_categories: ['unknown_acceptance_category'],
          },
        )
        const categoryAfter = await state(x)
        check(
          'Invalid notification categories fail and preserve prior values',
          !!invalidCategories.error &&
            same(categoryAfter.pref.categories, ['reply', 'membership']),
          {
            status: invalidCategories.status,
            code: code(invalidCategories.error?.code),
          },
        )
        step = 'permitted-community-reads-and-expected-membership-denials'
        for (const [name, args] of [
          ['community_snapshot', { before_cursor: null }],
          ['search_community', { search_text: 'persistence', page_cursor: {} }],
          ['discovery_page', { entity: 'projects', after_id: null }],
        ]) {
          const r = await x.client.rpc(name, args)
          check('Permitted live ' + name, !r.error, {
            status: r.status,
            code: code(r.error?.code),
          })
        }
        for (const table of [
          'notifications',
          'bookmarks',
          'membership_applications',
          'project_images',
        ]) {
          const r = await x.client.from(table).select('*').limit(20)
          check('Authorized current-policy ' + table + ' read', !r.error, {
            status: r.status,
            rowCount: r.data?.length,
            scope: r.data?.length
              ? 'Actual rows under RLS'
              : 'Empty result; populated privacy not inferred',
          })
        }
        const read = await invoke(x, 'read_notifications', {})
        check('Own mark-notifications-read RPC accepted', !read.error, {
          status: read.status,
          scope:
            'No notification fixture created; actual read-state transition unverified',
        })
        for (const [type, payload] of [
          [
            'application',
            {
              institution: 'Staging fixture only',
              degree: 'B.Tech / BE',
              discipline: 'Biomedical Engineering',
              result_status: 'completed',
              year: 2026,
              private_marks: '',
            },
          ],
          ['post', {}],
          ['comment', { post_id: randomUUID() }],
          ['reaction', { post_id: randomUUID() }],
          ['bookmark', { post_id: randomUUID() }],
          ['project', {}],
          ['review', {}],
          ['suspend', { target_id: x.uid, suspended: false }],
          ['moderate', {}],
        ]) {
          const r = await invoke(x, type, payload)
          check(
            'Unverified/unapproved ordinary account denied ' + type,
            r.error?.code === '42501',
            { status: r.status, code: code(r.error?.code) },
          )
        }
        for (const name of [
          'storage_cleanup_batch',
          'prune_retained_data',
          'community_health',
        ]) {
          const r = await x.client.rpc(name)
          check('Privileged ' + name + ' denied', r.error?.code === '42501', {
            status: r.status,
            code: code(r.error?.code),
          })
        }
        const direct = await x.client
          .from('profiles')
          .update({ bio: x.fixture.bio })
          .eq('id', x.uid)
        check(
          'Direct client profile DML denied even on own row',
          direct.error?.code === '42501',
          { status: direct.status, code: code(direct.error?.code) },
        )
        const flagWrite = await x.client
          .from('profiles')
          .update({ phone_verified: false, membership: 'not_submitted' })
          .eq('id', x.uid)
        check(
          'Direct identity-flag DML denied with same-value safe probe',
          flagWrite.error?.code === '42501',
          {
            status: flagWrite.status,
            code: code(flagWrite.error?.code),
            noElevatedFlagValueAttempted: true,
          },
        )
        const roleWrite = await x.client
          .from('roles')
          .insert({ user_id: x.uid, role: 'invalid_acceptance_role' })
        check(
          'Role INSERT denied before constraint; no valid role attempted',
          roleWrite.error?.code === '42501',
          { status: roleWrite.status, code: code(roleWrite.error?.code) },
        )
      }
    if (accounts.length === 2) {
      const [a, b] = accounts
      const ui = new Map()
      const verifySession = async (x, page, phase) => {
        accountLabel = x.label
        step = 'independent-browser-session-' + phase
        const token = await page.evaluate(() => {
          const key = Object.keys(localStorage).find((k) =>
            /^sb-.+-auth-token$/.test(k),
          )
          if (!key) return null
          return JSON.parse(localStorage.getItem(key)).access_token ?? null
        })
        const managed = token ? await x.client.auth.getUser(token) : null
        check(
          'Browser retains its own managed identity: ' + phase,
          !!managed &&
            !managed.error &&
            managed.data.user.id === x.uid &&
            managed.data.user.id !== accounts.find((y) => y !== x).uid,
          {
            sessionPresent: !!token,
            ownIdentity:
              !!managed && !managed.error && managed.data.user.id === x.uid,
          },
        )
      }
      for (const x of accounts) {
        accountLabel = x.label
        const logged = await uiLogin(x)
        ui.set(x.label, logged)
        await verifySession(x, logged.page, 'simultaneous-sign-in')
        await uiState(x, logged.page, 'two-independent-contexts')
        const victim = accounts.find((y) => y !== x)
        step = 'foreign-private-profile-browser-route'
        const ready = logged.page.waitForResponse((r) => {
          const u = new URL(r.url())
          return (
            u.pathname === '/rest/v1/profiles' &&
            u.searchParams.get('id') === 'eq.' + victim.uid
          )
        })
        await logged.page.goto(
          target.frontendOrigin + '/member/' + victim.uid,
          { waitUntil: 'domcontentloaded' },
        )
        const response = await ready
        const filtered = await response.json()
        await expect(
          logged.page.getByRole('heading', {
            name: 'Profile unavailable',
            exact: true,
          }),
        ).toBeVisible()
        check(
          'Known private foreign member URL returns no profile in browser',
          response.ok() &&
            (filtered === null ||
              (Array.isArray(filtered) && filtered.length === 0)),
          {
            status: response.status(),
            populatedFixture: true,
            expectedUnavailableContent: true,
          },
        )
        await verifySession(x, logged.page, 'foreign-member-route')
        await uiState(x, logged.page, 'foreign-member-route-return')
      }
      check(
        'Accounts use distinct browser contexts',
        ui.get('A').context !== ui.get('B').context,
      )
      for (const x of accounts) {
        const page = ui.get(x.label).page
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page
          .getByRole('checkbox', { name: 'In-app notifications', exact: true })
          .waitFor()
        await verifySession(x, page, 'direct-settings-refresh')
      }
      accountLabel = 'A'
      step = 'logout-a-with-b-still-signed-in'
      await ui
        .get('A')
        .page.getByRole('button', { name: 'Sign out', exact: true })
        .click()
      await ui
        .get('A')
        .page.waitForFunction(
          () =>
            !Object.keys(localStorage).some((k) =>
              /^sb-.+-auth-token$/.test(k),
            ),
        )
      await ui.get('A').page.reload({ waitUntil: 'domcontentloaded' })
      await expect(
        ui
          .get('A')
          .page.getByRole('heading', { name: 'Your workspace', exact: true }),
      ).toBeVisible()
      check(
        'A logout remains signed out after refresh',
        await ui
          .get('A')
          .page.evaluate(
            () =>
              !Object.keys(localStorage).some((k) =>
                /^sb-.+-auth-token$/.test(k),
              ),
          ),
      )
      await ui.get('B').page.reload({ waitUntil: 'domcontentloaded' })
      await uiState(b, ui.get('B').page, 'other-account-logout')
      await verifySession(b, ui.get('B').page, 'other-account-logout')
      await ui.get('A').context.close()
      ui.set('A', await uiLogin(a))
      await uiState(a, ui.get('A').page, 'subsequent-login')
      await verifySession(a, ui.get('A').page, 'subsequent-login')
      await verifySession(b, ui.get('B').page, 'other-account-subsequent-login')
      for (const x of [b, a]) {
        accountLabel = x.label
        const page = ui.get(x.label).page
        await page.goto(target.frontendOrigin + '/settings', {
          waitUntil: 'domcontentloaded',
        })
        await page
          .getByRole('button', { name: 'Sign out', exact: true })
          .click()
        await page.waitForFunction(
          () =>
            !Object.keys(localStorage).some((k) =>
              /^sb-.+-auth-token$/.test(k),
            ),
        )
        check(
          'Independent browser final logout',
          await page.evaluate(
            () =>
              !Object.keys(localStorage).some((k) =>
                /^sb-.+-auth-token$/.test(k),
              ),
          ),
        )
        await ui.get(x.label).context.close()
      }
      for (const x of accounts) {
        accountLabel = x.label
        const fresh = await x.client.auth.signInWithPassword(x.credentials)
        check(
          'Fresh ordinary SDK session after browser global signout',
          !fresh.error && !!fresh.data.session,
          { status: fresh.error?.status ?? 200 },
        )
      }
      check(
        'Browser signup was never repeated',
        report.browser.signupRequests === 0,
        { requests: report.browser.signupRequests },
      )
    }
    const anon = makeClient()
    for (const x of accounts) {
      const r = await anon.from('profiles').select('id').eq('id', x.uid)
      check(
        'Anonymous cannot see known populated private profile ' + x.label,
        !r.error && r.data.length === 0,
        { status: r.status, rowCount: r.data?.length, populatedFixture: true },
      )
    }
    if (accounts.length < 2)
      blocked(
        'Bidirectional known-user private isolation',
        'Account B credentials absent; no second identity simulated. Single-account persistence completed.',
      )
    else
      for (const x of accounts) {
        const victim = accounts.find((y) => y !== x)
        accountLabel = x.label
        step = 'bidirectional-known-user-isolation'
        for (const [table, column] of [
          ['profiles', 'id'],
          ['preferences', 'user_id'],
          ['notifications', 'user_id'],
          ['bookmarks', 'user_id'],
          ['membership_applications', 'user_id'],
          ['roles', 'user_id'],
          ['avatars', 'user_id'],
          ['project_images', 'user_id'],
        ]) {
          const owner = await victim.client
            .from(table)
            .select('*')
            .eq(column, victim.uid)
            .limit(20)
          check('Owner fixture inventory for ' + table, !owner.error, {
            status: owner.status,
            rowCount: owner.data?.length,
          })
          const r = await x.client
            .from(table)
            .select('*')
            .eq(column, victim.uid)
            .limit(20)
          const populated = !!owner.data?.length
          const hidden = !r.error && r.data.length === 0
          if (populated || !hidden)
            check(
              'Other known user ' + table + ' populated rows hidden by RLS',
              hidden,
              {
                status: r.status,
                rowCount: r.data?.length,
                ownerFixtureRows: owner.data?.length,
                populatedFixture: populated,
              },
            )
          else
            report.records.push({
              name: 'Other-user ' + table + ' read has no populated fixture',
              account: x.label,
              status: 'LIMITED - EMPTY FIXTURE',
              observed: {
                status: r.status,
                rowCount: 0,
                ownerFixtureRows: 0,
                populatedFixture: false,
                isolationProven: false,
              },
            })
          const denied = await x.client
            .from(table)
            .update(
              table === 'profiles'
                ? { bio: 'Unauthorized acceptance change' }
                : table === 'preferences'
                  ? { in_app: true }
                  : table === 'notifications'
                    ? { read: true }
                    : table === 'membership_applications'
                      ? { private_marks: 'Unauthorized acceptance change' }
                      : table === 'roles'
                        ? { role: 'invalid_acceptance_role' }
                        : table === 'avatars' || table === 'project_images'
                          ? { path: 'invalid_acceptance_path' }
                          : { user_id: victim.uid },
            )
            .eq(column, victim.uid)
          check(
            'Other known user ' + table + ' direct write denied',
            denied.error?.code === '42501',
            { status: denied.status, code: code(denied.error?.code) },
          )
        }
        const snapshot = await x.client.rpc('community_snapshot', {
          before_cursor: null,
        })
        check(
          'Snapshot includes caller private rows and excludes known peer rows',
          !snapshot.error &&
            snapshot.data.profiles.some((p) => p.id === x.uid) &&
            !snapshot.data.profiles.some((p) => p.id === victim.uid) &&
            snapshot.data.preferences.some((p) => p.user_id === x.uid) &&
            !snapshot.data.preferences.some((p) => p.user_id === victim.uid),
          {
            status: snapshot.status,
            ownPopulatedRowsPresent: true,
            peerPrivateRowsVisible: false,
          },
        )
        const search = await x.client.rpc('search_community', {
          search_text: victim.fixture.handle,
          page_cursor: {},
        })
        check(
          'Hosted search excludes known peer private profile',
          !search.error &&
            Array.isArray(search.data.profiles) &&
            search.data.profiles.every((p) => p.id !== victim.uid),
          {
            status: search.status,
            populatedPrivateProfileReference: true,
            peerProfileVisible: false,
          },
        )
        const victimBefore = await state(victim)
        const attempt = await invoke(x, 'profile', {
          ...x.fixture,
          user_id: victim.uid,
          target_id: victim.uid,
        })
        const victimAfter = await state(victim)
        check(
          'Profile RPC derives caller; foreign identity cannot change victim',
          !attempt.error &&
            !victimBefore.error &&
            !victimAfter.error &&
            fields.every((k) =>
              same(victimBefore.profile[k], victimAfter.profile[k]),
            ),
          { status: attempt.status, otherUnchanged: true, targetIgnored: true },
        )
        const victimPrefBefore = await state(victim)
        const prefAttempt = await invoke(x, 'preferences', {
          user_id: victim.uid,
          interests: [],
          muted: [],
          in_app: !victimPrefBefore.pref.in_app,
        })
        const victimPref = await state(victim)
        check(
          'Preference RPC derives caller; victim remains unchanged',
          !prefAttempt.error &&
            !victimPrefBefore.error &&
            !victimPref.error &&
            ['interests', 'muted', 'in_app', 'categories'].every((k) =>
              same(victimPref.pref[k], victimPrefBefore.pref[k]),
            ),
          { status: prefAttempt.status, otherUnchanged: true },
        )
      }
    for (const x of accounts) {
      accountLabel = x.label
      step = 'reauthenticate-sdk-after-browser-global-logout'
      const prior = await x.client.auth.getUser()
      report.records.push({
        name: 'SDK identity following browser global logout',
        account: x.label,
        status: 'OBSERVED - LIVE DIAGNOSTIC',
        observed: {
          userAccepted: !prior.error && !!prior.data.user,
          status: prior.error?.status ?? 200,
        },
      })
      const renewed = await x.client.auth.signInWithPassword(x.credentials)
      const actual = await x.client.auth.getUser()
      check(
        'Fresh ordinary sign-in restores current-user Edge authentication',
        !renewed.error &&
          !!renewed.data.session &&
          !actual.error &&
          actual.data.user.id === x.uid,
        {
          sessionPresent: !!renewed.data.session,
          sameIdentity: !actual.error && actual.data.user.id === x.uid,
        },
      )
      if (crossUserOnly) {
        step = 'two-user-storage-export-deletion-safeguards'
        await verifyStagingBoundaries({
          client: x.client,
          target,
          publicKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
          uid: x.uid,
          victimUid: accounts.find((y) => y !== x)?.uid,
          check,
          observe: (status, detail) =>
            report.records.push({ account: x.label, status, detail }),
        })
      }
      step = 'configured-integration-negative-acceptance'
      const token = (await x.client.auth.getSession()).data.session.access_token
      for (const provider of ['Crossref', 'PubMed']) {
        const r = await fetch(target.url + '/functions/v1/scholarly-search', {
          method: 'POST',
          headers: {
            apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: 'Bearer ' + token,
            Origin: target.frontendOrigin,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: 'biomedical imaging', provider }),
          signal: AbortSignal.timeout(20000),
        })
        check(
          'Scholarly ' + provider + ' enforces approved-member gate',
          r.status === 429,
          {
            status: r.status,
            scope:
              'Handler maps denied search_budget to429; this does not prove provider success or real rate exhaustion',
          },
        )
      }
      const upload = await fetch(target.url + '/functions/v1/avatar', {
        method: 'POST',
        headers: {
          apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: 'Bearer ' + token,
          Origin: target.frontendOrigin,
          'Content-Type': 'application/octet-stream',
        },
        body: new Uint8Array([0]),
        signal: AbortSignal.timeout(20000),
      })
      check(
        'Missing processor returns honest unavailable response',
        upload.status === 503,
        { status: upload.status, noUploadSuccess: true },
      )
    }
    check(
      'Connected browser has no console or uncaught exceptions',
      report.browser.consoleErrors === 0 && report.browser.uncaughtErrors === 0,
      { ...report.browser },
    )
    blocked(
      'Populated applications/marks/roles/bookmarks/notifications/private projects/images',
      'Current accounts cannot legitimately create these protected fixtures. Empty reads/direct-DML denials are limited; no fake verification or seed inserted.',
    )
    blocked(
      'Authorized member contributions and scholarly positive acceptance',
      'Genuine phone verification/human academic approval required; contacts and image processor separately required.',
    )
  }
} catch (error) {
  const browserState = pageForDiagnostics
    ? await pageForDiagnostics
        .evaluate(() => ({
          sessionPresent: Object.keys(localStorage).some((k) =>
            /^sb-.+-auth-token$/.test(k),
          ),
          openDialogs: document.querySelectorAll('dialog[open]').length,
          profileEditor: [...document.querySelectorAll('button')].some(
            (b) => b.textContent === 'Save public-safe profile',
          ),
        }))
        .catch(() => null)
    : null
  report.records.push({
    name: step,
    account: accountLabel,
    status: 'FAIL - REPAIR REQUIRED',
    observed: {
      errorClass: [
        'Error',
        'AssertionError',
        'TimeoutError',
        'TypeError',
      ].includes(error.name)
        ? error.name
        : 'Error',
      code: code(error.code),
      detail: 'No raw exceptions, identities, payloads or credentials recorded',
      browserState,
    },
  })
  process.exitCode = 1
} finally {
  for (const x of accounts) {
    accountLabel = x.label
    try {
      if (x.profileWritten) {
        const restorable =
          x.baselineProfile.name?.trim().length >= 2 && x.baselineProfile.handle
        if (restorable) {
          const r = await x.client.rpc('community_action', {
            action_type: 'profile',
            payload: x.baselineProfile,
            request_id: randomUUID(),
          })
          const read = await x.client
            .from('profiles')
            .select('*')
            .eq('id', x.uid)
            .single()
          const restored =
            !r.error &&
            !read.error &&
            fields.every((k) => same(read.data[k], x.baselineProfile[k]))
          report.restoration.push({
            account: x.label,
            profileRestored: restored,
            verifiedByHostedRead: true,
          })
          if (!restored) process.exitCode = 1
        } else
          report.restoration.push({
            account: x.label,
            profileRestored: false,
            reason:
              'Initial blank profile cannot be restored through validated RPC; labeled private staging profile retained, no privilege bypass.',
          })
      }
      if (x.prefWritten) {
        const old = x.baselinePref ?? {
          interests: [],
          muted: [],
          in_app: true,
          categories: [
            'reply',
            'accepted',
            'collaboration',
            'membership',
            'mention',
            'topic',
            'moderation',
          ],
        }
        const r = await x.client.rpc('community_action', {
          action_type: 'preferences',
          payload: {
            interests: old.interests,
            muted: old.muted,
            in_app: old.in_app,
          },
          request_id: randomUUID(),
        })
        const c = await x.client.rpc('notification_preferences', {
          selected_categories: old.categories,
        })
        const read = await x.client
          .from('preferences')
          .select('*')
          .eq('user_id', x.uid)
          .single()
        const restored =
          !r.error &&
          !c.error &&
          !read.error &&
          ['interests', 'muted', 'in_app', 'categories'].every((k) =>
            same(read.data[k], old[k]),
          )
        report.restoration.push({
          account: x.label,
          preferencesRestored: restored,
          verifiedByHostedRead: true,
          newDefaultRowRetained: !x.baselinePref,
        })
        if (!restored) process.exitCode = 1
      }
      await x.client.auth.signOut({ scope: 'local' })
      x.credentials.email = ''
      x.credentials.password = ''
    } catch {
      report.restoration.push({ account: x.label, restorationFailed: true })
      process.exitCode = 1
    }
  }
  await browser?.close()
  server?.kill()
  await mkdir('docs/verification/cloud', { recursive: true })
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  const counts = {
    passed: report.records.filter((r) => r.status.startsWith('PASS')).length,
    failed: report.records.filter((r) => r.status.startsWith('FAIL')).length,
    blocked: report.records.filter((r) => r.status.startsWith('BLOCKED'))
      .length,
  }
  if (counts.failed) process.exitCode = 1
  else if (counts.blocked && !process.exitCode) process.exitCode = 2
  console.log(
    JSON.stringify({
      projectRef: target.projectRef,
      ...counts,
      exitCode: process.exitCode ?? 0,
      report: file,
    }),
  )
}
