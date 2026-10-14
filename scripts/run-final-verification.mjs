import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const directory = `docs/verification/final-${stamp}`
await mkdir(directory, { recursive: true })
const checks = [
  ['format', 'npm.cmd run format:check'],
  ['lint', 'npm.cmd run lint'],
  ['types', 'npm.cmd run typecheck'],
  ['unit', 'npm.cmd test'],
  ['database', 'npm.cmd run test:db'],
  ['catalog', 'npm.cmd run test:cloud-catalog'],
  ['rls-planner', 'node scripts/test-rls-initplan.mjs'],
  ['edge', 'npm.cmd run test:edge'],
  ['edge-types', 'npm.cmd run typecheck:edge'],
  ['browser-demo', 'npm.cmd run test:e2e'],
  ['browser-connected', 'npm.cmd run test:staging-browser'],
  ['browser-recovery', 'node scripts/test-recovery-staging.mjs'],
  ['recovery-adoption', 'npm.cmd run test:recovery-adoption'],
  ['build', 'npm.cmd run build'],
  ['bundle', 'npm.cmd run check:bundle'],
  ['audit', 'npm.cmd audit --audit-level=moderate'],
  ['production', 'npm.cmd run test:production'],
  ['source-backup', 'npm.cmd run cloud:preflight'],
  ['retention-schedule', 'npm.cmd run test:retention-schedule'],
  ['storage-reconcile', 'npm.cmd run storage:reconcile'],
]
const results = []
for (const [name, command] of checks) {
  const start = Date.now()
  let output = ''
  const exit = await new Promise((resolve) => {
    const child = spawn(
      process.env.ComSpec ?? 'cmd.exe',
      ['/d', '/s', '/c', command],
      {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    )
    child.stdout.on('data', (x) => {
      output += x.toString()
    })
    child.stderr.on('data', (x) => {
      output += x.toString()
    })
    child.once('error', () => resolve(-1))
    child.once('exit', (code) => resolve(code ?? -1))
  })
  // These allowlisted commands do not load private account credentials into logs.
  // Stop saving output on conservative secret indicators; never print the match.
  const sensitive =
    /sb_secret_[A-Za-z0-9]+|sbp_[A-Za-z0-9]{20,}|-----BEGIN .*PRIVATE KEY-----|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}/.test(
      output,
    )
  await writeFile(
    `${directory}/${name}.txt`,
    sensitive
      ? 'Output withheld: sensitive-pattern guard triggered.\n'
      : output,
  )
  const result = {
    name,
    command,
    exitCode: exit,
    elapsedMs: Date.now() - start,
    outputWithheld: sensitive,
  }
  results.push(result)
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify(results, null, 2) + '\n',
  )
  console.log(JSON.stringify(result))
}
console.log(
  JSON.stringify({
    directory,
    passed: results.filter((x) => x.exitCode === 0 && !x.outputWithheld).length,
    total: results.length,
  }),
)
if (results.some((x) => x.exitCode !== 0 || x.outputWithheld))
  process.exitCode = 1
