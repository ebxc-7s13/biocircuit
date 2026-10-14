import { writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'
// Read-only hosted private-media reconciliation. Aggregate counts only; any non-zero
// drift is reported for the operator, never repaired automatically.
const target = await readTarget()
const report = {
  projectRef: target.projectRef,
  scope:
    'LIVE staging read-only reconciliation of Storage objects, owning records and the deletion queue; aggregate counts only',
}
try {
  const result = await stagingCli([
    'db',
    'query',
    '--linked',
    '--project-ref',
    target.projectRef,
    '--output-format',
    'json',
    '--file',
    'supabase/tests/storage-reconcile.sql',
  ])
  const counts = Object.fromEntries(
    Object.entries(result.rows[0].reconciliation).map(([k, v]) => [
      k,
      Number(v),
    ]),
  )
  report.counts = counts
  report.drift =
    counts.orphan_objects + counts.missing_objects + counts.evidence_objects > 0
  report.status = report.drift ? 'DRIFT - OPERATOR REVIEW' : 'PASS - LIVE'
  if (report.drift) process.exitCode = 2
} catch {
  report.failed = true
  process.exitCode = 1
}
const file = `docs/verification/cloud/storage-reconcile-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ file, ...report }))
