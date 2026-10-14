import { it, expect } from 'vitest'
import { fromPubmed } from '../src/domain/pubmed'
it('normalizes attributed PubMed metadata without inventing a publication day', () => {
  const p = fromPubmed(
    {
      uid: '123456',
      title: 'Synthetic <i>biomaterial</i> study',
      pubdate: '2026 Feb',
      authors: [{ name: 'Synthetic Author' }],
      articleids: [{ idtype: 'doi', value: '10.1234/TEST' }],
      pubtype: ['Retracted Publication'],
      attributes: ['Has Abstract'],
    },
    '2026-10-10T00:00:00Z',
  )
  expect(p?.id).toBe('10.1234/test')
  expect(p?.pmid).toBe('123456')
  expect(p?.published).toBe('2026-02')
  expect(p?.source).toBe('PubMed')
  expect(p?.correction).toContain('retraction')
  expect(p?.title).toBe('Synthetic biomaterial study')
})
it('rejects missing or malformed identifiers', () => {
  expect(fromPubmed({}, 'now')).toBeNull()
  expect(fromPubmed({ uid: 'bad/id', title: 'Anything' }, 'now')).toBeNull()
})
