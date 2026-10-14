import { loadEnv } from 'vite'
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env }
const publicNames = new Set([
  'VITE_APP_MODE',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_HCAPTCHA_SITE_KEY',
])
if (
  Object.keys(env).some(
    (name) => name.startsWith('VITE_') && !publicNames.has(name),
  )
) {
  console.error('Build refused: unreviewed public environment variable.')
  process.exit(1)
}
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''
let forbidden = key.startsWith('sb_secret_')
if (key.startsWith('eyJ')) {
  try {
    const payload = JSON.parse(
      Buffer.from(key.split('.')[1], 'base64url').toString(),
    )
    forbidden ||= payload.role === 'service_role'
  } catch {
    /* malformed public config rejected by backend */
  }
}
if (
  forbidden ||
  Object.keys(env).some((k) =>
    /^VITE_.*(SERVICE_ROLE|PRIVATE_KEY|DATABASE_PASSWORD|SMS_SECRET|ADMIN_TOKEN)/.test(
      k,
    ),
  )
) {
  console.error(
    'Build refused: privileged configuration must never use VITE_ variables.',
  )
  process.exit(1)
}
if (env.VITE_APP_MODE && !['demo', 'connected'].includes(env.VITE_APP_MODE)) {
  console.error('Build refused: VITE_APP_MODE must be demo or connected.')
  process.exit(1)
}
console.log(
  'Public configuration secret boundary checked. Production defaults to connected mode.',
)
