import { describe, it, expect } from 'vitest'
import { demoAction, demoSeed, demoUserId } from '../src/data/demo'
import {
  postSchema,
  applicationSchema,
  safeUrl,
  normalizeDoi,
  assertUpload,
  phoneSchema,
} from '../src/domain/validation'
import { ranked, visiblePost, rankPost } from '../src/domain/ranking'
import { fromCrossref } from '../src/data/scholarly'
import type { Snapshot } from '../src/domain/models'
const act = (
  s: Snapshot,
  type: string,
  data: Record<string, unknown>,
  user = demoUserId,
  id = crypto.randomUUID(),
) => demoAction(s, user, { type, data, request_id: id })
describe('validation', () => {
  it('allows result-awaiting academic details without marks', () =>
    expect(
      applicationSchema.safeParse({
        institution: 'Synthetic Institute',
        degree: 'PhD',
        discipline: 'Biomedical Engineering',
        result_status: 'awaiting_results',
        year: 2026,
        private_marks: '',
      }).success,
    ).toBe(true))
  it('rejects malformed phone and scientific post inputs', () => {
    expect(phoneSchema.safeParse('123456').success).toBe(false)
    expect(postSchema.safeParse({ title: 'Hi' }).success).toBe(false)
  })
  it('rejects dangerous URLs and embedded credentials', () => {
    for (const x of [
      'javascript:alert(1)',
      'http://example.com',
      'https://user:pass@example.com',
      'data:text/html,x',
    ])
      expect(safeUrl(x)).toBe('')
    expect(safeUrl('https://doi.org/10.1234/a')).toBeTruthy()
  })
  it('normalizes DOI and bibliographic provenance', () => {
    expect(normalizeDoi('https://doi.org/10.1234/ABC')).toBe('10.1234/abc')
    const p = fromCrossref(
      {
        DOI: '10.1234/ABC',
        title: ['Paper title'],
        author: [{ given: 'Synthetic', family: 'Author' }],
        published: { 'date-parts': [[2026, 4, 1]] },
      },
      '2026-10-10T00:00:00Z',
    )
    expect(p?.published).toBe('2026-04-01')
    expect(p?.source).toBe('Crossref')
    expect(p?.retrieved_at).toBe('2026-10-10T00:00:00Z')
    expect(fromCrossref({})).toBe(null)
  })
  it('fails closed on oversized, spoofed and SVG uploads', () => {
    expect(() =>
      assertUpload(new Uint8Array(6 * 1024 * 1024), 'image/png'),
    ).toThrow()
    expect(() =>
      assertUpload(
        new TextEncoder().encode('<svg onload="bad"></svg>'),
        'image/svg+xml',
      ),
    ).toThrow()
    expect(() => assertUpload(new Uint8Array(10), 'application/pdf')).toThrow()
    expect(() =>
      assertUpload(
        new TextEncoder().encode('%PDF-1.7\n%test'),
        'application/pdf',
      ),
    ).toThrow()
    expect(() =>
      assertUpload(
        new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]),
        'image/png',
      ),
    ).not.toThrow()
  })
})
describe('community transitions', () => {
  it('deduplicates repeated publishing request IDs', () => {
    let s = demoSeed()
    const id = crypto.randomUUID()
    const p = { ...s.posts[0], kind: 'discussion' }
    s = act(s, 'post', p, demoUserId, id)
    s = act(s, 'post', p, demoUserId, id)
    expect(s.posts.filter((x) => x.id === id)).toHaveLength(1)
  })
  it('blocks pending and suspended member operations', () => {
    const s = demoSeed()
    s.profiles[0].membership = 'pending'
    expect(() =>
      act(s, 'comment', { post_id: s.posts[0].id, body: 'Useful reply' }),
    ).toThrow()
    s.profiles[0].membership = 'approved'
    s.profiles[0].suspended = true
    expect(() => act(s, 'post', s.posts[0])).toThrow()
  })
  it('prevents self reactions and duplicate bookmarks', () => {
    let s = demoSeed()
    expect(() => act(s, 'reaction', { post_id: s.posts[0].id })).toThrow()
    s = act(s, 'bookmark', { post_id: s.posts[0].id })
    expect(s.bookmarks).toHaveLength(1)
    s = act(s, 'bookmark', { post_id: s.posts[0].id })
    expect(s.bookmarks).toHaveLength(0)
  })
  it('accepts another member answer once and records notification/ledger', () => {
    let s = demoSeed()
    const id = crypto.randomUUID()
    s = act(
      s,
      'comment',
      { post_id: s.posts[0].id, body: 'Use grouped patient-level folds.' },
      s.profiles[1].id,
      id,
    )
    s = act(s, 'accept', { post_id: s.posts[0].id, comment_id: id })
    s = act(s, 'accept', { post_id: s.posts[0].id, comment_id: id })
    expect(s.contributions.filter((x) => x.valid)).toHaveLength(1)
    expect(s.contributions[0].points).toBe(20)
    expect(s.posts[0].accepted_answer_id).toBe(id)
  })
  it('invalidates awarded points when reopening question', () => {
    let s = demoSeed()
    const id = crypto.randomUUID()
    s = act(
      s,
      'comment',
      { post_id: s.posts[0].id, body: 'Grouped folds can prevent leakage.' },
      s.profiles[1].id,
      id,
    )
    s = act(s, 'accept', { post_id: s.posts[0].id, comment_id: id })
    s = act(s, 'resolve', { post_id: s.posts[0].id, resolution: '' })
    expect(s.contributions[0].valid).toBe(false)
  })
  it('requires trusted reviewer role and prevents self-review', () => {
    const s = demoSeed()
    expect(() =>
      act(s, 'review', {
        application_id: crypto.randomUUID(),
        status: 'approved',
        reason: 'Reviewed pathway',
      }),
    ).toThrow()
  })
  it('owner controls collaboration acceptance and private projects', () => {
    let s = demoSeed()
    const project = s.projects[0]
    s = act(s, 'collaborate', {
      project_id: project.id,
      message: 'I can help test the LED driver.',
      expertise: 'Embedded systems',
      availability: 'Weekly',
    })
    expect(s.collaborations).toHaveLength(1)
    const cid = s.collaborations[0].id
    expect(() =>
      act(s, 'decide_collaboration', {
        project_id: project.id,
        collaboration_id: cid,
        accept: true,
      }),
    ).toThrow()
    s = act(
      s,
      'decide_collaboration',
      { project_id: project.id, collaboration_id: cid, accept: true },
      project.owner_id,
    )
    expect(s.project_members.some((m) => m.user_id === demoUserId)).toBe(true)
  })
})
describe('recommendations and exclusions', () => {
  it('interest matches increase score without grades or engagement', () => {
    const s = demoSeed()
    const p = s.posts[0]
    expect(rankPost(p, p.tags).score).toBeGreaterThan(rankPost(p, []).score)
    expect(ranked(s.posts, p.tags)[0]).toBeDefined()
  })
  it('excludes private, held and blocked content before ranking', () => {
    const s = demoSeed()
    const p = s.posts[1]
    p.visibility = 'private'
    expect(visiblePost(p, s.profiles[0], s)).toBe(false)
    p.visibility = 'public'
    s.blocks.push({ user_id: demoUserId, target_id: p.author_id })
    expect(visiblePost(p, s.profiles[0], s)).toBe(false)
    p.state = 'removed'
    expect(visiblePost(p, null, s)).toBe(false)
  })
})
