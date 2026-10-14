import { readFile, readdir, mkdir, copyFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, resolve } from 'node:path'
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const migrationNames = (await readdir('supabase/migrations'))
  .filter((f) => f.endsWith('.sql'))
  .sort()
if (
  migrationNames.length !== 22 ||
  migrationNames[19] !== '20261013000100_rls_initplan.sql' ||
  migrationNames[20] !== '20261014000100_storage_retention.sql' ||
  migrationNames[21] !== '20261014000200_github_participation.sql' ||
  migrationNames
    .slice(0, 19)
    .some(
      (f, i) =>
        !f.startsWith('20261010' + String(i + 1).padStart(4, '0') + '00_'),
    )
)
  throw Error(
    'Expected migration chain has changed: review before cloud operation',
  )
const migrations = []
for (const file of migrationNames) {
  const bytes = await readFile(join('supabase/migrations', file))
  migrations.push({ file, sha256: hash(bytes), bytes: bytes.length })
}
const ignore = await readFile('.gitignore', 'utf8')
for (const pattern of [
  '.env.*',
  '*.log',
  '.cloud/',
  'supabase/.temp/',
  'secrets/',
  'credentials/',
])
  if (!ignore.split(/\r?\n/).includes(pattern))
    throw Error('Local credential/evidence ignore rule missing')
const envFiles = (await readdir('.')).filter(
  (f) => f === '.env' || (f.startsWith('.env.') && f !== '.env.example'),
)
const environment = []
for (const file of envFiles) {
  // Inspect names only. Values never enter the report or backup.
  const content = await readFile(file, 'utf8')
  environment.push({
    file,
    names: [
      ...content.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm),
    ].map((m) => m[1]),
  })
}
const root = process.cwd()
const backup = resolve(
  '.cloud/backups',
  new Date().toISOString().replace(/[:.]/g, '-'),
)
const files = []
const include = async (directory) => {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    if (item.isSymbolicLink()) continue
    const file = join(directory, item.name)
    if (item.isDirectory()) {
      if (!item.name.startsWith('.') && item.name !== 'node_modules')
        await include(file)
    } else if (
      /\.(?:tsx?|m?js|json|sql|toml|css|svg|woff2|txt|html|ps1)$/.test(
        item.name,
      ) ||
      ['_headers', '_redirects'].includes(item.name)
    )
      files.push(file)
  }
}
for (const folder of ['src', 'scripts', 'tests', 'supabase', 'public'])
  await include(folder)
for (const file of [
  'package.json',
  'package-lock.json',
  'README.md',
  '.gitignore',
  '.env.example',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'vitest.config.ts',
  'playwright.config.ts',
  'eslint.config.js',
])
  files.push(file)
const fingerprints = []
for (const file of files) {
  const bytes = await readFile(file)
  // Conservative pattern check, not an exhaustive secret scanner.
  if (
    /sb_secret_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      bytes.toString('utf8'),
    )
  )
    throw Error(
      'Backup refused: potential privileged secret in an allowlisted source file',
    )
  const target = join(backup, file)
  if (!target.startsWith(backup + '\\') && !target.startsWith(backup + '/'))
    throw Error('Backup path escaped workspace')
  await mkdir(join(target, '..'), { recursive: true })
  await copyFile(file, target)
  fingerprints.push({ file: file.replaceAll('\\', '/'), sha256: hash(bytes) })
}
const result = {
  scope:
    'PASS — LOCAL ONLY: source/ignore/hash review; no cloud request, OTP or hosted RLS test',
  migrationCount: migrations.length,
  migrations,
  environment,
  backup: backup.slice(root.length + 1).replaceAll('\\', '/'),
  filesCopied: files.length,
  fingerprints,
  excluded:
    'All actual env/credential/session files, CLI state, logs, cloud targets, generated reports, user data and caches are excluded by allowlist; no Git initialization.',
}
await mkdir('docs/verification/cloud', { recursive: true })
await writeFile(
  'docs/verification/cloud/preflight.json',
  JSON.stringify(result, null, 2) + '\n',
)
console.log(
  JSON.stringify(
    {
      scope: result.scope,
      migrationCount: result.migrationCount,
      environmentFiles: environment.map((e) => e.file),
      filesCopied: result.filesCopied,
      backup: result.backup,
    },
    null,
    2,
  ),
)
