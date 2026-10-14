import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
process.on('uncaughtException', (error) => {
  console.error('DB TEST FAILED:', error.message)
  process.exit(1)
})
const db = new PGlite()
let checks = 0
const check = (condition, label) => {
  assert.ok(condition, label)
  checks++
  console.log('PASS ' + label)
}
const scalar = async (sql, args = []) =>
  Object.values((await db.query(sql, args)).rows[0] ?? {})[0]
const deny = async (fn, label) => {
  let denied = false
  try {
    await fn()
  } catch {
    denied = true
  }
  check(denied, label)
}
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,phone_confirmed_at timestamptz);create table auth.identities(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,provider text not null);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid()to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;`,
)
for (const f of (await readdir('supabase/migrations')).sort())
  if (f.endsWith('.sql'))
    await db.exec(await readFile('supabase/migrations/' + f, 'utf8'))
check(true, 'all versioned migrations execute on PostgreSQL (PGlite)')
const ids = Array.from({ length: 6 }, () => randomUUID())
const [a, b, pending, reviewer, moderator, admin] = ids
for (const id of ids)
  await db.query('insert into auth.users values($1,now())', [id])
for (let i = 0; i < ids.length; i++)
  await db.query(
    "update public.profiles set name=$2,handle=$3,membership=$4,visibility='public'where id=$1",
    [
      ids[i],
      'Synthetic ' + i,
      'synthetic_' + i,
      i === 2 ? 'pending' : 'approved',
    ],
  )
await db.query(
  "insert into public.roles values($1,'reviewer'),($2,'moderator'),($3,'admin')",
  [reviewer, moderator, admin],
)
const identity = async (id, role = 'authenticated') => {
  await db.exec('reset role')
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    id ?? '',
  ])
  await db.exec('set role ' + role)
}
const action = async (type, payload, id = randomUUID()) =>
  db.query('select public.community_action($1,$2::jsonb,$3)', [
    type,
    JSON.stringify(payload),
    id,
  ])
const trust = async (type, payload, id = randomUUID()) =>
  db.query('select public.trust_action($1,$2::jsonb,$3)', [
    type,
    JSON.stringify(payload),
    id,
  ])
const post = (title = 'Question about grouped validation') => ({
  kind: 'question',
  title,
  body: 'How can grouped validation avoid patient-level leakage?',
  tags: ['Biomedical imaging'],
  visibility: 'members',
  source_url: '',
  methods: 'Grouped folds',
  tried: 'Compared image-level splits',
  project_id: null,
  paper_id: null,
})
await identity(a)
const qid = randomUUID()
await action('post', post(), qid)
await action('post', post(), qid)
check(
  (await scalar(
    "select count(*)from public.posts where id=$1 and state='published'",
    [qid],
  )) === 1,
  'publish retries are idempotent',
)
await deny(
  () =>
    db.query("update public.profiles set membership='approved'where id=$1", [
      a,
    ]),
  'client cannot assign membership',
)
await deny(
  () => db.query("insert into public.roles values($1,'admin')", [a]),
  'client cannot assign administrative role',
)
await identity(pending)
await deny(
  () =>
    action('comment', { post_id: qid, body: 'Unauthorized answer attempt' }),
  'pending applicant cannot reply',
)
check(
  (await scalar('select count(*)from public.posts where id=$1', [qid])) === 0,
  'pending applicant cannot read member post',
)
await identity(b)
const answer = randomUUID()
await action(
  'comment',
  { post_id: qid, body: 'Keep every image from one subject in a single fold.' },
  answer,
)
await deny(
  () => action('edit_post', { ...post(), post_id: qid }),
  'other member cannot edit another author post',
)
await deny(
  () => action('accept', { post_id: qid, comment_id: answer }),
  'other member cannot accept answer',
)
await identity(a)
await action('accept', { post_id: qid, comment_id: answer })
await action('accept', { post_id: qid, comment_id: answer })
check(
  (await scalar('select count(*)from public.notifications')) === 1,
  'reply notification recorded for asker',
)
await identity(b)
check(
  (await scalar('select count(*)from public.contributions where valid')) === 1,
  'accepted answer ledger deduplicated',
)
check(
  (await scalar('select sum(points)from public.contributions where valid')) ===
    20,
  'accepted answer awards exactly 20',
)
check(
  (await scalar('select count(*)from public.notifications')) === 1,
  'accepted answer notification deduplicated',
)
await deny(
  () => action('helpful', { comment_id: answer }),
  'self helpful vote rejected',
)
await identity(a)
await deny(() => action('reaction', { post_id: qid }), 'self reaction rejected')
const receipt = randomUUID()
await action('bookmark', { post_id: qid }, receipt)
await action('bookmark', { post_id: qid }, receipt)
check(
  (await scalar('select count(*)from public.bookmarks')) === 1,
  'bookmark retry does not toggle twice',
)
await identity(b)
check(
  (await scalar('select count(*)from public.bookmarks')) === 0,
  'other member cannot read private bookmarks',
)
check(
  (await scalar('select count(*)from public.notifications where user_id=$1', [
    a,
  ])) === 0,
  'cross-account notifications hidden',
)
await identity(a)
const privateId = randomUUID()
await action(
  'post',
  { ...post('Private laboratory notebook'), visibility: 'private' },
  privateId,
)
await identity(b)
check(
  (await scalar('select count(*)from public.posts where id=$1', [
    privateId,
  ])) === 0,
  'guessing private post UUID does not reveal it',
)
await deny(
  () =>
    action('comment', {
      post_id: privateId,
      body: 'Try to bypass private post access',
    }),
  'private post mutation denied across accounts',
)
await identity(pending)
await action('application', {
  institution: 'Synthetic Institute',
  degree: 'PhD',
  discipline: 'Biomedical Engineering',
  result_status: 'awaiting_results',
  year: 2026,
  private_marks: 'optional private value',
})
const appid = await scalar('select id from public.membership_applications')
await identity(a)
check(
  (await scalar('select count(*)from public.membership_applications')) === 0,
  'other member cannot read private application',
)
await deny(
  () =>
    action('review', {
      application_id: appid,
      status: 'approved',
      reason: 'Attempted unauthorized review',
    }),
  'member cannot review eligibility',
)
await identity(reviewer)
check(
  (await scalar('select count(*)from public.membership_applications')) === 1,
  'reviewer reads application queue',
)
await action('review', {
  application_id: appid,
  status: 'approved',
  reason: 'Synthetic biomedical pathway reviewed',
})
check(
  (await scalar('select count(*)from public.audit')) === 1,
  'review decision auditable',
)
await identity(pending)
check(
  (await scalar('select membership from public.profiles where id=$1', [
    pending,
  ])) === 'approved',
  'applicant observes real review state',
)
await identity(a)
const projectId = randomUUID()
const project = {
  title: 'Private optical calibration project',
  problem: 'Compare repeated calibration with synthetic nonclinical samples.',
  stage: 'Prototype',
  methods: 'Repeated measurements',
  equipment: 'Optical bench',
  needs: 'Optical engineer',
  tags: ['Biomedical imaging'],
  visibility: 'private',
  source_url: '',
  license: 'No reuse rights yet',
  governance: 'Synthetic data only',
}
await action('project', project, projectId)
await identity(b)
check(
  (await scalar('select count(*)from public.projects where id=$1', [
    projectId,
  ])) === 0,
  'private project hidden from other member',
)
await deny(
  () =>
    action('collaborate', {
      project_id: projectId,
      message: 'Guessing private project identifier',
    }),
  'private project collaboration bypass denied',
)
await identity(a)
await action('edit_project', {
  ...project,
  project_id: projectId,
  visibility: 'public',
})
await identity(b)
await action('collaborate', {
  project_id: projectId,
  message: 'I can help reproduce optical calibration.',
  expertise: 'Optics',
  availability: 'Weekly',
})
const collabId = await scalar('select id from public.collaborations')
await deny(
  () =>
    action('decide_collaboration', {
      project_id: projectId,
      collaboration_id: collabId,
      accept: true,
    }),
  'sender cannot accept own collaboration',
)
await identity(a)
await action('decide_collaboration', {
  project_id: projectId,
  collaboration_id: collabId,
  accept: true,
})
await action('edit_project', { ...project, project_id: projectId })
await identity(b)
check(
  (await scalar('select count(*)from public.projects where id=$1', [
    projectId,
  ])) === 1,
  'accepted collaborator can read private project',
)
await identity(a)
await action('remove_member', { project_id: projectId, target_id: b })
await identity(b)
check(
  (await scalar('select count(*)from public.projects where id=$1', [
    projectId,
  ])) === 0,
  'removed collaborator loses project access',
)
await identity(a)
await action('block', { target_id: b })
await identity(b)
check(
  (await scalar('select count(*)from public.posts where id=$1', [qid])) === 0,
  'symmetric blocking excludes posts',
)
await deny(
  () =>
    action('comment', {
      post_id: qid,
      body: 'Bypass user blocking via direct API',
    }),
  'blocked member cannot reply',
)
await identity(a)
await action('block', { target_id: b })
await identity(b)
await action('report', {
  post_id: qid,
  reason: 'Synthetic moderation test report',
})
const reportId = await scalar('select id from public.reports')
await identity(moderator)
check(
  (await scalar('select count(*)from public.membership_applications')) === 0,
  'moderator cannot access academic records',
)
await action('moderate', {
  post_id: qid,
  report_id: reportId,
  state: 'removed',
  reason: 'Synthetic test moderation decision',
})
await identity(a)
check(
  (await scalar(
    "select count(*)from public.posts where id=$1 and state='published'",
    [qid],
  )) === 0,
  'removed content excluded from published research after moderation',
)
await identity(b)
check(
  (await scalar('select count(*)from public.contributions where valid')) === 0,
  'moderation invalidates contribution award',
)
await identity(a)
const moderation = await scalar('select public.own_moderation_decisions()')
check(
  moderation.some(
    (x) => x.id === qid && x.reason === 'Synthetic test moderation decision',
  ),
  'claimant can see scoped moderation reason',
)
await trust('appeal_content', {
  post_id: qid,
  reason: 'Please review the synthetic moderation context.',
})
const appealId = await scalar('select id from public.content_appeals')
await identity(b)
await deny(
  () =>
    trust('appeal_content', {
      post_id: qid,
      reason: 'Attempt another author appeal',
    }),
  'other member cannot appeal author content',
)
await identity(reviewer)
check(
  (await scalar('select count(*)from public.content_appeals')) === 0,
  'academic reviewer does not inherit moderation appeal access',
)
await identity(moderator)
await trust('resolve_content_appeal', {
  appeal_id: appealId,
  accept: true,
  reason: 'Synthetic context reviewed; restoring content.',
})
await identity(a)
check(
  (await scalar('select state from public.posts where id=$1', [qid])) ===
    'published',
  'moderator can restore content through recorded appeal',
)
await identity(b)
check(
  (await scalar('select count(*)from public.contributions where valid')) === 0,
  'appeal restoration does not silently restore invalidated reputation',
)
await db.query("select public.notification_preferences(array['reply'])")
await deny(
  () =>
    db.query(
      "select public.notification_preferences(array['invalid_category'])",
    ),
  'notification categories constrained server-side',
)
await deny(
  () => db.query('select public.reserve_scholarly_request()'),
  'browser cannot access provider-wide budget',
)
await identity(null, 'service_role')
check(
  Number.isInteger(await scalar('select public.reserve_scholarly_request()')),
  'service role can reserve a distributed provider request slot',
)
await identity(reviewer)
await deny(
  () =>
    action('suspend', {
      target_id: a,
      suspended: true,
      reason: 'Reviewer privilege escalation attempt',
    }),
  'reviewer cannot suspend accounts',
)
await identity(admin)
await action('suspend', {
  target_id: a,
  suspended: true,
  reason: 'Synthetic account restriction test',
})
await identity(a)
await deny(() => action('project', project), 'suspended member cannot mutate')
await identity(admin)
await action('suspend', {
  target_id: a,
  suspended: false,
  reason: 'Synthetic reinstatement test',
})
await identity(a)
await deny(
  () => action('post', { ...post(), source_url: 'javascript:alert(1)' }),
  'unsafe URL rejected at database',
)
await deny(
  () => action('post', { ...post(), body: 'short' }),
  'body constraints enforced server-side',
)
check(
  !!(await scalar('select public.export_personal_data()')),
  'personal data export available without cross-account parameter',
)

await identity(a)
await deny(
  () =>
    trust('taxonomy', {
      name: 'Fraud topic',
      reason: 'Attempted privilege escalation',
    }),
  'member cannot change taxonomy',
)
await deny(
  () => db.query('select public.community_health()'),
  'member cannot read administrative aggregates',
)
await identity(admin)
await trust('taxonomy', {
  name: 'Synthetic laboratory topic',
  reason: 'Test taxonomy update',
})
await trust('point_rule', { points: 25, reason: 'Test award rule update' })
check(
  (await scalar(
    "select points from public.contribution_rules where kind='accepted_answer'",
  )) === 25,
  'admin can adjust bounded future award rule',
)
await deny(
  () => trust('point_rule', { points: 101, reason: 'Attempt excessive award' }),
  'award rule cannot exceed 100',
)
check(
  !!(await scalar('select public.community_health()')),
  'admin can read aggregate health',
)
await db.exec('reset role')
await db.exec('delete from private.rate_limits')
await identity(a)
const newQuestion = randomUUID()
await action('post', post('Optical bench reproducibility methods'), newQuestion)
await identity(b)
await trust('subscribe', { post_id: newQuestion })
const anotherAnswer = randomUUID()
await action(
  'comment',
  {
    post_id: newQuestion,
    body: 'Repeat optical alignment across sessions and report drift.',
  },
  anotherAnswer,
)
await identity(a)
await deny(
  () => action('accept', { post_id: newQuestion, comment_id: anotherAnswer }),
  'repeated asker-answerer pair cannot farm awards in 24 hours',
)
await action('edit_post', {
  ...post('Updated optical bench reproducibility methods'),
  post_id: newQuestion,
})
check(
  (await scalar('select count(*)from public.post_versions where post_id=$1', [
    newQuestion,
  ])) === 1,
  'post edit preserves prior version',
)
await identity(admin)
await action('comment', {
  post_id: newQuestion,
  body: 'Use a synthetic calibration target before testing any sample.',
})
await identity(b)
check(
  (await scalar(
    "select count(*)from public.notifications where category='reply'",
  )) === 1,
  'subscriber receives reply notification',
)
await trust('edit_comment', {
  comment_id: anotherAnswer,
  body: 'Repeat optical alignment and report reproducibility limits.',
})
await identity(a)
await deny(
  () =>
    trust('edit_comment', {
      comment_id: anotherAnswer,
      body: 'Try to overwrite another member reply',
    }),
  'reply editing enforces author identity',
)
check(
  JSON.parse(
    JSON.stringify(
      await scalar('select public.discussion_page($1)', [newQuestion]),
    ),
  ).comments.length === 2,
  'bounded reply page returns visible replies',
)
const exhausted = await scalar(
  "select public.search_community('optical',$1::jsonb)",
  [JSON.stringify({ posts: null, profiles: null, projects: null })],
)
check(
  exhausted.posts.length === 0 &&
    exhausted.profiles.length === 0 &&
    exhausted.projects.length === 0,
  'exhausted search entities never restart',
)
const matches = await scalar("select public.search_community('optical')")
check(
  matches.posts.some((p) => p.id === newQuestion),
  'indexed search finds edited content',
)
await db.exec('reset role')
await db.query(
  "insert into public.project_members values($1,$2,'Collaborator')on conflict do nothing",
  [projectId, b],
)
await db.exec('delete from private.rate_limits')
await identity(a)
const milestone = randomUUID()
await action(
  'post',
  {
    ...post('Confirmed optical calibration milestone'),
    kind: 'project_update',
    project_id: projectId,
    visibility: 'members',
    log_type: 'milestone',
  },
  milestone,
)
await deny(
  () => db.query('select public.confirm_milestone($1)', [milestone]),
  'milestone author cannot self-confirm',
)
await identity(moderator)
check(
  (await scalar('select count(*)from public.posts where id=$1', [
    milestone,
  ])) === 0,
  'moderator cannot read private project log',
)
await deny(
  () =>
    action('moderate', {
      post_id: milestone,
      state: 'removed',
      reason: 'Attempt private project moderation',
    }),
  'moderator cannot mutate private project log',
)
await identity(b)
await db.query('select public.confirm_milestone($1)', [milestone])
await db.query('select public.confirm_milestone($1)', [milestone])
check(
  (await scalar(
    'select count(*)from public.milestone_confirmations where post_id=$1',
    [milestone],
  )) === 1,
  'collaborator milestone confirmation is idempotent',
)
await identity(a)
await deny(
  () => trust('delete_project', { project_id: projectId, confirm: 'NO' }),
  'project deletion requires exact confirmation',
)
await db.exec('reset role')
await db.exec('delete from private.rate_limits')
await identity(b)
for (let i = 0; i < 10; i++) await db.query('select public.search_budget()')
await deny(
  () => db.query('select public.search_budget()'),
  'scholarly search rate limit enforced',
)
await db.exec('reset role')
await db.query('update public.profiles set suspended=true where id=$1', [
  reviewer,
])
await identity(reviewer)
check(
  (await scalar('select count(*)from public.membership_applications')) === 0,
  'suspended reviewer loses private queue access',
)
await db.exec('reset role')
await db.query('update public.profiles set suspended=false where id=$1', [
  reviewer,
])
await identity(b)
await deny(
  () =>
    db
      .query('select public.avatar_budget()')
      .then(() =>
        db.query('insert into public.avatars values($1,$2,now())', [
          a,
          a + '/' + randomUUID() + '.webp',
        ]),
      ),
  'client cannot forge another avatar storage record',
)
await db.exec('reset role')
await db.query(
  "insert into public.posts(author_id,kind,title,body,tags,visibility)select $1,'discussion','Pagination fixture '||n,'A synthetic laboratory fixture for bounded stable discovery testing.',array['Biomaterials'],'members'from generate_series(1,65)n",
  [a],
)
await identity(b)
let cursor = {}
const found = []
for (let page = 0; page < 4; page++) {
  const result = await scalar(
    "select public.search_community('pagination',$1::jsonb)",
    [JSON.stringify(cursor)],
  )
  found.push(...result.posts.map((p) => p.id))
  cursor = result.cursor
  if (!Object.values(cursor).some(Boolean)) break
}
check(
  found.length === 65 && new Set(found).size === 65,
  'multi-entity search returns all 65 records once across cursor pages',
)
const recommendations = await scalar('select public.recommended_page()')
check(
  recommendations.length <= 30,
  'recommendation candidate window bounded to 30',
)
await identity(null, 'anon')
await deny(
  () => action('post', post()),
  'anonymous caller cannot invoke mutation RPC',
)
await deny(
  () => db.query('select *from public.membership_applications'),
  'anonymous caller cannot read academic table',
)
check(
  !!(await scalar('select public.public_snapshot()')),
  'anonymous safe snapshot works',
)
await db.exec('reset role')
const tables = (
  await db.query("select tablename from pg_tables where schemaname='public'")
).rows
for (const t of tables)
  check(
    await scalar('select relrowsecurity from pg_class where oid=$1::regclass', [
      'public.' + t.tablename,
    ]),
    'RLS enabled: ' + t.tablename,
  )
const directWrites = await scalar(
  "select count(*)from information_schema.role_table_grants where table_schema='public'and grantee in('anon','authenticated')and privilege_type in('INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER')",
)
check(
  directWrites === 0,
  'no exposed application table permits direct client writes',
)
check(
  (await scalar(
    "select count(*)from pg_policies where schemaname='storage'and cmd in('INSERT','ALL')",
  )) === 0,
  'no unvalidated storage upload policy',
)
await db.exec('reset role')
await db.query(
  "insert into public.papers(id,doi,pmid,title,authors,venue,published,source,source_url,retrieved_at)values('10.1234/synthetic','10.1234/synthetic','123456','Synthetic optical fixture paper',array['Synthetic Author'],'Synthetic Venue','2026','PubMed','https://pubmed.ncbi.nlm.nih.gov/123456/',now())",
)
await db.exec('delete from private.rate_limits')
await identity(b)
await action('paper', {
  paper: {
    id: '10.1234/synthetic',
    title: 'Attempt client replacement',
    source_url: 'https://example.com',
  },
})
check(
  (await scalar(
    "select title from public.papers where id='10.1234/synthetic'",
  )) === 'Synthetic optical fixture paper',
  'paper save cannot forge provider metadata',
)
const scholarSearch = await scalar("select public.search_community('optical')")
check(
  scholarSearch.papers.some((p) => p.id === '10.1234/synthetic'),
  'unified search includes attributed scholarly records',
)
await trust('paper_report', {
  paper_id: '10.1234/synthetic',
  reason: 'Synthetic metadata correction test',
})
const paperReport = await scalar('select id from public.paper_reports')
await identity(reviewer)
check(
  (await scalar('select count(*)from public.paper_reports')) === 0,
  'academic reviewer has no source-report access',
)
await identity(moderator)
await trust('review_paper_report', {
  report_id: paperReport,
  reason: 'Reviewed synthetic source metadata concern',
})
check(
  (await scalar('select status from public.paper_reports')) === 'reviewed',
  'source reviewer records metadata report outcome',
)
await identity(b)
await trust('unsave_paper', { paper_id: '10.1234/synthetic' })
check(
  (await scalar('select count(*)from public.paper_saves')) === 0,
  'scholarly unsave removes only own relation',
)
await db.exec('reset role')
await db.query(
  "insert into public.posts(author_id,kind,title,body,tags,visibility)select $1,'discussion','Public pagination fixture '||n,'A synthetic public laboratory fixture for bounded anonymous discovery.',array['Biomaterials'],'public'from generate_series(1,35)n",
  [a],
)
await identity(null, 'anon')
const firstPublic = await scalar('select public.public_snapshot()')
const lastPublic = firstPublic.posts.at(-1)
const secondPublic = await scalar('select public.public_snapshot($1)', [
  lastPublic.created_at + '|' + lastPublic.id,
])
check(
  firstPublic.posts.length === 30 && secondPublic.posts.length === 5,
  'anonymous research feed has real bounded cursor pagination',
)
await db.exec('reset role')
const recipient = randomUUID()
await db.query('insert into auth.users values($1,now())', [recipient])
await db.query(
  "update public.profiles set name='Synthetic award recipient',handle='award_fixture',membership='approved',visibility='public'where id=$1",
  [recipient],
)
await identity(b)
await deny(
  () => db.query('select public.storage_cleanup_batch()'),
  'browser cannot read privileged storage cleanup queue',
)
const imageId = randomUUID()
await db.exec('reset role')
await db.query(
  'insert into public.project_images(id,user_id,project_id,path)values($1,$2,$3,$4)',
  [imageId, a, projectId, a + '/' + imageId + '.png'],
)
await identity(b)
check(
  (await scalar('select count(*)from public.project_images')) === 1,
  'active collaborator can read private project image metadata',
)
await identity(moderator)
check(
  (await scalar('select count(*)from public.project_images')) === 0,
  'moderator cannot read private project images',
)
await identity(a)
await action('remove_member', { project_id: projectId, target_id: b })
await identity(b)
check(
  (await scalar('select count(*)from public.project_images')) === 0,
  'removing project member revokes image metadata access',
)
await db.exec('reset role')
const removedUploadId = randomUUID()
await deny(
  () =>
    db.query(
      'insert into public.project_images(id,user_id,project_id,path)values($1,$2,$3,$4)',
      [removedUploadId, b, projectId, b + '/' + removedUploadId + '.png'],
    ),
  'upload commit rechecks membership after processor window',
)
await deny(
  () =>
    db.query(
      'insert into public.project_images(id,user_id,project_id,path)values($1,$2,$3,$4)',
      [randomUUID(), a, projectId, b + '/' + imageId + '.png'],
    ),
  'project image path cannot impersonate another uploader',
)
await db.query('delete from public.project_images where id=$1', [imageId])
await identity(null, 'service_role')
const garbage = await scalar('select public.storage_cleanup_batch()')
check(
  garbage.some((x) => x.path === a + '/' + imageId + '.png'),
  'image deletion queues private storage cleanup',
)
await db.query('select public.storage_cleanup_ack($1::uuid[])', [
  garbage.map((x) => x.id),
])
check(
  (await scalar('select public.storage_cleanup_batch()')).length === 0,
  'service-only cleanup acknowledgement removes completed tombstone',
)
await db.exec('reset role')
const awardSources = []
for (const author of ids) {
  const pid = randomUUID(),
    cid = randomUUID()
  await db.query(
    "insert into public.posts(id,author_id,kind,title,body,tags,visibility)values($1,$2,'question','Synthetic award boundary fixture','A synthetic reproducibility question for contribution budget validation.',array['Biomaterials'],'public')",
    [pid, author],
  )
  await db.query(
    "insert into public.comments(id,post_id,author_id,body)values($1,$2,$3,'A reproducible synthetic answer fixture.')",
    [cid, pid, recipient],
  )
  awardSources.push(cid)
}
for (const source of awardSources.slice(0, 5))
  await db.query(
    "insert into public.contributions(user_id,source_id,kind,points)values($1,$2,'accepted_answer',20)",
    [recipient, source],
  )
await deny(
  () =>
    db.query(
      "insert into public.contributions(user_id,source_id,kind,points)values($1,$2,'accepted_answer',20)",
      [recipient, awardSources[5]],
    ),
  'sixth distinct daily award is denied',
)
await db.query('update public.contributions set valid=false where user_id=$1', [
  recipient,
])
await deny(
  () =>
    db.query(
      "insert into public.contributions(user_id,source_id,kind,points)values($1,$2,'accepted_answer',20)",
      [recipient, awardSources[5]],
    ),
  'invalidating awards cannot reset daily abuse budget',
)
await db.query(
  "update public.membership_applications set decided_at=now()-interval '100 days'where id=$1",
  [appid],
)
await identity(null, 'service_role')
await db.query('select public.prune_retained_data()')
check(
  (await scalar(
    'select private_marks from public.membership_applications where id=$1',
    [appid],
  )) === '',
  'service retention clears aged optional marks',
)
await db.exec('reset role')
await deny(
  () => db.query('delete from auth.users where id=$1', [a]),
  'owned project foreign key blocks identity deletion',
)
await db.query('delete from auth.users where id=$1', [recipient])
check(
  (await scalar('select count(*)from public.contributions where user_id=$1', [
    recipient,
  ])) === 0,
  'identity cascade removes personal contribution records',
)
check(
  JSON.stringify(
    (
      await db.query(
        "select id,allowed_mime_types from storage.buckets where id in('academic-evidence','project-files')order by id",
      )
    ).rows,
  ) ===
    JSON.stringify([
      {
        id: 'academic-evidence',
        allowed_mime_types: ['image/png', 'image/jpeg'],
      },
      { id: 'project-files', allowed_mime_types: ['image/png'] },
    ]),
  'private buckets refuse documents; project files accept processor PNG only',
)
const reconcileSql = await readFile(
  'supabase/tests/storage-reconcile.sql',
  'utf8',
)
const reconcile = async () =>
  (await db.exec(reconcileSql)).flatMap((r) => r.rows ?? [])[0].reconciliation
await db.exec('reset role')
const beforeReconcile = await reconcile()
const kept = `${a}/${randomUUID()}.webp`
await db.query(
  'insert into public.avatars(user_id,path)values($1,$2)on conflict(user_id)do update set path=excluded.path',
  [a, kept],
)
for (const [bucket, name] of [
  ['avatars', kept],
  ['avatars', `${a}/${randomUUID()}.webp`],
  ['academic-evidence', `${a}/${randomUUID()}.png`],
])
  await db.query(
    'insert into storage.objects(id,bucket_id,name)values($1,$2,$3)',
    [randomUUID(), bucket, name],
  )
await db.query(
  "insert into private.storage_gc(bucket,path)values('project-files',$1)",
  [`${a}/${randomUUID()}.png`],
)
const afterReconcile = await reconcile()
const delta = (k) => Number(afterReconcile[k]) - Number(beforeReconcile[k])
check(
  delta('orphan_objects') === 1 &&
    delta('evidence_objects') === 1 &&
    delta('queued') >= 1 &&
    delta('stale_queue') === delta('queued') &&
    Number(afterReconcile.missing_objects) <=
      Number(beforeReconcile.missing_objects),
  'read-only reconciliation counts orphan, evidence and stale-queue storage drift',
)
check(
  (await scalar("select to_regnamespace('cron') is null")) === true,
  'retention schedule is skipped where pg_cron is unavailable',
)
// GitHub OAuth identity → automatic preview membership (migration 22).
await db.exec('reset role')
const [emailOnly, viaGithub, rejectedUser, suspendedUser] = Array.from(
  { length: 4 },
  () => randomUUID(),
)
for (const id of [emailOnly, viaGithub, rejectedUser, suspendedUser])
  await db.query('insert into auth.users values($1,null)', [id])
await db.query("update public.profiles set membership='rejected' where id=$1", [
  rejectedUser,
])
await db.query('update public.profiles set suspended=true where id=$1', [
  suspendedUser,
])
const membershipOf = (id) =>
  scalar('select membership from public.profiles where id=$1', [id])
await db.query(
  "insert into auth.identities(user_id,provider)values($1,'email')",
  [emailOnly],
)
check(
  (await membershipOf(emailOnly)) === 'not_submitted',
  'an email identity alone never grants membership',
)
await db.query(
  "insert into auth.identities(user_id,provider)values($1,'github')",
  [viaGithub],
)
check(
  (await membershipOf(viaGithub)) === 'approved' &&
    (await scalar(
      "select count(*)::int from public.audit where action='membership_auto_github' and target_id=$1",
      [viaGithub],
    )) === 1,
  'a GitHub OAuth identity approves preview membership with an audit record',
)
for (const id of [rejectedUser, suspendedUser])
  await db.query(
    "insert into auth.identities(user_id,provider)values($1,'github')",
    [id],
  )
check(
  (await membershipOf(rejectedUser)) === 'rejected' &&
    (await membershipOf(suspendedUser)) === 'not_submitted',
  'GitHub identity never overrides a staff rejection or a suspension',
)
for (const role of ['anon', 'authenticated']) {
  await identity(emailOnly, role)
  let denied = false
  try {
    await db.query(
      "insert into auth.identities(user_id,provider)values($1,'github')",
      [emailOnly],
    )
  } catch {
    denied = true
  }
  await db.exec('reset role')
  check(denied, role + ' cannot create an Auth identity to self-approve')
  let execDenied = false
  await identity(emailOnly, role)
  try {
    await db.query('select private.approve_github_identity()')
  } catch {
    execDenied = true
  }
  await db.exec('reset role')
  check(execDenied, role + ' cannot call the approval trigger function')
}
check(
  (await membershipOf(emailOnly)) === 'not_submitted',
  'denied attempts left the email-only account unapproved',
)
console.log(
  'Database authorization checks passed: ' +
    checks +
    ' (Supabase Auth/Storage services are stubbed, not live integration).',
)
await db.close()
