import type { SupabaseClient } from '@supabase/supabase-js'
import { emptySnapshot } from '../domain/models'
import type { Action, Snapshot } from '../domain/models'
import { demoAction, demoSeed, demoUserId } from './demo'
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
// Development is labelled demo by default. Production is connected unless demo is explicitly requested.
export const isDemo =
  import.meta.env.VITE_APP_MODE === 'demo' ||
  (import.meta.env.DEV && import.meta.env.VITE_APP_MODE !== 'connected')
export const configured = (() => {
  try {
    if (!url || !key || key.startsWith('YOUR_') || key.startsWith('sb_secret_'))
      return false
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      !u.search &&
      !u.hash &&
      u.pathname === '/' &&
      !u.hostname.startsWith('YOUR_')
    )
  } catch {
    return false
  }
})()
export let supabase: SupabaseClient | null = null
let connection: Promise<SupabaseClient | null> | null = null
export async function getClient() {
  if (isDemo || !configured) return null
  connection ??= import('@supabase/supabase-js')
    .then(({ createClient }) => {
      supabase = createClient(url!, key!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
      return supabase
    })
    .catch(() => {
      connection = null
      throw Error('Backend client could not be loaded. Please retry.')
    })
  return connection
}
const demoKey = 'biocircuit-demo-v2'
function loadDemo() {
  try {
    const value = localStorage.getItem(demoKey)
    if (value) {
      const v = JSON.parse(value) as Snapshot
      if (
        Array.isArray(v.posts) &&
        Array.isArray(v.profiles) &&
        Array.isArray(v.roles)
      )
        return { ...emptySnapshot(), ...v }
    }
  } catch {
    /* Recover only isolated demo state. */
  }
  return demoSeed()
}
let demo: Snapshot | null = null
export let demoPersistenceWarning = ''
function persistDemo(s: Snapshot) {
  demo = s
  try {
    localStorage.setItem(demoKey, JSON.stringify(s))
    demoPersistenceWarning = ''
  } catch {
    demoPersistenceWarning =
      'Local storage unavailable; demo changes persist only in this tab.'
  }
}
export async function getIdentity() {
  if (isDemo) return demoUserId
  await getClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user?.id ?? null
}
export async function snapshot(before?: string): Promise<Snapshot> {
  if (isDemo) {
    demo ??= loadDemo()
    return structuredClone(demo)
  }
  await getClient()
  if (!supabase)
    throw Error(
      'Connected mode requires Supabase public configuration. See setup documentation.',
    )
  const session = await supabase.auth.getSession()
  const { data, error } = session.data.session
    ? await supabase.rpc('community_snapshot', {
        before_cursor: before ?? null,
      })
    : await supabase.rpc('public_snapshot', { before_cursor: before ?? null })
  if (error)
    throw Error(
      'Community data could not be loaded. Check connection and database setup.',
    )
  const cursorParts = before?.split('|')
  // Preference-based ranking reads member-only data. Guests use the public
  // snapshot; do not issue a guaranteed-denied private preference query.
  const recommendations = session.data.session
    ? await supabase.rpc('recommended_page', {
        before_time: cursorParts?.[0] ?? null,
        before_id: cursorParts?.[1] ?? null,
      })
    : { data: null }
  if (Array.isArray(recommendations.data))
    data.posts = (data.posts as Snapshot['posts']).map((p) => {
      const r = (
        recommendations.data as {
          post: { id: string }
          score: number
          reason: string
        }[]
      ).find((r) => r.post.id === p.id)
      return r
        ? {
            ...p,
            recommendation_score: r.score,
            recommendation_reason: r.reason,
          }
        : p
    })
  const meta = session.data.session
    ? await supabase.rpc('trust_metadata')
    : { data: null }
  return {
    ...emptySnapshot(),
    ...(data as Snapshot),
    ...meta.data,
    milestones: session.data.session
      ? ((await supabase.from('milestone_confirmations').select('*').limit(100))
          .data ?? [])
      : [],
  }
}
export async function mutate(
  userId: string,
  type: string,
  data: Record<string, unknown>,
  requestId: string = crypto.randomUUID(),
) {
  const action: Action = { type, data, request_id: requestId }
  if (isDemo) {
    demo ??= loadDemo()
    persistDemo(demoAction(demo, userId, action))
    return
  }
  await getClient()
  if (!supabase) throw Error('Backend is not configured')
  if (type === 'notification_preferences') {
    const { error } = await supabase.rpc('notification_preferences', {
      selected_categories: data.categories,
    })
    if (error) throw Error('Notification preferences unavailable')
    return
  }
  if (type === 'confirm_milestone') {
    const { error } = await supabase.rpc('confirm_milestone', {
      pid: data.post_id,
    })
    if (error)
      throw Error(
        'Only another active project collaborator can confirm this milestone',
      )
    return
  }
  const { error } = await supabase.rpc(
    [
      'subscribe',
      'edit_comment',
      'delete_project',
      'taxonomy',
      'point_rule',
      'unsave_paper',
      'paper_report',
      'review_paper_report',
      'appeal_content',
      'resolve_content_appeal',
    ].includes(type)
      ? 'trust_action'
      : 'community_action',
    { action_type: type, payload: data, request_id: requestId },
  )
  if (error)
    throw Error(
      error.code === '42501'
        ? 'You do not have permission for this operation.'
        : error.code === 'P0001'
          ? 'Operation refused. Check membership, limits and submitted fields.'
          : 'Operation failed. Your changes were not confirmed. Please retry.',
    )
}
export async function signOut() {
  if (supabase) {
    const { error } = await supabase.auth.signOut()
    if (error) throw Error('Sign out failed')
  }
}
export function resetDemo() {
  persistDemo(demoSeed())
}
export function switchDemoIdentity(id: string) {
  if (!isDemo) throw Error('Demo identity unavailable')
  return id
}
