import { createClient } from '@supabase/supabase-js'
import { pathToFileURL } from 'node:url'
const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const idPattern = new RegExp('^' + uuid + '$')
const objectPattern = new RegExp('^' + uuid + '/' + uuid + '\\.(webp|png)$')

export async function cleanupStorageBatch(client, { dryRun = false } = {}) {
  const batch = await client.rpc('storage_cleanup_batch')
  if (batch.error) throw Error('Cleanup queue unavailable')
  const items = batch.data
  if (!Array.isArray(items) || items.length > 100)
    throw Error('Cleanup queue validation failed')
  const ids = new Set(),
    objects = new Set()
  // Validate the entire bounded service queue before any irreversible removal.
  for (const item of items) {
    if (
      !item ||
      !idPattern.test(item.id) ||
      !objectPattern.test(item.path) ||
      !['avatars', 'project-files'].includes(item.bucket) ||
      (item.bucket === 'avatars'
        ? !item.path.endsWith('.webp')
        : !item.path.endsWith('.png')) ||
      ids.has(item.id) ||
      objects.has(item.bucket + '/' + item.path)
    )
      throw Error('Cleanup queue validation failed')
    ids.add(item.id)
    objects.add(item.bucket + '/' + item.path)
  }
  if (dryRun) return { queued: items.length, acknowledged: 0, dryRun: true }
  let acknowledged = 0
  for (const bucket of ['avatars', 'project-files']) {
    const selected = items.filter((x) => x.bucket === bucket)
    if (!selected.length) continue
    const result = await client.storage
      .from(bucket)
      .remove(selected.map((x) => x.path))
    if (result.error)
      throw Error('Storage cleanup refused; queue retained for retry')
    const ack = await client.rpc('storage_cleanup_ack', {
      ids: selected.map((x) => x.id),
    })
    if (ack.error) throw Error('Cleanup acknowledgement failed; retry is safe')
    acknowledged += selected.length
  }
  return { queued: items.length, acknowledged, dryRun: false }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    if (process.argv.slice(2).some((x) => x !== '--dry-run'))
      throw Error('Unsupported cleanup option')
    const url = process.env.SUPABASE_URL,
      key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key)
      throw Error('Server-only Supabase configuration is required for cleanup')
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, init) =>
          fetch(url, { ...init, signal: AbortSignal.timeout(15000) }),
      },
    })
    console.log(
      JSON.stringify(
        await cleanupStorageBatch(client, {
          dryRun: process.argv.includes('--dry-run'),
        }),
      ),
    )
  } catch {
    console.error(
      'Cleanup not completed; queue retained. Inspect configuration and retry safely.',
    )
    process.exitCode = 1
  }
}
