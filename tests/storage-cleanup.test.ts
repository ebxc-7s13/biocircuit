// @vitest-environment node
import { it, expect, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
// @ts-expect-error Node-only operational JavaScript module.
import { cleanupStorageBatch } from '../scripts/cleanup-storage.mjs'
const item = (bucket = 'avatars') => ({
  id: randomUUID(),
  bucket,
  path:
    randomUUID() +
    '/' +
    randomUUID() +
    (bucket === 'avatars' ? '.webp' : '.png'),
})
function fixture(
  data: unknown,
  removalError = false,
  acknowledgementError = false,
) {
  const remove = vi.fn(async () => ({ error: removalError ? {} : null }))
  const rpc = vi.fn(async (name: string) =>
    name === 'storage_cleanup_batch'
      ? { data, error: null }
      : { error: acknowledgementError ? {} : null },
  )
  return { rpc, storage: { from: vi.fn(() => ({ remove })) }, remove }
}
it('dry run validates and counts without removing or acknowledging', async () => {
  const client = fixture([item(), item('project-files')])
  expect(await cleanupStorageBatch(client, { dryRun: true })).toEqual({
    queued: 2,
    acknowledged: 0,
    dryRun: true,
  })
  expect(client.remove).not.toHaveBeenCalled()
  expect(client.rpc).toHaveBeenCalledTimes(1)
})
it('rejects the entire batch before removing a valid first object when a later path is unsafe', async () => {
  for (const bad of [
    { ...item(), path: '../private' },
    { ...item(), bucket: 'evidence' },
    { ...item(), path: randomUUID() + '/nested/' + randomUUID() + '.webp' },
    { ...item(), path: randomUUID() + '/' + randomUUID() + '.png' },
  ]) {
    const client = fixture([item(), bad])
    await expect(cleanupStorageBatch(client)).rejects.toThrow('validation')
    expect(client.remove).not.toHaveBeenCalled()
    expect(client.rpc).toHaveBeenCalledTimes(1)
  }
})
it('rejects malformed, oversized and duplicate queues', async () => {
  const duplicate = item()
  for (const data of [
    null,
    {},
    Array.from({ length: 101 }, () => item()),
    [duplicate, duplicate],
  ]) {
    const client = fixture(data)
    await expect(cleanupStorageBatch(client)).rejects.toThrow('validation')
    expect(client.remove).not.toHaveBeenCalled()
  }
})
it('removal failure never acknowledges the queue', async () => {
  const client = fixture([item()], true)
  await expect(cleanupStorageBatch(client)).rejects.toThrow('retained')
  expect(client.rpc).toHaveBeenCalledTimes(1)
})
it('acknowledgement failure can retry already absent objects', async () => {
  const queued = [item()]
  const client = fixture(queued, false, true)
  await expect(cleanupStorageBatch(client)).rejects.toThrow('retry is safe')
  client.rpc.mockImplementation(async (name: string) =>
    name === 'storage_cleanup_batch'
      ? { data: queued, error: null }
      : { error: null },
  )
  expect((await cleanupStorageBatch(client)).acknowledged).toBe(1)
  expect(client.remove).toHaveBeenCalledTimes(2)
})
it('only acknowledges each successfully removed bucket and exact queue IDs', async () => {
  const a = item(),
    p = item('project-files')
  const client = fixture([a, p])
  expect((await cleanupStorageBatch(client)).acknowledged).toBe(2)
  expect(client.rpc).toHaveBeenCalledWith('storage_cleanup_ack', {
    ids: [a.id],
  })
  expect(client.rpc).toHaveBeenCalledWith('storage_cleanup_ack', {
    ids: [p.id],
  })
  expect(client.storage.from.mock.calls).toEqual([
    ['avatars'],
    ['project-files'],
  ])
})
