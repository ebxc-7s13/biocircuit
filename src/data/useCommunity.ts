import { useCallback, useEffect, useState, useRef } from 'react'
import {
  commentPage,
  discoveryPage,
  detailData,
  searchCommunity,
} from './discovery'
import { emptySnapshot } from '../domain/models'
import type { Snapshot } from '../domain/models'
import {
  demoPersistenceWarning,
  getIdentity,
  getClient,
  isDemo,
  mutate,
  snapshot,
} from './gateway'
export function useCommunity() {
  const [searchResults, setSearchResults] = useState<{
    query: string
    posts: string[]
    profiles: string[]
    projects: string[]
    papers: string[]
  } | null>(null)
  const [searchHasMore, setSearchHasMore] = useState(false)
  const searchCursor = useRef<{
    query: string
    cursor: Record<string, string | null>
  }>({ query: '', cursor: {} })
  const feedCursor = useRef<string | undefined>(undefined)
  const rememberCursor = (s: Snapshot) => {
    const p = s.posts.at(-1)
    feedCursor.current = p ? p.created_at + '|' + p.id : undefined
  }
  const activeDetail = useRef<{ type: 'post' | 'project'; id: string } | null>(
    null,
  )
  // Invalidate all previous-account work synchronously on Auth transitions.
  // Request generations also prevent older loads overtaking newer ones.
  const authEpoch = useRef(0)
  const loadGeneration = useRef(0)
  const [data, setData] = useState<Snapshot>(emptySnapshot)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const load = useCallback(async () => {
    const epoch = authEpoch.current
    const generation = ++loadGeneration.current
    const current = () =>
      epoch === authEpoch.current && generation === loadGeneration.current
    setLoading(true)
    try {
      const [s, id] = await Promise.all([snapshot(), getIdentity()])
      if (!current()) return
      rememberCursor(s)
      setData(s)
      setUserId(id)
      setHasMore(!isDemo && s.posts.length === 30)
      setError('')
    } catch (e) {
      if (current()) setError(e instanceof Error ? e.message : 'Could not load')
    } finally {
      if (current()) setLoading(false)
    }
  }, [])
  useEffect(() => {
    void load()
    let active = true
    let subscription: { unsubscribe: () => void } | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    void getClient()
      .then((client) => {
        if (active)
          subscription = client?.auth.onAuthStateChange((event) => {
            if (event !== 'INITIAL_SESSION' && event !== 'TOKEN_REFRESHED') {
              authEpoch.current++
              loadGeneration.current++
              // Clear private data even if the next network request fails.
              setUserId(null)
              setData(emptySnapshot())
              setSearchResults(null)
              setSearchHasMore(false)
              setHasMore(false)
              setReplyHasMore(false)
              setDiscoveryHasMore({ profiles: true, projects: true })
              setBusy(false)
              setError('')
              setMessage('')
              searchCursor.current = { query: '', cursor: {} }
              feedCursor.current = undefined
              discoveryCursor.current = { profiles: '', projects: '' }
              activeDetail.current = null
              if (timer) clearTimeout(timer)
              timer = setTimeout(() => {
                if (active) void load()
              }, 0)
            }
          }).data.subscription
      })
      .catch(() => {
        /* load reports the failure */
      })
    return () => {
      active = false
      authEpoch.current++
      loadGeneration.current++
      subscription?.unsubscribe()
      if (timer) clearTimeout(timer)
    }
  }, [load])
  const action = async (
    type: string,
    payload: Record<string, unknown>,
    id?: string,
  ) => {
    const epoch = authEpoch.current
    if (!userId) {
      setError(
        'Sign in and submit your academic eligibility application first.',
      )
      return false
    }
    if (busy) return false
    setBusy(true)
    setError('')
    try {
      await mutate(userId, type, payload, id)
      if (epoch !== authEpoch.current) return false
      let s = await snapshot()
      rememberCursor(s)
      if (activeDetail.current) {
        const { type, id } = activeDetail.current
        const extra = await detailData(type, id, new AbortController().signal)
        if (extra) s = mergeExtra(s, extra)
      }
      setData(s)
      setHasMore(!isDemo && s.posts.length === 30)
      setMessage(
        demoPersistenceWarning ||
          (isDemo ? 'Saved in local demo only' : 'Saved'),
      )
      return true
    } catch (e) {
      if (epoch === authEpoch.current)
        setError(e instanceof Error ? e.message : 'Operation failed')
      return false
    } finally {
      if (epoch === authEpoch.current) setBusy(false)
    }
  }
  const enrich = async (
    type: 'post' | 'project',
    id: string,
    signal: AbortSignal,
  ) => {
    const epoch = authEpoch.current
    activeDetail.current = { type, id }
    try {
      const extra = await detailData(type, id, signal)
      if (!extra || signal.aborted || epoch !== authEpoch.current) return
      setReplyHasMore(extra.comments?.length === 50)
      setData((prev) => mergeExtra(prev, extra))
    } catch {
      if (!signal.aborted && epoch === authEpoch.current)
        setError('Could not load detail from server')
    }
  }
  const search = async (query: string, signal: AbortSignal, more = false) => {
    const epoch = authEpoch.current
    if (!more) searchCursor.current = { query, cursor: {} }
    try {
      const extra = await searchCommunity(
        query,
        signal,
        more ? searchCursor.current.cursor : {},
      )
      if (
        !extra ||
        signal.aborted ||
        epoch !== authEpoch.current ||
        searchCursor.current.query !== query
      )
        return
      searchCursor.current = { query, cursor: extra.cursor }
      setSearchResults((previous) => ({
        query,
        posts: [
          ...(more && previous?.query === query ? previous.posts : []),
          ...extra.posts.map((x) => x.id),
        ],
        profiles: [
          ...(more && previous?.query === query ? previous.profiles : []),
          ...extra.profiles.map((x) => x.id),
        ],
        projects: [
          ...(more && previous?.query === query ? previous.projects : []),
          ...extra.projects.map((x) => x.id),
        ],
        papers: [
          ...(more && previous?.query === query ? previous.papers : []),
          ...extra.papers.map((x) => x.id),
        ],
      }))
      setSearchHasMore(Object.values(extra.cursor).some(Boolean))
      setData((prev) => ({
        ...prev,
        papers: [
          ...prev.papers.filter(
            (p) => !extra.papers.some((x) => x.id === p.id),
          ),
          ...extra.papers,
        ],
        posts: [
          ...prev.posts.filter((p) => !extra.posts.some((x) => x.id === p.id)),
          ...extra.posts,
        ],
        profiles: [
          ...prev.profiles.filter(
            (p) => !extra.profiles.some((x) => x.id === p.id),
          ),
          ...extra.profiles,
        ],
        projects: [
          ...prev.projects.filter(
            (p) => !extra.projects.some((x) => x.id === p.id),
          ),
          ...extra.projects,
        ],
      }))
    } catch {
      if (!signal.aborted && epoch === authEpoch.current)
        setError('Server search unavailable. Showing loaded results only.')
    }
  }
  const more = async () => {
    const epoch = authEpoch.current
    if (busy || !data.posts.length) return
    setBusy(true)
    try {
      const s = await snapshot(feedCursor.current)
      if (epoch !== authEpoch.current) return
      rememberCursor(s)
      setData((prev) => ({
        ...s,
        posts: [
          ...prev.posts,
          ...s.posts.filter((p) => !prev.posts.some((q) => q.id === p.id)),
        ],
      }))
      setHasMore(s.posts.length === 30)
    } catch {
      if (epoch === authEpoch.current) setError('Could not load the next page')
    } finally {
      if (epoch === authEpoch.current) setBusy(false)
    }
  }
  const [replyHasMore, setReplyHasMore] = useState(false)
  const [discoveryHasMore, setDiscoveryHasMore] = useState({
    profiles: true,
    projects: true,
  })
  const discoveryCursor = useRef({ profiles: '', projects: '' })
  const replies = async (id: string) => {
    const epoch = authEpoch.current
    if (busy) return
    setBusy(true)
    try {
      const last = data.comments
        .filter((x) => x.post_id === id)
        .sort(
          (a, b) =>
            a.created_at.localeCompare(b.created_at) ||
            a.id.localeCompare(b.id),
        )
        .at(-1)
      const page = await commentPage(id, new AbortController().signal, last)
      if (page && epoch === authEpoch.current) {
        setData((prev) => mergeExtra(prev, page))
        setReplyHasMore(page.comments?.length === 50)
      }
    } catch {
      if (epoch === authEpoch.current) setError('Could not load more replies')
    } finally {
      if (epoch === authEpoch.current) setBusy(false)
    }
  }
  const discover = async (entity: 'profiles' | 'projects') => {
    const epoch = authEpoch.current
    if (busy) return
    setBusy(true)
    try {
      const page = await discoveryPage(
        entity,
        new AbortController().signal,
        discoveryCursor.current[entity] || undefined,
      )
      if (page && epoch === authEpoch.current) {
        const items = page[entity] ?? []
        discoveryCursor.current[entity] =
          items.at(-1)?.id ?? discoveryCursor.current[entity]
        setDiscoveryHasMore((v) => ({ ...v, [entity]: items.length === 50 }))
        setData((prev) => mergeExtra(prev, page))
      }
    } catch {
      if (epoch === authEpoch.current) setError('Could not load discovery page')
    } finally {
      if (epoch === authEpoch.current) setBusy(false)
    }
  }
  const clearDetail = () => {
    activeDetail.current = null
  }
  return {
    data,
    userId,
    user: data.profiles.find((p) => p.id === userId) ?? null,
    loading,
    busy,
    error,
    message,
    hasMore,
    load,
    action,
    more,
    setError,
    setMessage,
    setUserId,
    enrich,
    search,
    clearDetail,
    searchHasMore,
    searchResults,
    replies,
    replyHasMore,
    discover,
    discoveryHasMore,
  }
}
export type Community = ReturnType<typeof useCommunity>

function mergeExtra(s: Snapshot, e: Partial<Snapshot>): Snapshot {
  return {
    ...s,
    ...(e.posts
      ? {
          posts: [
            ...s.posts.filter((p) => !e.posts!.some((x) => x.id === p.id)),
            ...e.posts,
          ],
        }
      : {}),
    ...(e.comments
      ? {
          comments: [
            ...s.comments.filter(
              (p) => !e.comments!.some((x) => x.id === p.id),
            ),
            ...e.comments,
          ],
        }
      : {}),
    ...(e.profiles
      ? {
          profiles: [
            ...s.profiles.filter(
              (p) => !e.profiles!.some((x) => x.id === p.id),
            ),
            ...e.profiles,
          ],
        }
      : {}),
    ...(e.projects
      ? {
          projects: [
            ...s.projects.filter(
              (p) => !e.projects!.some((x) => x.id === p.id),
            ),
            ...e.projects,
          ],
        }
      : {}),
    ...(e.project_members
      ? {
          project_members: [
            ...s.project_members.filter(
              (p) =>
                !e.project_members!.some(
                  (x) =>
                    x.project_id === p.project_id && x.user_id === p.user_id,
                ),
            ),
            ...e.project_members,
          ],
        }
      : {}),
    ...(e.reactions
      ? {
          reactions: [
            ...s.reactions.filter(
              (r) => !e.posts?.some((p) => p.id === r.post_id),
            ),
            ...e.reactions,
          ],
        }
      : {}),
    ...(e.bookmarks
      ? {
          bookmarks: [
            ...s.bookmarks.filter(
              (r) => !e.posts?.some((p) => p.id === r.post_id),
            ),
            ...e.bookmarks,
          ],
        }
      : {}),
    ...(e.helpful
      ? {
          helpful: [
            ...s.helpful.filter(
              (r) => !e.comments?.some((p) => p.id === r.comment_id),
            ),
            ...e.helpful,
          ],
        }
      : {}),
    ...(e.versions ? { versions: e.versions } : {}),
    ...(e.subscriptions ? { subscriptions: e.subscriptions } : {}),
  }
}
