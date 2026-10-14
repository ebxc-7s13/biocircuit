import type { Paper } from '../domain/models'
import { normalizeDoi, safeUrl } from '../domain/validation'
import { supabase } from './gateway'
export interface CrossrefWork {
  DOI?: string
  title?: string[]
  author?: { given?: string; family?: string }[]
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  'is-referenced-by-count'?: number
  relation?: Record<string, unknown>
}
export function fromCrossref(
  w: CrossrefWork,
  now = new Date().toISOString(),
): Paper | null {
  const doi = normalizeDoi(w.DOI ?? '')
  if (!doi || !w.title?.[0]) return null
  const date = w.published?.['date-parts']?.[0]
  return {
    id: doi,
    doi,
    pmid: '',
    title: w.title[0],
    authors:
      w.author
        ?.slice(0, 30)
        .map((a) => [a.given, a.family].filter(Boolean).join(' ')) ?? [],
    venue: w['container-title']?.[0] ?? '',
    published: date
      ? date
          .map((x, i) => (i ? String(x).padStart(2, '0') : String(x)))
          .join('-')
      : '',
    source: 'Crossref',
    source_url: safeUrl('https://doi.org/' + doi),
    retrieved_at: now,
    abstract_available: false,
    correction:
      w.relation && Object.keys(w.relation).length
        ? 'Related records exist; check the original source for corrections.'
        : '',
  }
}
export async function searchPapers(
  query: string,
  cursor: string,
  signal: AbortSignal,
  year?: string,
  provider = 'Crossref',
): Promise<{ papers: Paper[]; cursor: string }> {
  if (!supabase)
    throw Error(
      'Scholarly search requires a configured backend proxy. Demo mode contains no invented live paper records.',
    )
  const { data, error } = await supabase.functions.invoke('scholarly-search', {
    body: { query, cursor, year: year ? Number(year) : null, provider },
    signal,
  })
  if (error) throw Error('Scholarly provider unavailable. Please retry later.')
  return data
}
