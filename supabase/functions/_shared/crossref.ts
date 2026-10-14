type CrossrefWork = {
  DOI?: string
  title?: string[]
  author?: { given?: string; family?: string }[]
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  relation?: Record<string, unknown>
}
export async function crossrefSearch(
  query: string,
  cursor: string,
  year: number | null,
  contact: string,
  reserve: () => Promise<void>,
) {
  await reserve()
  const doi = query
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase()
  const exactDoi = /^10\.\d{4,9}\/\S+$/.test(doi)
  const url = new URL(
    'https://api.crossref.org/works' +
      (exactDoi ? '/' + encodeURIComponent(doi) : ''),
  )
  if (!exactDoi) url.searchParams.set('query.bibliographic', query)
  if (year && !exactDoi)
    url.searchParams.set(
      'filter',
      'from-pub-date:' + year + '-01-01,to-pub-date:' + year + '-12-31',
    )
  if (!exactDoi) {
    url.searchParams.set('rows', '20')
    url.searchParams.set('cursor', cursor)
  }
  url.searchParams.set('mailto', contact)
  if (!exactDoi)
    url.searchParams.set(
      'select',
      'DOI,title,author,container-title,published,relation',
    )
  const upstream = await fetch(url, {
    headers: { 'User-Agent': 'BioCircuit/0.2 (mailto:' + contact + ')' },
    signal: AbortSignal.timeout(8000),
  })
  if (upstream.status === 404) return { papers: [], cursor: '' }
  if (!upstream.ok) throw Error('Provider unavailable')
  const raw = await upstream.json()
  if (exactDoi && raw.message?.DOI) raw.message = { items: [raw.message] }
  if (!Array.isArray(raw.message?.items))
    throw Error('Invalid provider response')
  const now = new Date().toISOString()
  const papers = (raw.message.items as CrossrefWork[])
    .slice(0, 20)
    .flatMap((w) => {
      if (!w.DOI || !w.title?.[0] || !/^10\.\d{4,9}\/\S+$/.test(w.DOI))
        return []
      const doi = w.DOI.toLowerCase()
      const date = w.published?.['date-parts']?.[0]
      return [
        {
          id: doi,
          doi,
          pmid: '',
          title: w.title[0].slice(0, 2000),
          authors: (w.author ?? [])
            .slice(0, 30)
            .map((a) => [a.given, a.family].filter(Boolean).join(' ')),
          venue: (w['container-title']?.[0] ?? '').slice(0, 1000),
          published: date
            ? date
                .map((n, i) => (i ? String(n).padStart(2, '0') : String(n)))
                .join('-')
            : '',
          source: 'Crossref',
          source_url: 'https://doi.org/' + doi,
          retrieved_at: now,
          abstract_available: false,
          correction:
            w.relation && Object.keys(w.relation).length
              ? 'Related records exist; check the source for corrections.'
              : '',
        },
      ]
    })
  return {
    papers: year
      ? papers.filter((p) => p.published.startsWith(String(year)))
      : papers,
    cursor:
      raw.message.items.length === 20
        ? String(raw.message['next-cursor'] ?? '')
        : '',
  }
}
