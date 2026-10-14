import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'
const target = await readTarget()
const name = '20261013000100_rls_initplan.sql'
const apply = process.argv.includes('--apply-reviewed')
const report = {
  projectRef: target.projectRef,
  scope:
    'Reviewed forward RLS planner migration only; no seed, roles, Vault, user data or reset',
  applyRequested: apply,
}
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
  assert.equal(sql.match(/^alter policy /gim)?.length, 17)
  assert.ok(
    !/\b(?:insert|update|delete|truncate|drop|create|grant|revoke|disable)\b/i.test(
      sql,
    ),
  )
  const args = [
    '--linked',
    '--project-ref',
    target.projectRef,
    '--skip-vault',
    '--output-format',
    'json',
  ]
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
    report.result = {
      upToDate: result.upToDate,
      dryRun: result.dryRun,
      migrations: result.migrations,
      seeds: result.seeds,
      roles: result.roles,
    }
  }
  if (apply) {
    const after = await stagingCli(['db', 'push', ...args, '--dry-run'])
    report.readback = { upToDate: after.upToDate, migrations: after.migrations }
    assert.ok(after.upToDate && after.migrations.length === 0)
  }
} catch {
  report.failed = true
  process.exitCode = 1
}
const file = `docs/verification/cloud/final-rls-migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report))
