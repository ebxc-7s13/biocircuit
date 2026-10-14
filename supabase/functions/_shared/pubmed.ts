import { fromPubmed } from '../../../src/domain/pubmed.ts'
import type { PubmedRecord } from '../../../src/domain/pubmed.ts'
export async function pubmedSearch(
  query: string,
  cursor: string,
  year: number | null,
  contact: string,
  reserve: () => Promise<void>,
) {
  const exact = query.match(/^(?:PMID:\s*)?(\d{1,12})$/i)
  const offset = cursor === '*' ? 0 : Number(cursor)
  if (!Number.isInteger(offset) || offset < 0 || offset > 9980)
    throw Error('Invalid cursor')
  const call = async (endpoint: string, params: Record<string, string>) => {
    await reserve()
    const u = new URL(
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/' + endpoint + '.fcgi',
    )
    for (const [k, v] of Object.entries({
      db: 'pubmed',
      retmode: 'json',
      tool: 'biocircuit',
      email: contact,
      ...params,
    }))
      u.searchParams.set(k, v)
    const key = Deno.env.get('NCBI_API_KEY')
    if (key) u.searchParams.set('api_key', key)
    const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) throw Error('Provider unavailable')
    return r.json()
  }
  let ids: string[]
  let count = 0
  if (exact) ids = [exact[1]]
  else {
    const term = year
      ? '(' + query + ') AND ' + year + '[Date - Publication]'
      : query
    const result = await call('esearch', {
      term,
      retstart: String(offset),
      retmax: '20',
      sort: 'relevance',
    })
    if (!Array.isArray(result.esearchresult?.idlist))
      throw Error('Invalid provider response')
    ids = result.esearchresult.idlist
      .filter((id: string) => /^\d{1,12}$/.test(id))
      .slice(0, 20)
    count = Number(result.esearchresult.count)
  }
  if (!ids.length) return { papers: [], cursor: '' }
  const result = await call('esummary', { id: ids.join(',') })
  const now = new Date().toISOString()
  const papers = ids
    .flatMap((id) => {
      const p = fromPubmed((result.result?.[id] as PubmedRecord) ?? {}, now)
      return p ? [p] : []
    })
    .filter((p) => !year || p.published.startsWith(String(year)))
  return {
    papers,
    cursor:
      !exact && offset + 20 < count && offset + 20 <= 9980
        ? String(offset + 20)
        : '',
  }
}
