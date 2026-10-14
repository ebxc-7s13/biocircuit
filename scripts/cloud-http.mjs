import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import {
  readTarget,
  assertPublicKey,
  localSessionPath,
} from './cloud-target.mjs'

const records = []
const record = (name, pass, scope = 'LIVE HTTP') => {
  records.push({
    name,
    status: pass ? 'PASS — LIVE VERIFIED' : 'FAIL — REPAIR REQUIRED',
    scope,
  })
}
const blocked = (name) =>
  records.push({
    name,
    status: 'BLOCKED — USER CONFIGURATION',
    scope: 'Not executed',
  })
let target
let started = false
try {
  target = await readTarget()
  const env = { ...loadEnv('development', process.cwd(), ''), ...process.env }
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
  assertPublicKey(key)
  if (
    env.VITE_APP_MODE !== 'connected' ||
    env.VITE_SUPABASE_URL?.replace(/\/$/, '') !== target.url
  )
    throw Error(
      'Connected public configuration must match the designated staging target',
    )
  const options = (token) => ({
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (url, init) =>
        fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
      headers: token ? { Authorization: 'Bearer ' + token } : {},
    },
  })
  const anon = createClient(target.url, key, options())
  started = true
  const snapshot = await anon.rpc('public_snapshot', { before_cursor: null })
  record(
    'Anonymous public snapshot is bounded and omits private data',
    !snapshot.error &&
      snapshot.data.posts.length <= 30 &&
      [
        'applications',
        'notifications',
        'roles',
        'bookmarks',
        'preferences',
        'audit',
      ].every((k) => snapshot.data[k]?.length === 0),
  )
  const forbidden = await anon.rpc('community_action', {
    action_type: 'cloud_acceptance_probe',
    payload: {},
    request_id: randomUUID(),
  })
  record(
    'Anonymous member mutation is denied by PostgreSQL privileges',
    forbidden.error?.code === '42501',
  )
  const academics = await anon
    .from('membership_applications')
    .select('id')
    .limit(1)
  record(
    'Anonymous academic records are denied by PostgreSQL privileges',
    academics.error?.code === '42501',
  )
  const sessionArg = process.argv.find((a) => a.startsWith('--sessions='))
  const sessions = sessionArg
    ? JSON.parse(
        await readFile(
          localSessionPath(sessionArg.slice('--sessions='.length)),
          'utf8',
        ),
      )
    : {}
  const clients = {}
  for (const label of [
    'memberA',
    'memberB',
    'pending',
    'reviewer',
    'moderator',
    'admin',
    'suspended',
  ]) {
    if (!sessions[label]?.accessToken) {
      blocked(label + ' real JWT identity')
      continue
    }
    const token = sessions[label].accessToken
    const client = createClient(target.url, key, options(token))
    const identity = await client.auth.getUser(token)
    if (identity.error || !identity.data.user) {
      record(label + ' real JWT identity', false)
      continue
    }
    const profile = await client
      .from('profiles')
      .select('id,membership,suspended,phone_verified')
      .eq('id', identity.data.user.id)
      .single()
    const roles = await client
      .from('roles')
      .select('role')
      .eq('user_id', identity.data.user.id)
    let valid = !profile.error && !roles.error
    if (label.startsWith('member'))
      valid &&=
        !!identity.data.user.phone_confirmed_at &&
        profile.data?.phone_verified === true &&
        profile.data?.membership === 'approved' &&
        !profile.data?.suspended &&
        roles.data?.length === 0
    if (label === 'pending')
      valid &&=
        !!identity.data.user.phone_confirmed_at &&
        profile.data?.phone_verified &&
        ['not_submitted', 'pending'].includes(profile.data?.membership) &&
        !profile.data?.suspended
    if (label === 'suspended') valid &&= profile.data?.suspended === true
    if (['reviewer', 'moderator', 'admin'].includes(label))
      valid &&=
        roles.data?.some((r) => r.role === label) && !profile.data?.suspended
    record(label + ' real JWT and authoritative role/membership match', valid)
    if (valid) clients[label] = { client, token, id: identity.data.user.id }
  }
  for (const name of [
    'scholarly-search',
    'account-delete',
    'avatar',
    'project-images',
  ]) {
    const response = await fetch(target.url + '/functions/v1/' + name, {
      method: 'POST',
      headers: {
        apikey: key,
        Origin: target.frontendOrigin,
        'Content-Type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(15000),
    })
    record(
      name + ' rejects calls without a real user JWT',
      response.status === 401,
    )
  }
  const a = clients.memberA,
    b = clients.memberB
  if (a && b) {
    if (a.id === b.id)
      throw Error(
        'Cross-account tests require two different managed Auth identities',
      )
    for (const [table, column] of [
      ['notifications', 'user_id'],
      ['bookmarks', 'user_id'],
      ['preferences', 'user_id'],
      ['membership_applications', 'user_id'],
    ]) {
      const other = await b.client
        .from(table)
        .select('*')
        .eq(column, a.id)
        .limit(1)
      record(
        'Member B cannot read member A ' + table,
        !other.error && other.data.length === 0,
      )
    }
    for (const [name, body] of [
      [
        'scholarly-search',
        { query: 'biomedical imaging', provider: 'Crossref' },
      ],
      ['account-delete', { confirm: 'NO' }],
      ['avatar', { operation: 'read', user_id: a.id }],
      ['project-images', { operation: 'list', project_id: randomUUID() }],
    ]) {
      const bad = await fetch(target.url + '/functions/v1/' + name, {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: 'Bearer ' + b.token,
          Origin: 'https://denied.example',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      record(
        name + ' rejects authenticated incorrect Origin',
        bad.status === 403,
      )
    }
    const rolesWrite = await a.client
      .from('roles')
      .insert({ user_id: a.id, role: 'admin' })
    record(
      'Real member cannot self-assign admin role',
      rolesWrite.error?.code === '42501',
    )
    const membershipWrite = await a.client
      .from('profiles')
      .update({ membership: 'approved' })
      .eq('id', a.id)
    record(
      'Real member cannot assign academic flag',
      membershipWrite.error?.code === '42501',
    )
    if (process.argv.includes('--write-fixtures')) {
      const qid = randomUUID(),
        privateId = randomUUID(),
        projectId = randomUUID(),
        answer = randomUUID()
      const post = {
        kind: 'question',
        title: 'Staging acceptance: synthetic alignment protocol',
        body: 'Acceptance fixture only: repeated measurements of synthetic nonclinical optical targets.',
        tags: ['Biomedical imaging'],
        visibility: 'members',
        source_url: '',
        methods: 'Synthetic repeatability check',
        tried: 'Grouped target measurements',
        project_id: null,
        paper_id: null,
      }
      const action = (who, type, payload, id = randomUUID()) =>
        who.client.rpc('community_action', {
          action_type: type,
          payload,
          request_id: id,
        })
      const requireSuccess = (result, name) => {
        record(name, !result.error)
        if (result.error)
          throw Error('Fixture operation failed; inspect redacted staging logs')
      }
      const createdPosts = []
      let createdProject = false
      try {
        requireSuccess(
          await action(a, 'post', post, qid),
          'Real member creates a question',
        )
        createdPosts.push(qid)
        requireSuccess(
          await action(a, 'post', post, qid),
          'Exact request retry succeeds idempotently',
        )
        const q = await a.client.from('posts').select('id').eq('id', qid)
        record(
          'Retry persists exactly one question',
          !q.error && q.data.length === 1,
        )
        requireSuccess(
          await action(
            a,
            'post',
            { ...post, visibility: 'private' },
            privateId,
          ),
          'Real member creates private test post',
        )
        createdPosts.push(privateId)
        const privateRead = await b.client
          .from('posts')
          .select('id')
          .eq('id', privateId)
        record(
          'Guessed private post hidden across real users',
          !privateRead.error && privateRead.data.length === 0,
        )
        const edit = await action(b, 'edit_post', { ...post, post_id: qid })
        record(
          'Other real member cannot edit question',
          edit.error?.code === '42501',
        )
        requireSuccess(
          await action(
            b,
            'comment',
            {
              post_id: qid,
              body: 'Acceptance fixture reply: use blinded synthetic alignment targets.',
            },
            answer,
          ),
          'Another real member adds an answer',
        )
        requireSuccess(
          await action(a, 'accept', { post_id: qid, comment_id: answer }),
          'Question author accepts real persisted answer',
        )
        requireSuccess(
          await action(a, 'accept', { post_id: qid, comment_id: answer }),
          'Repeated acceptance does not fail or create a second award',
        )
        const ledger = await b.client
          .from('contributions')
          .select('source_id,valid')
          .eq('source_id', answer)
        record(
          'Accepted answer ledger has exactly one valid event',
          !ledger.error &&
            ledger.data.length === 1 &&
            ledger.data[0].valid === true,
        )
        const selfVote = await action(a, 'reaction', { post_id: qid })
        record(
          'Self-reaction is rejected for a real member',
          selfVote.error?.code === '42501',
        )
        const notification = await a.client
          .from('notifications')
          .select('id')
          .eq('event_key', answer)
        record(
          'Reply generated a real persisted notification',
          !notification.error && notification.data.length === 1,
        )
        const project = {
          title: 'Staging acceptance: private optical bench',
          problem:
            'Test-only synthetic nonclinical optical bench; no private research or patient data.',
          stage: 'Prototype',
          methods: 'Synthetic test',
          equipment: 'Illustrative fixture',
          needs: '',
          tags: ['Biomedical imaging'],
          visibility: 'private',
          source_url: '',
          license: 'Test fixture',
          governance: 'Synthetic nonclinical data only',
        }
        requireSuccess(
          await action(a, 'project', project, projectId),
          'Real member creates private project',
        )
        createdProject = true
        const projectRead = await b.client
          .from('projects')
          .select('id')
          .eq('id', projectId)
        record(
          'Private project hidden across real users',
          !projectRead.error && projectRead.data.length === 0,
        )
        const pending = clients.pending
        if (pending) {
          const denied = await action(pending, 'comment', {
            post_id: qid,
            body: 'Pending identity denial probe',
          })
          record(
            'Phone-confirmed pending account cannot reply',
            denied.error?.code === '42501',
          )
        }
      } finally {
        for (const id of createdPosts) {
          const removed = await action(a, 'delete_post', { post_id: id })
          record(
            'Soft-delete only this run test post',
            !removed.error,
            'LIVE fixture cleanup',
          )
        }
        if (createdProject) {
          const removed = await a.client.rpc('trust_action', {
            action_type: 'delete_project',
            payload: { project_id: projectId, confirm: 'DELETE' },
            request_id: randomUUID(),
          })
          record(
            'Delete only this run test project',
            !removed.error,
            'LIVE fixture cleanup',
          )
        }
      }
    } else
      blocked(
        'Community write/notification/point/project fixture journeys require --write-fixtures',
      )
  } else
    blocked(
      'Cross-account privacy and community tests require two real approved member JWTs',
    )
  for (const [label, actor] of Object.entries(clients))
    if (
      [
        'pending',
        'suspended',
        'memberA',
        'memberB',
        'reviewer',
        'moderator',
      ].includes(label)
    ) {
      const aggregate = await actor.client.rpc('community_health')
      record(
        label + ' cannot read admin aggregates',
        aggregate.error?.code === '42501',
      )
    }
} catch {
  records.push({
    name: 'Cloud HTTP prerequisites or transport',
    status: started ? 'FAIL — REPAIR REQUIRED' : 'BLOCKED — USER CONFIGURATION',
    scope:
      'Sanitized: designate staging, local public config and actual sessions; never paste credentials into chat',
  })
  process.exitCode = started ? 1 : 2
}
await mkdir('docs/verification/cloud', { recursive: true })
await writeFile(
  'docs/verification/cloud/http-results.json',
  JSON.stringify(
    {
      projectName: target?.projectName,
      projectRef: target?.projectRef,
      records,
      notCovered:
        'Real SMS/CAPTCHA, full operational role matrix, source success/cache/adverse upstream, private processor/Storage round trips, export/deletion/global sign-out and connected browser require separate live acceptance evidence.',
    },
    null,
    2,
  ) + '\n',
)
console.log(JSON.stringify(records, null, 2))
if (records.some((r) => r.status.startsWith('FAIL'))) process.exitCode = 1
else if (records.some((r) => r.status.startsWith('BLOCKED')))
  process.exitCode = 2
