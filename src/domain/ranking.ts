import type { Post, Profile, Snapshot } from './models'
export function visiblePost(p: Post, user: Profile | null, s: Snapshot) {
  if (p.state !== 'published') return false
  const author = s.profiles.find((x) => x.id === p.author_id)
  if (author && (author.membership !== 'approved' || author.suspended))
    return false
  if (
    s.blocks.some(
      (b) =>
        (b.user_id === user?.id && b.target_id === p.author_id) ||
        (b.target_id === user?.id && b.user_id === p.author_id),
    )
  )
    return false
  if (p.project_id) {
    const project = s.projects.find((x) => x.id === p.project_id)
    if (
      project?.visibility === 'private' &&
      project.owner_id !== user?.id &&
      !s.project_members.some(
        (m) => m.project_id === project.id && m.user_id === user?.id,
      )
    )
      return false
  }
  if (p.visibility === 'private') return p.author_id === user?.id
  if (p.visibility === 'members')
    return user?.membership === 'approved' && !user.suspended
  return true
}
export function rankPost(
  p: Post,
  interests: string[],
  now: number = Date.now(),
) {
  const matches = p.tags.filter((t) =>
    interests.some((i) => i.toLowerCase() === t.toLowerCase()),
  )
  const freshness =
    2 * Math.exp(-Math.max(0, now - Date.parse(p.created_at)) / (7 * 86400000))
  const quality =
    (p.source_url ? 1 : 0) + (p.methods ? 0.5 : 0) + (p.resolution ? 1.5 : 0)
  return {
    score: p.recommendation_score ?? matches.length * 4 + freshness + quality,
    reason:
      p.recommendation_reason ??
      (matches.length
        ? 'Matches your interests: ' + matches.join(', ')
        : quality
          ? 'Includes methods, sources or a resolution'
          : 'Recent community contribution'),
  }
}
export function ranked(posts: Post[], interests: string[]) {
  const sorted = posts
    .map((p) => ({ p, ...rankPost(p, interests) }))
    .sort((a, b) => b.score - a.score || a.p.id.localeCompare(b.p.id))
  const result: Post[] = []
  while (sorted.length) {
    const index = sorted.findIndex(
      (x) => !result.slice(-2).some((p) => p.author_id === x.p.author_id),
    )
    result.push(sorted.splice(index < 0 ? 0 : index, 1)[0].p)
  }
  return result
}
