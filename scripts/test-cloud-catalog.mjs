import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'
import assert from 'node:assert/strict'
const db = new PGlite()
let checks = 0
const equal = (actual, expected) => {
  assert.deepEqual(actual, expected)
  checks++
}
const ok = (actual) => {
  assert.ok(actual)
  checks++
}
try {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,phone_confirmed_at timestamptz);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid()to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;`,
  )
  const before = await db.exec(
    await readFile('supabase/tests/cloud-before-migrate.sql', 'utf8'),
  )
  const inventory = before.flatMap((r) => r.rows ?? [])[0]
  equal(Number(inventory.public_tables), 0)
  equal(Number(inventory.public_views), 0)
  equal(inventory.private_schema_exists, false)
  equal(Number(inventory.bucket_count), 0)
  equal(Number(inventory.app_auth_triggers), 0)
  for (const name of (await readdir('supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort())
    await db.exec(await readFile('supabase/migrations/' + name, 'utf8'))
  const result = await db.exec(
    await readFile('supabase/tests/cloud-catalog.sql', 'utf8'),
  )
  const rows = result.flatMap((r) => r.rows ?? [])
  const table = rows.find((r) => r.gate === 'application_tables')
  equal(Number(table.actual), 29)
  equal(Number(table.rls_enabled), 29)
  for (const name of ['client_write_grants', 'definer_search_paths'])
    equal(rows.find((r) => r.gate === name).violations, [])
  const buckets = rows.filter((r) => r.gate === 'private_buckets')
  equal(buckets.length, 3)
  ok(buckets.every((b) => b.public === false))
  equal(
    buckets.map((b) => [b.id, Number(b.file_size_limit), b.allowed_mime_types]),
    [
      ['academic-evidence', 5242880, ['image/png', 'image/jpeg']],
      ['avatars', 524288, ['image/webp']],
      ['project-files', 5242880, ['image/png']],
    ],
  )
  ok(buckets.every((b) => !b.allowed_mime_types.includes('application/pdf')))
  equal(
    rows.filter(
      (r) =>
        r.gate === 'storage_policies_review' &&
        ['INSERT', 'ALL'].includes(r.cmd),
    ),
    [],
  )
  equal(
    rows.filter((r) => r.gate === 'auth_triggers' && r.tgenabled === 'O')
      .length,
    2,
  )
  const privileges = rows.find((r) => r.gate === 'privileged_rpcs')
  ok(
    Object.entries(privileges).every(
      ([key, value]) => key === 'gate' || value === false,
    ),
  )
  // The hosted Management API returns one result set. Check that its adapter
  // retains every gate from the multi-result local query without weakening it.
  const apiResult = await db.exec(
    await readFile('supabase/tests/cloud-catalog-api.sql', 'utf8'),
  )
  const catalog = apiResult.flatMap((r) => r.rows ?? [])[0].catalog
  equal(Number(catalog.application_tables.actual), Number(table.actual))
  equal(
    Number(catalog.application_tables.rls_enabled),
    Number(table.rls_enabled),
  )
  equal(catalog.application_tables.missing_rls, [])
  equal(catalog.client_write_grants, [])
  equal(catalog.definer_search_paths, [])
  equal(
    catalog.private_buckets,
    buckets.map((b) => ({
      id: b.id,
      public: b.public,
      file_size_limit: Number(b.file_size_limit),
      allowed_mime_types: b.allowed_mime_types,
    })),
  )
  equal(catalog.storage_policies, [])
  equal(catalog.auth_triggers.filter((t) => t.enabled === 'O').length, 2)
  ok(Object.values(catalog.privileged_rpcs).every((value) => value === false))
  equal(catalog.expected_snapshot, true)
  ok(Number(catalog.public_indexes) > 0)
  console.log(
    `PASS — LOCAL ONLY: ${checks} hosted-catalog assertions execute against 21 migrations in PGlite; Auth/Storage stubs, not live cloud verification.`,
  )
} finally {
  await db.close()
}
