import { crossrefSearch } from '../_shared/crossref.ts'
import { pubmedSearch } from '../_shared/pubmed.ts'
import { allowed, authenticate, body, reply, headers } from '../_shared/http.ts'
// Crossref and PubMed: attributed bibliographic metadata, no full text.
// OpenAlex evaluated as an optional later source; no fabricated integration.
Deno.serve(async (req) => {
  const origin = allowed(req)
  if (!origin) return new Response('Origin denied', { status: 403 })
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: headers(origin) })
  if (req.method !== 'POST')
    return reply(origin, 405, { error: 'Method unavailable' })
  try {
    const auth = await authenticate(req)
    if (!auth) return reply(origin, 401, { error: 'Sign in required' })
    const { error: limitError } = await auth.client.rpc('search_budget')
    if (limitError)
      return reply(origin, 429, {
        error: 'Search unavailable. Wait and retry.',
      })
    const input = await body(req)
    const query = String(input.query ?? '').trim()
    const cursor = String(input.cursor ?? '*')
    if (query.length < 3 || query.length > 200 || cursor.length > 1500)
      return reply(origin, 400, { error: 'Invalid search' })
    const year = input.year == null ? null : Number(input.year)
    if (
      year !== null &&
      (!Number.isInteger(year) ||
        year < 1600 ||
        year > new Date().getFullYear() + 1)
    )
      return reply(origin, 400, { error: 'Invalid year' })
    const provider = input.provider === 'PubMed' ? 'PubMed' : 'Crossref'
    const contact = Deno.env.get(
      provider === 'PubMed' ? 'NCBI_EMAIL' : 'CROSSREF_MAILTO',
    )
    if (!contact)
      return reply(origin, 503, {
        error: 'Scholarly provider is not configured',
      })
    const cacheKey = JSON.stringify([
      query.toLowerCase(),
      cursor,
      year,
      provider,
    ])
    const cached = await auth.admin.rpc('scholarly_cache_get', {
      key: cacheKey,
    })
    if (cached.data) return reply(origin, 200, cached.data)
    const reserve = async () => {
      const slot = await auth.admin.rpc('reserve_scholarly_request')
      if (slot.error) throw Error('Provider capacity unavailable')
      if (slot.data)
        await new Promise((resolve) => setTimeout(resolve, slot.data))
    }
    const result = await (
      provider === 'PubMed' ? pubmedSearch : crossrefSearch
    )(query, cursor, year, contact, reserve)
    if (result.papers.length) {
      const saved = await auth.admin
        .from('papers')
        .upsert(result.papers, { onConflict: 'id' })
      if (saved.error)
        return reply(origin, 503, { error: 'Metadata cache unavailable' })
    }
    await auth.admin.rpc('scholarly_cache_put', {
      key: cacheKey,
      value: result,
    })
    return reply(origin, 200, result)
  } catch {
    return reply(origin, 503, {
      error: 'Search unavailable. Please retry later.',
    })
  }
})
