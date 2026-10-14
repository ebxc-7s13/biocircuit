import { afterEach, expect, it, vi } from 'vitest'
import { captureOAuthArrival, takeOAuthArrival } from '../src/domain/oauth'
const NONCE = 'biocircuit-oauth-started'
afterEach(() => {
  sessionStorage.clear()
  takeOAuthArrival()
})
const capture = (suffix: string) => {
  const url = new URL('http://localhost/auth/callback' + suffix)
  const replaceState = vi.fn()
  captureOAuthArrival(
    url as unknown as Location,
    { replaceState, state: null } as unknown as History,
  )
  return replaceState
}
const good =
  '#access_token=unit.payload.signature&expires_at=1791900000&expires_in=3600' +
  '&provider_token=gho_unit&refresh_token=' +
  'r'.repeat(12) +
  '&sb=&token_type=bearer'
it('captures a GitHub implicit callback in memory and strips the URL', () => {
  sessionStorage.setItem(NONCE, String(Date.now() - 1000))
  const replaceState = capture(good)
  expect(replaceState).toHaveBeenCalledWith(null, '', '/auth/callback')
  const arrival = takeOAuthArrival()
  expect(arrival.tokens?.accessToken).toBe('unit.payload.signature')
  expect(arrival.startedHere).toBe(true)
  expect(sessionStorage.getItem(NONCE)).toBeNull()
  // Taken once only.
  expect(takeOAuthArrival().tokens).toBeNull()
})
it('refuses adoption when this browser did not start the sign-in (login CSRF)', () => {
  capture(good)
  expect(takeOAuthArrival().startedHere).toBe(false)
})
it('refuses a stale sign-in start', () => {
  sessionStorage.setItem(NONCE, String(Date.now() - 11 * 60 * 1000))
  capture(good)
  expect(takeOAuthArrival().startedHere).toBe(false)
})
it.each([
  '#error=access_denied&error_description=denied',
  '?error=server_error',
  good + '&type=recovery',
  good + '&access_token=second.token.value',
  '#access_token=bad&refresh_token=' + 'r'.repeat(12) + '&token_type=bearer',
  '',
])('rejects error/unknown/duplicate/malformed callbacks: %s', (suffix) => {
  sessionStorage.setItem(NONCE, String(Date.now()))
  capture(suffix)
  const arrival = takeOAuthArrival()
  expect(arrival.tokens).toBeNull()
  expect(arrival.error).toBe(true)
})
