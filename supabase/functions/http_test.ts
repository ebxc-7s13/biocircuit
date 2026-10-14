import { allowed, body, headers, reply, authenticate } from './_shared/http.ts'
const assert = (condition: boolean) => {
  if (!condition) throw Error('Assertion failed')
}
Deno.test('strict origin and no private cache', () => {
  Deno.env.set('ALLOWED_ORIGIN', 'https://community.example')
  assert(
    allowed(
      new Request('https://api.example', {
        headers: { Origin: 'https://community.example' },
      }),
    ) === 'https://community.example',
  )
  assert(
    allowed(
      new Request('https://api.example', {
        headers: { Origin: 'https://hostile.example' },
      }),
    ) === null,
  )
  assert(headers('https://community.example')['Cache-Control'] === 'no-store')
  assert(
    reply('https://community.example', 403, { error: 'Access denied' })
      .status === 403,
  )
})
Deno.test('exact origin list: each listed origin echoed, nothing else', () => {
  Deno.env.set(
    'ALLOWED_ORIGIN',
    'http://127.0.0.1:5190, https://owner.github.io',
  )
  const at = (o: string | null) =>
    allowed(
      new Request('https://api.example', {
        headers: o ? { Origin: o } : {},
      }),
    )
  assert(at('http://127.0.0.1:5190') === 'http://127.0.0.1:5190')
  assert(at('https://owner.github.io') === 'https://owner.github.io')
  for (const o of [
    'https://owner.github.io.evil.example',
    'https://evil.github.io',
    'http://owner.github.io',
    'null',
    '*',
    '',
  ])
    assert(at(o) === null)
  assert(at(null) === null)
  Deno.env.set('ALLOWED_ORIGIN', '')
  assert(at('http://127.0.0.1:5190') === null)
})
Deno.test('streaming JSON limit rejects spoofed body length', async () => {
  let rejected = false
  try {
    await body(
      new Request('https://api.example', {
        method: 'POST',
        body: JSON.stringify({ value: 'x'.repeat(20000) }),
      }),
    )
  } catch {
    rejected = true
  }
  assert(rejected)
  const parsed = await body(
    new Request('https://api.example', {
      method: 'POST',
      body: '{"query":"microscopy"}',
    }),
  )
  assert(parsed.query === 'microscopy')
})
Deno.test('anonymous authentication is never simulated', async () => {
  Deno.env.delete('SUPABASE_URL')
  Deno.env.delete('SUPABASE_ANON_KEY')
  Deno.env.delete('SUPABASE_SERVICE_ROLE_KEY')
  assert((await authenticate(new Request('https://api.example'))) === null)
})
