import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { readTarget } from './cloud-target.mjs'

export async function stagingCli(args) {
  const target = await readTarget()
  if (target.projectRef !== 'ibxubsegrabpspopdgep')
    throw Error('Staging target mismatch')
  if (!args.includes('projects') && !args.includes(target.projectRef))
    throw Error('Explicit staging ref required')
  return new Promise((done, fail) => {
    const child = execFile(
      resolve('node_modules/@supabase/cli-windows-x64/bin/supabase.exe'),
      args,
      { windowsHide: true, maxBuffer: 4e6, timeout: 60000 },
      (error, stdout) => {
        if (error)
          return fail(
            Error('Staging CLI unavailable; sensitive diagnostics withheld'),
          )
        try {
          done(JSON.parse(stdout.replace(/^\uFEFF/, '')))
        } catch {
          fail(Error('Staging CLI output format unavailable'))
        }
      },
    )
    child.stdin?.end()
  })
}
