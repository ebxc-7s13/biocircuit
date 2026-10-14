import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { createHash } from 'node:crypto'
import { readTarget } from './cloud-target.mjs'

const target = await readTarget()
assert.equal(target.projectRef, 'ibxubsegrabpspopdgep')
const cli = resolve('node_modules/@supabase/cli-windows-x64/bin/supabase.exe')
const workspace = resolve('.cloud/recovery-settings')
const html = await readFile('supabase/templates/recovery.html', 'utf8')
assert.ok(html.includes('{{ .TokenHash }}') && html.includes('{{ .Token }}'))
assert.ok(!/\{\{\s*\.(?:Data|Email|Phone)\b/.test(html))
const apply = process.argv.includes('--apply-reviewed')
const redirectOnly = process.argv.includes('--redirect-only')
const report = {
  projectRef: target.projectRef,
  scope:
    'Supported CLI selective Auth template/redirect configuration; no SMTP credentials, delivery or reset evidence',
  applyRequested: apply,
  redirectOnly,
  templateSha256: createHash('sha256').update(html).digest('hex'),
  redirect: target.frontendOrigin + '/account/recovery',
}
const run = async (args) => {
  try {
    const stdout = await new Promise((done, fail) => {
      const child = execFile(
        cli,
        args,
        {
          windowsHide: true,
          maxBuffer: 2e6,
          timeout: 60000,
        },
        (error, stdout) =>
          error ? fail(Error('Command unavailable')) : done(stdout),
      )
      child.stdin?.end()
    })
    return JSON.parse(stdout)
  } catch {
    throw Error(
      'Supported configuration command failed; private output withheld',
    )
  }
}
try {
  const projects = await run(['projects', 'list', '--output', 'json'])
  assert.ok(
    projects.some(
      (p) => p.id === target.projectRef && p.name === target.projectName,
    ),
  )
  report.identityVerified = true
  await mkdir(join(workspace, 'supabase/templates'), { recursive: true })
  await writeFile(join(workspace, 'supabase/templates/recovery.html'), html)
  // Probe SMTP without changing it. An actual enabled service creates drift.
  const sparse = `project_id = "biocircuit-recovery-staging"
[auth]
additional_redirect_urls = [${JSON.stringify(report.redirect)}]
[auth.email.smtp]
enabled = false
[auth.email.template.recovery]
subject = "Reset your BioCircuit password"
content_path = "supabase/templates/recovery.html"
`
  await writeFile(join(workspace, 'supabase/config.toml'), sparse)
  const args = [
    '--project-ref',
    target.projectRef,
    '--workdir',
    workspace,
    '--output-format',
    'json',
  ]
  const preview = await run(['config', 'diff', ...args])
  assert.ok(preview.scope.present.includes('auth'))
  const declared = preview.changes.filter((c) => c.declared)
  const smtp = declared.find(
    (c) => c.path.join('.') === 'auth.email.smtp.enabled',
  )
  report.customSmtpEnabled = smtp ? smtp.remote : false
  // Keep all existing exact redirects. Never erase an existing operator entry.
  const redirects = declared.find(
    (c) => c.path.join('.') === 'auth.additional_redirect_urls',
  )
  const allowed = [
    ...new Set([...(redirects?.remote ?? [report.redirect]), report.redirect]),
  ]
  const config = sparse
    .replace(
      /additional_redirect_urls = .*\n/,
      `additional_redirect_urls = ${JSON.stringify(allowed)}\n`,
    )
    .replace('[auth.email.smtp]\nenabled = false\n', '')
  await writeFile(
    join(workspace, 'supabase/config.toml'),
    redirectOnly ? config.split('[auth.email.template.recovery]')[0] : config,
  )
  const reviewed = await run(['config', 'diff', ...args])
  report.reviewedDeclaredPaths = reviewed.changes
    .filter((c) => c.declared)
    .map((c) => c.path.join('.'))
  assert.ok(
    report.reviewedDeclaredPaths.every((p) =>
      [
        'auth.additional_redirect_urls',
        'auth.email.template.recovery.subject',
      ].includes(p),
    ),
  )
  assert.equal(reviewed.masked.length, 0)
  // Content is a push-only extra: diff does not compare it. Reviewed official
  // CLI encoder loads only this file and compares hosted content byte-for-byte.
  if (apply) {
    if (!redirectOnly && !report.customSmtpEnabled) {
      report.blocked =
        'Hosted template customization requires configured custom SMTP on this free project'
      process.exitCode = 2
      throw Error('External sender prerequisite')
    }
    const pushed = await run(['config', 'push', ...args, '--yes'])
    report.push = {
      keys: Object.keys(pushed),
      services: pushed.services?.map((service) => ({
        resource: service.resource ?? service.name,
        status: service.status,
        changes: service.changes,
      })),
    }
    const after = await run(['config', 'diff', ...args])
    report.remainingDeclaredChanges = after.changes
      .filter((c) => c.declared)
      .map((c) => c.path.join('.'))
    assert.equal(report.remainingDeclaredChanges.length, 0)
    // With piped empty stdin and no --yes any new differences are declined.
    // If unchanged, CLI proves its fresh hosted HTML comparison, no write.
    const readback = await run(['config', 'push', ...args])
    report[redirectOnly ? 'redirectReadback' : 'contentReadback'] = {
      services: readback.services?.map((service) => ({
        resource: service.resource ?? service.name,
        status: service.status,
        changes: service.changes,
      })),
      counts: readback.counts,
    }
  }
} catch {
  if (!report.blocked) {
    report.failed = true
    process.exitCode = 1
  }
} finally {
  const file = `docs/verification/cloud/recovery-config-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  await writeFile(file, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report))
}
