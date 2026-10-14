import type { Paper } from './models.ts'
export interface PubmedRecord {
  uid?: string
  title?: string
  authors?: { name?: string }[]
  fulljournalname?: string
  source?: string
  pubdate?: string
  sortpubdate?: string
  articleids?: { idtype?: string; value?: string }[]
  pubtype?: string[]
  attributes?: string[]
}
export function fromPubmed(w: PubmedRecord, now: string): Paper | null {
  if (!w.uid || !/^\d{1,12}$/.test(w.uid) || !w.title) return null
  const doi =
    (w.articleids ?? [])
      .find((x) => x.idtype === 'doi')
      ?.value?.toLowerCase() ?? ''
  const validDoi = /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : ''
  // Keep only the publication precision actually supplied, without inventing a day.
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const parts = (w.pubdate ?? '').split(' ')
  let published = /^\d{4}$/.test(parts[0]) ? parts[0] : ''
  const month = months.indexOf(parts[1])
  if (published && month >= 0) {
    published += '-' + String(month + 1).padStart(2, '0')
    if (/^\d{1,2}$/.test(parts[2] ?? ''))
      published += '-' + parts[2].padStart(2, '0')
  }
  return {
    id: validDoi || 'pmid:' + w.uid,
    doi: validDoi,
    pmid: w.uid,
    title: w.title.replace(/<[^>]*>/g, '').slice(0, 2000),
    authors: (w.authors ?? [])
      .slice(0, 30)
      .map((x) => x.name ?? '')
      .filter(Boolean),
    venue: (w.fulljournalname ?? w.source ?? '').slice(0, 1000),
    published,
    source: 'PubMed',
    source_url: 'https://pubmed.ncbi.nlm.nih.gov/' + w.uid + '/',
    retrieved_at: now,
    abstract_available: (w.attributes ?? []).includes('Has Abstract'),
    correction: (w.pubtype ?? []).some((x) =>
      /retract|erratum|correction/i.test(x),
    )
      ? 'Source publication type indicates a correction or retraction. Read the canonical record before relying on it.'
      : '',
  }
}
