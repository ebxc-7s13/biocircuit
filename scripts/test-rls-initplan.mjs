import assert from 'node:assert/strict'
import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'

const db = new PGlite()
const report = {
  scope:
    'LOCAL PostgreSQL/PGlite planner and RLS equivalence; synthetic Auth/Storage, not live permission evidence',
  checks: [],
}
const check = (name, pass) => {
  assert.ok(pass)
  report.checks.push({ name, passed: true })
}
try {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,phone_confirmed_at timestamptz);create table auth.identities(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,provider text not null);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid()to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;`,
  )
  const all = (await readdir('supabase/migrations'))
    .filter((x) => x.endsWith('.sql'))
    .sort()
  const initplan = all.indexOf('20261013000100_rls_initplan.sql')
  assert.ok(initplan > 0)
  for (const file of all.slice(0, initplan))
    await db.exec(await readFile('supabase/migrations/' + file, 'utf8'))
  const policies = async () =>
    (
      await db.query(
        "select tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname",
      )
    ).rows
  const before = await policies()
  const [a, b] = [randomUUID(), randomUUID()]
  for (const id of [a, b]) {
    await db.query('insert into auth.users values($1,null)', [id])
    await db.query(
      "update public.profiles set name='Synthetic planner fixture',visibility='private' where id=$1",
      [id],
    )
    await db.query('insert into public.preferences(user_id) values($1)', [id])
  }
  const identity = async (id, role = 'authenticated') => {
    await db.exec('reset role')
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id ?? '',
    ])
    await db.exec('set role ' + role)
  }
  const counts = async () => {
    const profiles = (await db.query('select count(*) from public.profiles'))
      .rows[0].count
    try {
      return {
        profiles,
        preferences: (await db.query('select count(*) from public.preferences'))
          .rows[0].count,
      }
    } catch (error) {
      assert.equal(error.code, '42501')
      return { profiles, preferences: 'GRANT_DENIED' }
    }
  }
  const baseline = []
  for (const id of [a, b, null]) {
    await identity(id, id ? 'authenticated' : 'anon')
    baseline.push(await counts())
  }
  await identity(a)
  const beforePlan = (
    await db.query('explain (format json) select * from public.preferences')
  ).rows[0]['QUERY PLAN']
  await db.exec('reset role')
  await db.exec(await readFile('supabase/migrations/' + all[initplan], 'utf8'))
  const after = await policies()
  check(
    'Policy count, roles, permissiveness, commands and WITH CHECK are unchanged',
    JSON.stringify(before.map(({ qual: _qual, ...x }) => x)) ===
      JSON.stringify(after.map(({ qual: _qual, ...x }) => x)),
  )
  const changed = before.filter((x, i) => x.qual !== after[i].qual)
  check('Exactly seventeen warned policies changed', changed.length === 17)
  check(
    'Only auth.uid calls gained a scalar SELECT; row-dependent helpers unchanged',
    changed.every((x) => {
      const y = after.find(
        (p) => p.tablename === x.tablename && p.policyname === x.policyname,
      )
      return (
        y.qual.replace(/\( SELECT auth\.uid\(\) AS uid\)/g, 'auth.uid()') ===
        x.qual
      )
    }),
  )
  const observed = []
  for (const id of [a, b, null]) {
    await identity(id, id ? 'authenticated' : 'anon')
    observed.push(await counts())
  }
  check(
    'Populated local A/B own-only reads and anonymous denials are identical',
    JSON.stringify(observed) === JSON.stringify(baseline) &&
      baseline[0].profiles === 1 &&
      baseline[1].profiles === 1 &&
      baseline[2].profiles === 0,
  )
  await identity(a)
  const afterPlan = (
    await db.query('explain (format json) select * from public.preferences')
  ).rows[0]['QUERY PLAN']
  const initplans = (value) => {
    if (Array.isArray(value)) return value.reduce((n, x) => n + initplans(x), 0)
    if (value && typeof value === 'object')
      return (
        (value['Parent Relationship'] === 'InitPlan' ? 1 : 0) +
        Object.values(value).reduce((n, x) => n + initplans(x), 0)
      )
    return 0
  }
  report.planner = {
    beforeInitplans: initplans(beforePlan),
    afterInitplans: initplans(afterPlan),
  }
  check(
    'Actual PostgreSQL EXPLAIN confirms per-statement InitPlan',
    report.planner.beforeInitplans === 0 && report.planner.afterInitplans > 0,
  )
  let denied = false
  try {
    await db.query(
      'update public.preferences set in_app=false where user_id=$1',
      [b],
    )
  } catch {
    denied = true
  }
  check('Authenticated direct write grants remain revoked', denied)
} catch {
  report.failed = true
  process.exitCode = 1
} finally {
  await db.close()
  await writeFile(
    'docs/verification/cloud/final-rls-local.json',
    JSON.stringify(report, null, 2) + '\n',
  )
  console.log(JSON.stringify(report))
}
