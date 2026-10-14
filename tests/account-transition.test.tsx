import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useCommunity } from '../src/data/useCommunity'
import { emptySnapshot } from '../src/domain/models'
import { demoSeed } from '../src/data/demo'
const m = vi.hoisted(() => ({
  snapshot: vi.fn(),
  getIdentity: vi.fn(),
  mutate: vi.fn(),
  detailData: vi.fn(),
  searchCommunity: vi.fn(),
  discoveryPage: vi.fn(),
  commentPage: vi.fn(),
  listener: undefined as ((event: string) => void) | undefined,
}))
vi.mock('../src/data/gateway', () => ({
  isDemo: false,
  demoPersistenceWarning: '',
  snapshot: m.snapshot,
  getIdentity: m.getIdentity,
  mutate: m.mutate,
  getClient: async () => ({
    auth: {
      onAuthStateChange: (listener: (event: string) => void) => {
        m.listener = listener
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
    },
  }),
}))
vi.mock('../src/data/discovery', () => ({
  detailData: m.detailData,
  searchCommunity: m.searchCommunity,
  discoveryPage: m.discoveryPage,
  commentPage: m.commentPage,
}))
const fixture = (id: string) => ({
  ...emptySnapshot(),
  profiles: [
    { ...demoSeed().profiles[0], id, name: 'Private unit fixture ' + id },
  ],
})
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
afterEach(cleanup)
beforeEach(() => {
  for (const fn of [
    m.snapshot,
    m.getIdentity,
    m.mutate,
    m.detailData,
    m.searchCommunity,
    m.discoveryPage,
    m.commentPage,
  ])
    fn.mockReset()
  m.listener = undefined
  m.snapshot.mockResolvedValue(fixture('fixture-a'))
  m.getIdentity.mockResolvedValue('fixture-a')
})
const initial = async () => {
  const hook = renderHook(() => useCommunity())
  await waitFor(() => expect(hook.result.current.userId).toBe('fixture-a'))
  await waitFor(() => expect(m.listener).toBeTypeOf('function'))
  return hook
}
const switchToB = async (
  hook: ReturnType<typeof renderHook<ReturnType<typeof useCommunity>, unknown>>,
) => {
  m.snapshot.mockResolvedValue(fixture('fixture-b'))
  m.getIdentity.mockResolvedValue('fixture-b')
  act(() => m.listener?.('SIGNED_IN'))
  await waitFor(() => expect(hook.result.current.userId).toBe('fixture-b'))
}
it('late initial snapshot cannot restore a previous account after managed identity changes', async () => {
  const old = deferred<ReturnType<typeof fixture>>()
  m.snapshot.mockReturnValueOnce(old.promise)
  const hook = renderHook(() => useCommunity())
  await waitFor(() => expect(m.listener).toBeTypeOf('function'))
  await switchToB(hook)
  await act(async () => {
    old.resolve(fixture('fixture-a'))
    await old.promise
  })
  expect(hook.result.current.userId).toBe('fixture-b')
  expect(hook.result.current.data.profiles.map((p) => p.id)).toEqual([
    'fixture-b',
  ])
})
it('signout clears private state immediately even when the anonymous reload fails', async () => {
  const hook = await initial()
  m.snapshot.mockRejectedValue(Error('Unavailable'))
  m.getIdentity.mockResolvedValue(null)
  act(() => m.listener?.('SIGNED_OUT'))
  expect(hook.result.current.userId).toBeNull()
  expect(hook.result.current.data.profiles).toEqual([])
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  expect(hook.result.current.data.profiles).toEqual([])
})
it('late detail and discovery pages cannot merge previous-account rows', async () => {
  const hook = await initial(),
    detail = deferred<{ profiles: ReturnType<typeof fixture>['profiles'] }>(),
    discovery = deferred<{ profiles: ReturnType<typeof fixture>['profiles'] }>()
  m.detailData.mockReturnValue(detail.promise)
  m.discoveryPage.mockReturnValue(discovery.promise)
  let detailTask!: Promise<void>, discoveryTask!: Promise<void>
  act(() => {
    detailTask = hook.result.current.enrich(
      'project',
      'fixture-project',
      new AbortController().signal,
    )
    discoveryTask = hook.result.current.discover('profiles')
  })
  await switchToB(hook)
  await act(async () => {
    detail.resolve({ profiles: fixture('fixture-a').profiles })
    discovery.resolve({ profiles: fixture('fixture-a').profiles })
    await Promise.all([detailTask, discoveryTask])
  })
  expect(hook.result.current.data.profiles.map((p) => p.id)).toEqual([
    'fixture-b',
  ])
  expect(hook.result.current.busy).toBe(false)
})
it('late same-query search results cannot leak rows into a new account', async () => {
  const hook = await initial(),
    old = deferred<{
      profiles: ReturnType<typeof fixture>['profiles']
      posts: []
      projects: []
      papers: []
      cursor: Record<string, string | null>
    }>()
  m.searchCommunity.mockReturnValueOnce(old.promise).mockResolvedValue({
    profiles: [],
    posts: [],
    projects: [],
    papers: [],
    cursor: {},
  })
  let pending!: Promise<void>
  act(() => {
    pending = hook.result.current.search(
      'same-topic',
      new AbortController().signal,
    )
  })
  await switchToB(hook)
  await act(async () => {
    await hook.result.current.search('same-topic', new AbortController().signal)
  })
  await act(async () => {
    old.resolve({
      profiles: fixture('fixture-a').profiles,
      posts: [],
      projects: [],
      papers: [],
      cursor: {},
    })
    await pending
  })
  expect(hook.result.current.data.profiles.map((p) => p.id)).toEqual([
    'fixture-b',
  ])
  expect(hook.result.current.searchResults?.profiles).toEqual([])
})
it('previous-account mutation completion cannot replace current data or announce success', async () => {
  const hook = await initial(),
    old = deferred<void>()
  m.mutate.mockReturnValue(old.promise)
  let pending!: Promise<boolean>
  act(() => {
    pending = hook.result.current.action('profile', {})
  })
  await switchToB(hook)
  let accepted: boolean | undefined
  await act(async () => {
    old.resolve()
    accepted = await pending
  })
  expect(accepted).toBe(false)
  expect(hook.result.current.message).toBe('')
  expect(hook.result.current.busy).toBe(false)
  expect(hook.result.current.data.profiles.map((p) => p.id)).toEqual([
    'fixture-b',
  ])
})
