import { writeFile } from 'node:fs/promises'
import { stagingCli } from './staging-cli.mjs'
import { readTarget } from './cloud-target.mjs'
// Read-only live readback of the public-preview membership rule (GitHub
// identity => approved). Records only catalog facts and aggregate counts.
const target = await readTarget()
const base = ['db', 'query', '--linked', '--project-ref', target.projectRef]
const rows = async (sql) =>
  (await stagingCli([...base, '--output-format', 'json', sql])).rows
const [trigger] = await rows(`
  select t.tgenabled <> 'D' as enabled, p.proname as fn,
         pg_get_triggerdef(t.oid) like '%provider = ''github''%' as github_only,
         p.prosecdef as security_definer,
         has_function_privilege('anon', p.oid, 'execute') as anon_exec,
         has_function_privilege('authenticated', p.oid, 'execute') as auth_exec
    from pg_trigger t join pg_proc p on p.oid = t.tgfoid
   where t.tgname = 'auth_github_participation'
     and t.tgrelid = 'auth.identities'::regclass`)
const counts = await rows(`
  select (select count(*) from auth.identities where provider = 'github')::int as github_identities,
         (select count(*) from public.audit where action = 'membership_auto_github')::int as auto_approvals,
         (select count(*) from public.profiles where membership = 'approved')::int as approved_profiles`)
const report = {
  checkedAt: new Date().toISOString(),
  projectRef: target.projectRef,
  trigger: trigger ?? null,
  ...counts[0],
}
console.log(JSON.stringify(report, null, 1))
await writeFile(
  `docs/verification/cloud/membership-policy-${report.checkedAt.replace(/[:.]/g, '-')}.json`,
  JSON.stringify(report, null, 2) + '\n',
)
if (
  !trigger?.enabled ||
  !trigger.github_only ||
  trigger.anon_exec ||
  trigger.auth_exec
)
  process.exitCode = 1
