import { loadEnv } from 'vite'
import { readTarget, assertPublicKey } from './cloud-target.mjs'

// Read-only: is the GitHub provider enabled, and does hosted Auth hand each app
// callback to GitHub with the project's own OAuth callback? Starts the
// authorize redirect only; never completes a GitHub login. Current Auth keeps
// the flow state server-side (opaque `state`), so whether a return address is
// allowlisted is only observable after a real login; see the live sign-in check.
const target = await readTarget()
const env = loadEnv('development', process.cwd(), '')
assertPublicKey(env.VITE_SUPABASE_PUBLISHABLE_KEY)
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
const settings = await (
  await fetch(target.url + '/auth/v1/settings', { headers: { apikey: key } })
).json()
const report = {
  githubEnabled: !!settings.external?.github,
  allowlist: 'verified only by a completed sign-in',
  callbacks: [],
}
for (const callback of [
  'https://ebxc-7s13.github.io/biocircuit/auth/callback',
  target.frontendOrigin + '/auth/callback',
]) {
  const r = await fetch(
    `${target.url}/auth/v1/authorize?provider=github&redirect_to=${encodeURIComponent(callback)}`,
    { headers: { apikey: key }, redirect: 'manual' },
  )
  let toGithub = false
  let providerCallback = false
  try {
    const u = new URL(r.headers.get('location') ?? '')
    toGithub = u.hostname === 'github.com'
    providerCallback =
      u.searchParams.get('redirect_uri') === target.url + '/auth/v1/callback'
  } catch {
    /* not configured */
  }
  report.callbacks.push({
    callback,
    status: r.status,
    toGithub,
    providerCallback,
  })
}
console.log(JSON.stringify(report, null, 1))
if (
  !report.githubEnabled ||
  report.callbacks.some((c) => !c.toGithub || !c.providerCallback)
)
  process.exitCode = 1
