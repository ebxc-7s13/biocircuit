import { afterEach, describe, it, expect, vi } from 'vitest'
afterEach(() => {
  vi.doUnmock('@supabase/supabase-js')
  vi.unstubAllEnvs()
  vi.resetModules()
})
describe('production boundary', () => {
  it('fails closed with missing public configuration, never synthetic success', async () => {
    vi.stubEnv('VITE_APP_MODE', 'connected')
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    vi.resetModules()
    const g = await import('../src/data/gateway')
    expect(g.isDemo).toBe(false)
    expect(g.supabase).toBeNull()
    await expect(g.snapshot()).rejects.toThrow('public configuration')
    await expect(g.mutate('someone', 'post', {})).rejects.toThrow(
      'not configured',
    )
  })
  it('isolates explicit demo without creating Auth or claiming verified phone', async () => {
    vi.stubEnv('VITE_APP_MODE', 'demo')
    vi.resetModules()
    const g = await import('../src/data/gateway')
    expect(g.isDemo).toBe(true)
    expect(g.supabase).toBeNull()
    const s = await g.snapshot()
    expect(s.profiles.every((p) => !p.phone_verified)).toBe(true)
    expect(s.papers).toHaveLength(0)
  })
  it('loads an anonymous snapshot without querying member-only recommendations', async () => {
    vi.stubEnv('VITE_APP_MODE', 'connected')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ibxubsegrabpspopdgep.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_unit_fixture')
    const { emptySnapshot } = await import('../src/domain/models')
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: emptySnapshot(), error: null })
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: { getSession: async () => ({ data: { session: null } }) },
        rpc,
      }),
    }))
    const g = await import('../src/data/gateway')
    expect((await g.snapshot()).posts).toEqual([])
    expect(rpc.mock.calls).toEqual([
      ['public_snapshot', { before_cursor: null }],
    ])
  })
  it('retains authenticated recommendation and metadata queries', async () => {
    vi.stubEnv('VITE_APP_MODE', 'connected')
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ibxubsegrabpspopdgep.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_unit_fixture')
    const { emptySnapshot } = await import('../src/domain/models')
    const rpc = vi.fn(async (name: string) => ({
      data:
        name === 'community_snapshot'
          ? emptySnapshot()
          : name === 'recommended_page'
            ? []
            : {},
      error: null,
    }))
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({
        auth: {
          getSession: async () => ({
            data: { session: { unitFixture: true } },
          }),
        },
        rpc,
        from: () => ({ select: () => ({ limit: async () => ({ data: [] }) }) }),
      }),
    }))
    const g = await import('../src/data/gateway')
    await g.snapshot()
    expect(rpc.mock.calls.map(([name]) => name)).toEqual([
      'community_snapshot',
      'recommended_page',
      'trust_metadata',
    ])
  })
})
