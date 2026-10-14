import { pubmedSearch } from './_shared/pubmed.ts'
const assert = (value: boolean) => {
  if (!value) throw Error('Provider contract assertion failed')
}
const response = (data: unknown) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
  })
const record = (id: string) => ({
  uid: id,
  title: 'Synthetic local contract fixture',
  pubdate: '2026 Jan',
  authors: [{ name: 'Synthetic Author' }],
  articleids: [],
})

Deno.test(
  'PubMed fixture: bounded pagination, year, provenance and reserve per call',
  async () => {
    const original = globalThis.fetch
    let reserved = 0
    const urls: URL[] = []
    Deno.env.delete('NCBI_API_KEY')
    try {
      globalThis.fetch = async (input) => {
        const url = new URL(String(input))
        urls.push(url)
        assert(reserved === urls.length)
        if (url.pathname.includes('esearch'))
          return response({
            esearchresult: { idlist: ['123456'], count: '45' },
          })
        return response({ result: { '123456': record('123456') } })
      }
      const result = await pubmedSearch(
        'biomaterials',
        '20',
        2026,
        'operator@example.invalid',
        async () => {
          reserved++
        },
      )
      assert(reserved === 2 && urls.length === 2 && result.cursor === '40')
      assert(
        urls[0].searchParams.get('retmax') === '20' &&
          urls[0].searchParams.get('retstart') === '20',
      )
      assert(
        urls[0].searchParams.get('term') ===
          '(biomaterials) AND 2026[Date - Publication]',
      )
      assert(
        result.papers.length === 1 &&
          result.papers[0].source === 'PubMed' &&
          result.papers[0].pmid === '123456',
      )
      assert(
        result.papers[0].source_url ===
          'https://pubmed.ncbi.nlm.nih.gov/123456/' &&
          Boolean(result.papers[0].retrieved_at),
      )
    } finally {
      globalThis.fetch = original
    }
  },
)

Deno.test(
  'PubMed fixture: exact identifiers avoid search and invalid cursor does no network work',
  async () => {
    const original = globalThis.fetch
    let calls = 0
    try {
      globalThis.fetch = async () => {
        calls++
        return response({ result: { '123456': record('123456') } })
      }
      const result = await pubmedSearch(
        'PMID:123456',
        '*',
        null,
        'operator@example.invalid',
        async () => {},
      )
      assert(calls === 1 && result.cursor === '' && result.papers.length === 1)
      for (const cursor of ['-1', '9981', 'x', '1.5']) {
        let rejected = false
        try {
          await pubmedSearch(
            'biomaterials',
            cursor,
            null,
            'operator@example.invalid',
            async () => {},
          )
        } catch {
          rejected = true
        }
        assert(rejected && calls === 1)
      }
    } finally {
      globalThis.fetch = original
    }
  },
)

Deno.test(
  'PubMed fixture: budget denial, upstream rate limit and malformed data fail honestly',
  async () => {
    const original = globalThis.fetch
    let calls = 0
    try {
      globalThis.fetch = async () => {
        calls++
        return new Response('', { status: 429 })
      }
      let denied = false
      try {
        await pubmedSearch(
          'biomaterials',
          '*',
          null,
          'operator@example.invalid',
          async () => {
            throw Error('Synthetic budget refusal')
          },
        )
      } catch {
        denied = true
      }
      assert(denied && calls === 0)
      for (const fixture of [
        () => new Response('', { status: 429 }),
        () => response({ unexpected: true }),
      ]) {
        globalThis.fetch = async () => fixture()
        let failed = false
        try {
          await pubmedSearch(
            'biomaterials',
            '*',
            null,
            'operator@example.invalid',
            async () => {},
          )
        } catch {
          failed = true
        }
        assert(failed)
      }
      globalThis.fetch = async () =>
        response({ esearchresult: { idlist: [], count: '0' } })
      const empty = await pubmedSearch(
        'biomaterials',
        '*',
        null,
        'operator@example.invalid',
        async () => {},
      )
      assert(empty.papers.length === 0 && empty.cursor === '')
    } finally {
      globalThis.fetch = original
    }
  },
)
