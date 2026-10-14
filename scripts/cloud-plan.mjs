import { readTarget } from './cloud-target.mjs'
import { readdir } from 'node:fs/promises'
try {
  const target = await readTarget()
  const migrations = (await readdir('supabase/migrations'))
    .filter((f) => f.endsWith('.sql'))
    .sort()
  const ref = target.projectRef
  console.log(
    JSON.stringify(
      {
        scope: 'Reviewed command plan only: no remote commands are executed',
        target,
        migrations,
        prerequisite:
          'Authenticate interactively; match exact name/ref in projects list before linking. Review remote migration list and dry-run before push.',
        commands: [
          'npm.cmd exec -- supabase login',
          'npm.cmd exec -- supabase projects list',
          `npm.cmd exec -- supabase link --project-ref ${ref}`,
          `npm.cmd exec -- supabase migration list --project-ref ${ref}`,
          `npm.cmd exec -- supabase db query --linked --project-ref ${ref} --file supabase/tests/cloud-before-migrate.sql`,
          `npm.cmd exec -- supabase db push --project-ref ${ref} --dry-run --skip-vault`,
          `npm.cmd exec -- supabase db push --project-ref ${ref} --skip-vault`,
          ...[
            'scholarly-search',
            'account-delete',
            'avatar',
            'project-images',
          ].map(
            (name) =>
              `npm.cmd exec -- supabase functions deploy ${name} --project-ref ${ref} --use-api`,
          ),
          `npm.cmd exec -- supabase db query --linked --project-ref ${ref} --file supabase/tests/cloud-catalog-api.sql`,
          `npm.cmd exec -- supabase db advisors --linked --project-ref ${ref} --type all --fail-on error`,
        ],
        prohibited: [
          'Remote reset',
          'Unreviewed migration repair',
          'JWT bypass',
          'Automatic frontend publish',
          'Public private buckets',
          'Credentials in CLI arguments or chat',
        ],
      },
      null,
      2,
    ),
  )
} catch {
  console.error(
    'BLOCKED: no valid isolated staging target; read docs/CLOUD_SETUP.md. No remote operation was executed.',
  )
  process.exitCode = 2
}
