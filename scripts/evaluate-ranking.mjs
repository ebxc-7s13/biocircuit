import { ranked, visiblePost } from '../src/domain/ranking.ts'
import { emptySnapshot } from '../src/domain/models.ts'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
const s = emptySnapshot()
const uid = (n) => '00000000-0000-4000-8000-' + String(n).padStart(12, '0')
s.profiles = Array.from({ length: 10 }, (_, n) => ({
  id: uid(n + 1),
  name: 'Synthetic researcher ' + n,
  handle: 'fixture_' + n,
  institution: 'Synthetic Institute',
  degree: 'Biomedical Engineering',
  bio: '',
  interests: ['Biosignal processing'],
  methods: '',
  equipment: '',
  available: true,
  visibility: 'public',
  membership: 'approved',
  suspended: false,
  phone_verified: false,
}))
s.blocks = [{ user_id: s.profiles[0].id, target_id: s.profiles[9].id }]
s.posts = Array.from({ length: 1000 }, (_, n) => ({
  id: uid(100 + n),
  author_id: s.profiles[n % 10].id,
  kind: 'question',
  title: 'Synthetic ranking fixture ' + n,
  body: 'A synthetic research-method question, not scientific evidence.',
  tags: [n % 4 === 0 ? 'Biosignal processing' : 'Biomaterials'],
  created_at: '2026-10-10T08:00:00Z',
  visibility: n % 11 === 0 ? 'private' : 'public',
  state: n % 20 === 0 ? 'removed' : 'published',
  project_id: null,
  paper_id: null,
  source_url: '',
  methods: '',
  tried: '',
  resolution: '',
  accepted_answer_id: null,
}))
const visible = s.posts.filter((p) => visiblePost(p, s.profiles[0], s))
const timings = []
let result
for (let n = 0; n < 20; n++) {
  const start = performance.now()
  result = ranked(visible, s.profiles[0].interests)
  timings.push(performance.now() - start)
}
const precision =
  result.slice(0, 10).filter((p) => p.tags.includes('Biosignal processing'))
    .length / 10
assert.equal(precision, 1)
assert.ok(result.every((p) => visiblePost(p, s.profiles[0], s)))
timings.sort((a, b) => a - b)
console.log(
  JSON.stringify(
    {
      fixture:
        '1000 synthetic candidates, controlled topical labels, 20 Node runs; not human relevance or network latency',
      candidateCount: s.posts.length,
      eligibleCount: visible.length,
      precisionAt10: precision,
      medianMs: Number(timings[10].toFixed(3)),
      p95Ms: Number(timings[19].toFixed(3)),
    },
    null,
    2,
  ),
)
