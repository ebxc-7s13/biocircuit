import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'
// Live staging check of the free pg_cron retention schedule. The job command is executed
// inside a transaction that is always rolled back; only aggregate counts are recorded.
const target = await readTarget()
const base = [
  'db',
  'query',
  '--linked',
  '--project-ref',
  target.projectRef,
  '--output-format',
  'json',
]
const rows = async (sql) => (await stagingCli([...base, sql])).rows
const report = {
  projectRef: target.projectRef,
  scope:
    'LIVE staging: schedule readback, eligible-row counts and rolled-back execution of the exact job command',
  checks: [],
}
const check = (name, pass, observed = {}) => {
  report.checks.push({ name, status: pass ? 'PASS - LIVE' : 'FAIL', observed })
  if (!pass) process.exitCode = 1
}
try {
  const [job] = await rows(
    "begin read only; select jobname,schedule,command,active,username from cron.job where jobname='biocircuit-retention'; rollback;",
  )
  check(
    'Retention job scheduled daily and active',
    job?.schedule === '17 3 * * *' && job.active === true,
    { schedule: job?.schedule, active: job?.active, owner: job?.username },
  )
  const [eligible] = await rows(
    "begin read only; select (select count(*) from public.membership_applications where decided_at<now()-interval '90 days' and private_marks<>'')::int as aged_marks,(select count(*) from public.audit where created_at<now()-interval '365 days')::int as aged_audit,(select count(*) from private.action_receipts where created_at<now()-interval '30 days')::int as aged_receipts,(select count(*) from private.scholarly_cache where expires_at<now())::int as expired_cache; rollback;",
  )
  check('Eligible-row inventory recorded (aggregate only)', true, eligible)
  let executed = false
  try {
    await stagingCli([...base, `begin; ${job.command}; rollback;`])
    executed = true
  } catch {
    executed = false
  }
  check('Exact job command executes on hosted Postgres (rolled back)', executed)
  const runs = await rows(
    "begin read only; select status,count(*)::int as n from cron.job_run_details d join cron.job j using(jobid) where j.jobname='biocircuit-retention' group by status; rollback;",
  )
  report.runHistory = runs
  check(
    'No failed scheduled runs recorded',
    !runs.some((r) => r.status === 'failed'),
    { runs },
  )
  const clients = await rows(
    "begin read only; select has_function_privilege('authenticated','public.prune_retained_data()','EXECUTE') as authenticated,has_function_privilege('anon','public.prune_retained_data()','EXECUTE') as anon,has_schema_privilege('authenticated','cron','USAGE') as cron_authenticated,has_schema_privilege('anon','cron','USAGE') as cron_anon; rollback;",
  )
  check(
    'Clients cannot execute retention or use the cron schema',
    Object.values(clients[0]).every((v) => v === false),
    clients[0],
  )
} catch (error) {
  assert.ok(error)
  report.failed = true
  process.exitCode = 1
}
const file = `docs/verification/cloud/retention-schedule-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
await writeFile(file, JSON.stringify(report, null, 2) + '\n')
console.log(
  JSON.stringify({ file, failed: !!report.failed, checks: report.checks }),
)
