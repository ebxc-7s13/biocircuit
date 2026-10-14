import { PGlite } from '@electric-sql/pglite'
import { readFile, readdir } from 'node:fs/promises'

// Deliberately local-only: this module has no network/database connection input.
// Auth, roles, marks, projects and Storage are NOT restored by this rehearsal.
export async function restorePersonalCore(snapshot, actor) {
  if (
    snapshot?.version !== 1 ||
    snapshot.projectRef !== 'ibxubsegrabpspopdgep' ||
    !/^[0-9a-f-]{36}$/.test(actor) ||
    snapshot.data?.profile?.id !== actor ||
    snapshot.data?.preferences?.user_id !== actor ||
    snapshot.data.profile.phone_verified !== false ||
    snapshot.data.profile.membership !== 'not_submitted'
  )
    throw Error('Personal recovery identity or scope refused')
  const db = new PGlite()
  try {
    await db.exec(
      `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key,phone_confirmed_at timestamptz);create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid()to anon,authenticated;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key,bucket_id text,name text);alter table storage.objects enable row level security;`,
    )
    const files = (await readdir('supabase/migrations'))
      .filter((x) => x.endsWith('.sql'))
      .sort()
    for (const file of files)
      await db.exec(await readFile('supabase/migrations/' + file, 'utf8'))
    await db.exec('begin')
    await db.query(
      'insert into auth.users(id,phone_confirmed_at) values($1,null)',
      [actor],
    )
    for (const [table, data, id] of [
      ['profiles', snapshot.data.profile, 'id'],
      ['preferences', snapshot.data.preferences, 'user_id'],
    ]) {
      const columns = (
        await db.query(
          "select column_name from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position",
          [table],
        )
      ).rows.map((x) => x.column_name)
      if (
        Object.keys(data).some((x) => !columns.includes(x)) ||
        columns.some((x) => !Object.hasOwn(data, x))
      )
        throw Error('Personal recovery schema mismatch')
      // Table and columns are catalog-derived/allowlisted, values parameterized.
      if (table === 'profiles')
        await db.query('delete from public.profiles where id=$1', [actor])
      await db.query(
        `insert into public.${table} select * from jsonb_populate_record(null::public.${table},$1::jsonb)`,
        [JSON.stringify(data)],
      )
      const row = (
        await db.query(
          `select to_jsonb(x) as value from public.${table} x where ${id}=$1`,
          [actor],
        )
      ).rows[0]?.value
      const normalized = (value) =>
        JSON.stringify(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      // jsonb export uses the hosted session's timezone presentation. Compare
      // every field after PostgreSQL applies the schema types, preserving full
      // timestamp precision instead of rounding through JavaScript Date.
      const expected = (
        await db.query(
          `select to_jsonb(x) as value from jsonb_populate_record(null::public.${table},$1::jsonb) x`,
          [JSON.stringify(data)],
        )
      ).rows[0].value
      if (normalized(row) !== normalized(expected))
        throw Error('Personal recovery readback mismatch')
    }
    await db.exec('commit')
    return {
      migrated: files.length,
      restoredProfiles: 1,
      restoredPreferences: 1,
      exactReadback: true,
      scope:
        'ISOLATED LOCAL PostgreSQL core rows only; no hosted restore, Auth credentials, private media or other-user data',
    }
  } finally {
    await db.close()
  }
}
