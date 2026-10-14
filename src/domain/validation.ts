import { z } from 'zod'
export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address')
  .max(254)
export const registrationPasswordSchema = z
  .string()
  .min(12, 'Use at least 12 characters for a unique password')
  .max(128, 'Use at most 128 characters')
export const loginPasswordSchema = z
  .string()
  .min(1, 'Enter your password')
  .max(128, 'Use at most 128 characters')
export const safeUrl = (value: string) => {
  if (!value) return ''
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''
  } catch {
    return ''
  }
}
export const normalizeDoi = (value: string) =>
  value
    .trim()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase()
export const doiValid = (value: string) =>
  /^10\.\d{4,9}\/\S+$/i.test(normalizeDoi(value))
const text = (min: number, max: number) => z.string().trim().min(min).max(max)
const url = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || !!safeUrl(v),
    'Use an HTTPS URL without embedded credentials',
  )
export const postSchema = z
  .object({
    log_type: z
      .enum(['note', 'milestone', 'blocker', 'experiment', 'lesson'])
      .default('note'),
    kind: z.enum([
      'discussion',
      'question',
      'project_update',
      'paper_discussion',
      'resource',
    ]),
    title: text(8, 180),
    body: text(20, 10000),
    tags: z.array(text(1, 60)).min(1).max(8),
    visibility: z.enum(['public', 'members', 'private']),
    source_url: url,
    methods: z.string().max(3000),
    tried: z.string().max(3000),
    project_id: z.string().uuid().nullable(),
    paper_id: z.string().max(250).nullable(),
  })
  .refine(
    (v) => v.kind !== 'project_update' || !!v.project_id,
    'Choose a project for this log',
  )
  .refine(
    (v) => v.kind !== 'paper_discussion' || !!v.paper_id || !!v.source_url,
    'Add a paper or canonical source URL',
  )
export const applicationSchema = z.object({
  institution: text(2, 160),
  degree: z.enum([
    'B.Tech / BE',
    'M.Tech / ME / MS',
    'PhD',
    'Equivalent / combined',
  ]),
  discipline: text(3, 200),
  result_status: z.enum([
    'currently_enrolled',
    'completed',
    'awaiting_results',
  ]),
  year: z
    .number()
    .int()
    .min(1950)
    .max(new Date().getFullYear() + 10),
  private_marks: z.string().max(40),
})
export const profileSchema = z.object({
  name: text(2, 100),
  handle: text(3, 32).regex(/^[a-z0-9_]+$/),
  institution: z.string().max(160),
  degree: z.string().max(100),
  bio: z.string().max(1200),
  methods: z.string().max(1000),
  equipment: z.string().max(1000),
  interests: z.array(text(1, 60)).max(20),
  available: z.boolean(),
  visibility: z.enum(['public', 'members', 'private']),
})
export const projectSchema = z.object({
  title: text(8, 180),
  problem: text(20, 6000),
  stage: text(2, 80),
  methods: z.string().max(3000),
  equipment: z.string().max(1000),
  needs: z.string().max(1000),
  tags: z.array(text(1, 60)).min(1).max(8),
  visibility: z.enum(['public', 'private']),
  source_url: url,
  license: z.string().max(200),
  governance: text(5, 1000),
})
export const phoneSchema = z
  .string()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    'Use international format, e.g. + country code and number',
  )
export const tagsFrom = (value: string) =>
  [
    ...new Set(
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ].slice(0, 8)
export function assertUpload(bytes: Uint8Array, mime: string) {
  if (bytes.length > 5 * 1024 * 1024 || bytes.length < 8)
    throw Error('File must be between 8 bytes and 5 MB')
  const png = bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
  const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  // Documents are never accepted: evidence ingestion and malware scanning do not exist.
  if (!((mime === 'image/png' && png) || (mime === 'image/jpeg' && jpg)))
    throw Error('Unsupported or mismatched file content')
}
