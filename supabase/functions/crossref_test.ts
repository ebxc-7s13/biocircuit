import { crossrefSearch } from './_shared/crossref.ts'
const assert = (value: boolean) => {
  if (!value) throw Error('Provider contract assertion failed')
}
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
const work = (doi: string, year: number) => ({
  DOI: doi,
  title: ['Synthetic local contract fixture'],
  author: [{ given: 'Synthetic', family: 'Author' }],
  'container-title': ['Synthetic Venue'],
  published: { 'date-parts': [[year, 3, 7]] },
})
const contact = 'operator@example.invalid'
const withFetch = async (
  handler: (url: URL) => Response,
  run: () => Promise<void>,
) => {
  const original = globalThis.fetch
  globalThis.fetch = async (input) => handler(new URL(String(input)))
  try {
    await run()
  } finally {
    globalThis.fetch = original
  }
}

Deno.test(
  'Crossref fixture: bounded search, year filter, cursor and provenance',
  async () => {
    const urls: URL[] = []
    let reserved = 0
    const items = Array.from({ length: 20 }, (_, i) =>
      work('10.1234/Fixture.' + i, i === 0 ? 2025 : 2026),
    )
    items[19] = work('not-a-doi', 2026)
    await withFetch(
      (url) => {
        urls.push(url)
        assert(reserved === 1)
        return response({ message: { items, 'next-cursor': 'NEXT' } })
      },
      async () => {
        const result = await crossrefSearch(
          'biomaterials',
          '*',
          2026,
          contact,
          async () => {
            reserved++
          },
        )
        assert(urls.length === 1 && reserved === 1)
        const u = urls[0]
        assert(
          u.pathname === '/works' &&
            u.searchParams.get('rows') === '20' &&
            u.searchParams.get('cursor') === '*' &&
            u.searchParams.get('query.bibliographic') === 'biomaterials' &&
            u.searchParams.get('filter') ===
              'from-pub-date:2026-01-01,to-pub-date:2026-12-31' &&
            u.searchParams.get('mailto') === contact,
        )
        // Twenty raw items were returned, so a next cursor is offered; the off-year
        // record and the malformed DOI are dropped, never invented.
        assert(result.cursor === 'NEXT' && result.papers.length === 18)
        const p = result.papers[0]
        assert(
          p.doi === '10.1234/fixture.1' &&
            p.source === 'Crossref' &&
            p.source_url === 'https://doi.org/10.1234/fixture.1' &&
            p.published === '2026-03-07' &&
            p.venue === 'Synthetic Venue' &&
            p.authors[0] === 'Synthetic Author' &&
            p.abstract_available === false &&
            Boolean(p.retrieved_at),
        )
      },
    )
  },
)

Deno.test(
  'Crossref fixture: exact DOI lookup, unknown DOI is an honest empty result',
  async () => {
    const urls: URL[] = []
    await withFetch(
      (url) => {
        urls.push(url)
        return urls.length === 1
          ? response({ message: work('10.5555/ABC', 2024) })
          : response({ status: 'error' }, 404)
      },
      async () => {
        const found = await crossrefSearch(
          'https://doi.org/10.5555/ABC',
          '*',
          null,
          contact,
          async () => {},
        )
        assert(
          urls[0].pathname === '/works/10.5555%2Fabc' &&
            !urls[0].searchParams.has('cursor') &&
            found.papers.length === 1 &&
            found.cursor === '',
        )
        const missing = await crossrefSearch(
          'doi:10.5555/missing',
          '*',
          null,
          contact,
          async () => {},
        )
        assert(missing.papers.length === 0 && missing.cursor === '')
      },
    )
  },
)

Deno.test(
  'Crossref fixture: budget denial, upstream errors and malformed data fail honestly',
  async () => {
    let calls = 0
    await withFetch(
      () => {
        calls++
        return response({}, 500)
      },
      async () => {
        let denied = false
        try {
          await crossrefSearch('biomaterials', '*', null, contact, async () => {
            throw Error('Synthetic budget refusal')
          })
        } catch {
          denied = true
        }
        assert(denied && calls === 0)
      },
    )
    for (const fixture of [
      () => response({}, 429),
      () => response({}, 503),
      () => response({ message: { unexpected: true } }),
    ]) {
      let failed = false
      await withFetch(fixture, async () => {
        try {
          await crossrefSearch(
            'biomaterials',
            '*',
            null,
            contact,
            async () => {},
          )
        } catch {
          failed = true
        }
      })
      assert(failed)
    }
    await withFetch(
      () => response({ message: { items: [] } }),
      async () => {
        const empty = await crossrefSearch(
          'biomaterials',
          '*',
          null,
          contact,
          async () => {},
        )
        assert(empty.papers.length === 0 && empty.cursor === '')
      },
    )
  },
)
