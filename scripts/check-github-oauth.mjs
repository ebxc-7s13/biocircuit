import { loadEnv } from 'vite'
import { readTarget, assertPublicKey } from './cloud-target.mjs'

// Read-only: is the GitHub provider enabled, and will hosted Auth send users
// back to each app callback (allowlisted) rather than falling back to site_url?
// Starts the authorize redirect only; never completes a GitHub login.
const target = await readTarget()
const env = loadEnv('development', process.cwd(), '')
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
const settings = await (
  await fetch(target.url + '/auth/v1/settings', { headers: { apikey: key } })
).json()
const report = { githubEnabled: !!settings.external?.github, callbacks: [] }
for (const callback of [
  'https://ebxc-7s13.github.io/biocircuit/auth/callback',
  target.frontendOrigin + '/auth/callback',
]) {
  const r = await fetch(
    `${target.url}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(callback)}`,
    { headers: { apikey: key }, redirect: 'manual' },
  )
  const location = r.headers.get('location') ?? ''
  let toGithub = false
  let allowlisted = false
  try {
    const u = new URL(location)
    toGithub = u.hostname === 'github.com'
    // Auth's signed state carries the validated return address (`referrer`).
    const state = u.searchParams.get('state') ?? ''
    const payload = JSON.parse(
      Buffer.from(state.split('.')[1] ?? '', 'base64url').toString(),
    )
    allowlisted = payload.referrer === callback
  } catch {
    /* not configured */
  }
  report.callbacks.push({ callback, status: r.status, toGithub, allowlisted })
}
console.log(JSON.stringify(report, null, 1))
if (!report.githubEnabled || report.callbacks.some((c) => !c.allowlisted))
  process.exitCode = 1
