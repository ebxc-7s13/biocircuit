import { mkdir, writeFile } from 'node:fs/promises'

// User-confirmed reference from docs/specs/BIOCIRCUIT_STAGING_EXECUTION_PROMPT.md.
// These anonymous requests cannot establish the actual project name, RLS or deployment.
const projectRef = 'ibxubsegrabpspopdgep'
const endpoint = `https://${projectRef}.supabase.co`
const results = []
for (const [label, path, method] of [
  ['Managed Auth health ingress', '/auth/v1/health', 'GET'],
  ['Data API ingress', '/rest/v1/', 'GET'],
  ['Private Storage ingress', '/storage/v1/bucket', 'GET'],
  ...['scholarly-search', 'account-delete', 'avatar', 'project-images'].map(
    (name) => [`Edge ingress: ${name}`, `/functions/v1/${name}`, 'POST'],
  ),
]) {
  try {
    const response = await fetch(endpoint + path, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      body: method === 'POST' ? '{}' : undefined,
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    // Drain without logging bodies, headers, tokens or project content.
    await response.arrayBuffer()
    results.push({ label, status: response.status, observed: true })
  } catch {
    results.push({
      label,
      observed: false,
      diagnostic: 'Transport unavailable; raw error withheld',
    })
  }
}
const report = {
  projectRef,
  scope:
    'Anonymous hosted platform ingress only; no API key or JWT supplied. Not project identity, hosted RLS, Auth/OTP, Storage permissions or deployed-handler acceptance.',
  results,
}
await mkdir('docs/verification/cloud', { recursive: true })
await writeFile(
  'docs/verification/cloud/staging-ingress.json',
  JSON.stringify(report, null, 2) + '\n',
)
console.log(JSON.stringify(report, null, 2))
if (results.some((r) => !r.observed)) process.exitCode = 2
