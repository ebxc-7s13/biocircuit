import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'
const target = await readTarget()
const name = '20261014000100_storage_retention.sql'
const apply = process.argv.includes('--apply-reviewed')
const report = {
  projectRef: target.projectRef,
  scope:
    'Reviewed forward migration: private bucket MIME narrowing and pg_cron retention schedule only; no seed, roles, Vault, user data or reset',
  applyRequested: apply,
}
const linked = ['--linked', '--project-ref', target.projectRef]
const query = async (sql) =>
  (
    await stagingCli([
      'db',
      'query',
      ...linked,
      '--output-format',
      'json',
      `begin read only; ${sql}; rollback;`,
    ])
  ).rows
const state = async () => ({
  buckets: await query(
    "select id,allowed_mime_types,file_size_limit,public from storage.buckets where id in('academic-evidence','project-files','avatars')order by id",
  ),
  objects: (await query('select count(*)::int as n from storage.objects'))[0].n,
  cronInstalled: (
    await query(
      "select count(*)::int as n from pg_extension where extname='pg_cron'",
    )
  )[0].n,
})
try {
  const projects = await stagingCli(['projects', 'list', '--output', 'json'])
  assert.ok(
    projects.some(
      (p) =>
        p.id === target.projectRef &&
        p.name === target.projectName &&
        p.status === 'ACTIVE_HEALTHY',
    ),
  )
  const sql = (await readFile('supabase/migrations/' + name, 'utf8')).replace(
    /--[^\n]*/g,
    '',
  )
  // Static review: only the two bucket updates, the extension and one named schedule.
  assert.equal(sql.match(/\bupdate\b/gi)?.length, 2)
  assert.equal(
    sql.match(
      /update storage\.buckets set allowed_mime_types=array\[[^\]]*\]where id='(project-files|academic-evidence)';/g,
    )?.length,
    2,
  )
  assert.equal(sql.match(/\bcreate\b/gi)?.length, 1)
  assert.ok(
    /create extension if not exists pg_cron with schema pg_catalog;/.test(sql),
  )
  assert.equal(sql.match(/cron\.schedule\(/g)?.length, 1)
  assert.ok(!/application\/pdf/.test(sql))
  assert.ok(
    !/\b(?:insert|truncate|drop|grant|revoke|disable|alter)\b/i.test(sql),
  )
  report.before = await state()
  assert.equal(report.before.objects, 0)
  const args = [...linked, '--skip-vault', '--output-format', 'json']
  const preview = await stagingCli(['db', 'push', ...args, '--dry-run'])
  assert.equal(preview.dryRun, true)
  assert.deepEqual(preview.seeds, [])
  assert.deepEqual(preview.roles, [])
  assert.ok(
    JSON.stringify(preview.migrations) === JSON.stringify([name]) ||
      (preview.upToDate === true && preview.migrations.length === 0),
  )
  report.preview = {
    dryRun: preview.dryRun,
    migrations: preview.migrations,
    seeds: preview.seeds,
    roles: preview.roles,
  }
  if (apply && preview.migrations.length) {
    const result = await stagingCli(['db', 'push', ...args, '--yes'])
    report.result = { migrations: result.migrations, upToDate: result.upToDate }
  }
  if (apply) {
    const after = await stagingCli(['db', 'push', ...args, '--dry-run'])
    report.readback = { upToDate: after.upToDate, migrations: after.migrations }
    assert.ok(after.upToDate && after.migrations.length === 0)
    report.after = await state()
    report.after.jobs = await query(
      'select jobname,schedule,command,active from cron.job order by jobname',
    )
    assert.deepEqual(
      report.after.buckets.map((b) => [b.id, b.allowed_mime_types]),
      [
        ['academic-evidence', ['image/png', 'image/jpeg']],
        ['avatars', ['image/webp']],
        ['project-files', ['image/png']],
      ],
    )
    assert.equal(report.after.cronInstalled, 1)
    assert.deepEqual(
      report.after.jobs.map((j) => [j.jobname, j.schedule, j.active]),
      [['biocircuit-retention', '17 3 * * *', true]],
    )
  }
} catch (error) {
  report.failed = true
  report.failure = error?.code === 'ERR_ASSERTION' ? 'assertion' : 'cli'
  process.exitCode = 1
}
const file = `docs/verification/cloud/storage-retention-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))
