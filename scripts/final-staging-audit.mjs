import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'

const target = await readTarget()
const report = {
  projectRef: target.projectRef,
  scope:
    'Read-only hosted identity/catalog/ledger/advisors and secret names only; no user records or secret values',
  checks: [],
}
const args = [
  '--linked',
  '--project-ref',
  target.projectRef,
  '--output-format',
  'json',
]
try {
  const projects = await stagingCli(['projects', 'list', '--output', 'json'])
  const selected = projects.find((p) => p.id === target.projectRef)
  assert.ok(
    selected?.name === target.projectName &&
      selected.status === 'ACTIVE_HEALTHY',
  )
  report.identity = {
    name: selected.name,
    status: selected.status,
    verified: true,
  }
  const catalog = await stagingCli([
    'db',
    'query',
    ...args,
    '--file',
    'supabase/tests/cloud-catalog-api.sql',
  ])
  report.catalogResult = catalog
  const ledger = await stagingCli([
    'db',
    'query',
    ...args,
    'begin read only; select count(*) as applied, jsonb_agg(version order by version) as versions from supabase_migrations.schema_migrations; rollback;',
  ])
  report.migrationResult = ledger
  const advisors = await stagingCli([
    'db',
    'advisors',
    ...args,
    '--type',
    'all',
    '--level',
    'warn',
  ])
  const list = advisors.results ?? advisors
  assert.ok(Array.isArray(list))
  report.advisors = list.map((x) => ({
    name: x.name,
    title: x.title,
    level: x.level,
    categories: x.categories,
    detail: x.detail,
    remediation: x.remediation,
    metadata: x.metadata,
  }))
  report.advisorCounts = report.advisors.reduce((out, x) => {
    const k = x.level + ':' + x.name
    out[k] = (out[k] ?? 0) + 1
    return out
  }, {})
  const functions = await stagingCli([
    'functions',
    'list',
    '--project-ref',
    target.projectRef,
    '--output',
    'json',
  ])
  report.functions = functions.map((f) => ({
    name: f.name,
    status: f.status,
    verifyJwt: f.verify_jwt,
  }))
  const secrets = await stagingCli([
    'secrets',
    'list',
    '--project-ref',
    target.projectRef,
    '--output',
    'json',
  ])
  const expected = [
    'ALLOWED_ORIGIN',
    'CROSSREF_MAILTO',
    'NCBI_EMAIL',
    'NCBI_API_KEY',
    'AVATAR_PROCESSOR_URL',
    'PROJECT_IMAGE_PROCESSOR_URL',
    'AVATAR_PROCESSOR_TOKEN',
  ]
  report.integrationConfiguration = Object.fromEntries(
    expected.map((n) => [n, secrets.some((x) => x.name === n)]),
  )
} catch {
  report.failed = true
  process.exitCode = 1
}
const file = `docs/verification/cloud/final-audit-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(
  JSON.stringify({
    file,
    failed: !!report.failed,
    identity: report.identity,
    advisorCounts: report.advisorCounts,
    functions: report.functions,
    catalogShape: report.catalogResult ? Object.keys(report.catalogResult) : [],
  }),
)
