import type { Snapshot, Comment } from '../domain/models'
import { supabase, isDemo } from './gateway'
export async function searchCommunity(
  query: string,
  signal: AbortSignal,
  cursor: Record<string, string | null> = {},
): Promise<
  | (Pick<Snapshot, 'posts' | 'profiles' | 'projects' | 'papers'> & {
      cursor: Record<string, string | null>
    })
  | null
> {
  if (isDemo || !supabase || query.length < 2) return null
  const { data, error } = await supabase
    .rpc('search_community', {
      search_text: query.slice(0, 200),
      page_cursor: cursor,
    })
    .abortSignal(signal)
  if (error) throw Error('Community search unavailable')
  return data
}
export async function commentPage(
  id: string,
  signal: AbortSignal,
  after?: Comment,
): Promise<Partial<Snapshot> | null> {
  if (isDemo || !supabase) return null
  const { data, error } = await supabase
    .rpc('discussion_page', {
      pid: id,
      after_time: after?.created_at ?? null,
      after_id: after?.id ?? null,
    })
    .abortSignal(signal)
  if (error) throw Error('Discussion replies unavailable')
  return data
}
export async function discoveryPage(
  entity: 'projects' | 'profiles',
  signal: AbortSignal,
  after?: string,
): Promise<Partial<Snapshot> | null> {
  if (isDemo || !supabase) return null
  const { data, error } = await supabase
    .rpc('discovery_page', { entity, after_id: after ?? null })
    .abortSignal(signal)
  if (error) throw Error('Discovery unavailable')
  return data
}
export async function detailData(
  type: 'post' | 'project',
  id: string,
  signal: AbortSignal,
): Promise<Partial<Snapshot> | null> {
  if (isDemo || !supabase || !/^[0-9a-f-]{36}$/i.test(id)) return null
  const result: Partial<Snapshot> = {}
  if (type === 'post') {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .abortSignal(signal)
    if (error) throw Error('Discussion unavailable')
    result.posts = data ?? []
    if (data?.[0]) {
      const [page, author] = await Promise.all([
        commentPage(id, signal),
        supabase
          .from('profiles')
          .select('*')
          .eq('id', data[0].author_id)
          .abortSignal(signal),
      ])
      if (author.error) throw Error('Discussion author unavailable')
      result.comments = page?.comments ?? []
      result.profiles = [...(page?.profiles ?? []), ...(author.data ?? [])]
      const session = await supabase.auth.getSession()
      if (session.data.session) {
        const [extras, interactions] = await Promise.all([
          supabase.rpc('detail_extras', { pid: id }).abortSignal(signal),
          supabase
            .rpc('discussion_interactions', { pid: id })
            .abortSignal(signal),
        ])
        if (extras.error || interactions.error)
          throw Error('Discussion interactions unavailable')
        Object.assign(result, extras.data, {
          reactions: interactions.data.reactions,
          bookmarks: interactions.data.bookmarks,
          helpful: interactions.data.helpful,
        })
        result.posts = result.posts!.map((p) => ({
          ...p,
          ...interactions.data.counts,
        }))
      }
    }
  } else {
    const [project, members, logs] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).abortSignal(signal),
      supabase
        .from('project_members')
        .select('*')
        .eq('project_id', id)
        .limit(100)
        .abortSignal(signal),
      supabase
        .from('posts')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false })
        .limit(100)
        .abortSignal(signal),
    ])
    if (project.error || members.error || logs.error)
      throw Error('Project unavailable')
    result.projects = project.data ?? []
    result.project_members = members.data ?? []
    result.posts = logs.data ?? []
  }
  return result
}
