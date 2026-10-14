import { afterEach, expect, it, vi } from 'vitest'
import {
  captureRecoveryArrival,
  clearRecoveryArrival,
  hasRecoveryMethod,
  readRecoveryArrival,
  recoverySessionId,
} from '../src/domain/recovery'
afterEach(clearRecoveryArrival)
const capture = (suffix: string) => {
  const url = new URL('http://localhost/account/recovery' + suffix)
  const replaceState = vi.fn()
  const result = captureRecoveryArrival(
    url as unknown as Location,
    { replaceState, state: null } as unknown as History,
  )
  return { result, replaceState }
}
it('captures one supported hash in memory and strips it before router startup', () => {
  const hash = 'a'.repeat(56)
  const { result, replaceState } = capture(
    '?token_hash=' + hash + '&type=recovery',
  )
  expect(result?.tokenHash).toBe(hash)
  expect(result?.invalid).toBe(false)
  expect(replaceState).toHaveBeenCalledWith(null, '', '/account/recovery')
  clearRecoveryArrival()
  expect(readRecoveryArrival().tokenHash).toBeNull()
})
it.each([
  '?type=recovery',
  '?token_hash=bad&type=recovery',
  '?token_hash=' + 'a'.repeat(56) + '&type=signup',
  '?token_hash=' +
    'a'.repeat(56) +
    '&type=recovery&token_hash=' +
    'b'.repeat(56),
  '#error=access_denied&error_description=private',
  // Exact hosted response observed for an expired real link on 2026-10-14.
  '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired',
  '#access_token=unit.payload.signature&refresh_token=' +
    'r'.repeat(12) +
    '&type=recovery&token_type=bearer&sb=unexpected',
])(
  'rejects incomplete/wrong-purpose/duplicated/error artifacts without preserving them: %s',
  (suffix) => {
    const { result, replaceState } = capture(suffix)
    expect(result?.invalid).toBe(true)
    expect(result?.tokenHash).toBeNull()
    expect(result?.fragment).toBeNull()
    expect(replaceState).toHaveBeenCalledWith(null, '', '/account/recovery')
  },
)
it('captures structurally valid default recovery fragments but does not authorize them', () => {
  const { result } = capture(
    '#access_token=unit.payload.signature&refresh_token=' +
      'r'.repeat(12) +
      '&type=recovery&token_type=bearer&expires_in=3600',
  )
  expect(result?.invalid).toBe(false)
  expect(result?.fragment).toBeTruthy()
  expect(hasRecoveryMethod(result!.fragment!.accessToken)).toBe(false)
})
it('accepts the empty sb marker hosted Auth may append to implicit redirects', () => {
  const { result, replaceState } = capture(
    '#access_token=unit.payload.signature&expires_at=1791900000&expires_in=3600' +
      '&refresh_token=' +
      'r'.repeat(12) +
      '&sb=&token_type=bearer&type=recovery',
  )
  expect(result?.invalid).toBe(false)
  expect(result?.fragment?.accessToken).toBe('unit.payload.signature')
  expect(replaceState).toHaveBeenCalledWith(null, '', '/account/recovery')
})
it('accepts longer dotted refresh tokens but rejects unsafe characters', () => {
  const base =
    '#access_token=unit.payload.signature&type=recovery&token_type=bearer&refresh_token='
  expect(capture(base + 'v2.' + 'r'.repeat(60)).result?.invalid).toBe(false)
  expect(capture(base + 'r'.repeat(8) + '%3Cx%3E').result?.invalid).toBe(true)
  expect(capture(base + 'r'.repeat(7)).result?.invalid).toBe(true)
})
it('accepts hosted email-link recovery sessions (amr otp) only right after a recorded recovery email', () => {
  const now = Date.parse('2026-10-14T08:16:30Z')
  const sent = '2026-10-14T08:13:07Z'
  const at = (method: string, iso: string) =>
    'unit.' +
    btoa(
      JSON.stringify({
        session_id: 'unit-session',
        amr: [{ method, timestamp: Date.parse(iso) / 1000 }],
      }),
    ) +
    '.fixture'
  const fresh = at('otp', '2026-10-14T08:16:20Z')
  expect(hasRecoveryMethod(fresh, sent, now)).toBe(true)
  // No recorded recovery email, or a password session: refused.
  expect(hasRecoveryMethod(fresh, null, now)).toBe(false)
  expect(
    hasRecoveryMethod(at('password', '2026-10-14T08:16:20Z'), sent, now),
  ).toBe(false)
  // OTP session issued before the recovery email (e.g. an earlier phone login): refused.
  expect(hasRecoveryMethod(at('otp', '2026-10-14T07:00:00Z'), sent, now)).toBe(
    false,
  )
  // Older than the link lifetime: refused.
  expect(
    hasRecoveryMethod(fresh, sent, Date.parse('2026-10-14T09:30:00Z')),
  ).toBe(false)
  // Missing timestamp or unparsable recovery time: refused.
  const bare =
    'unit.' + btoa(JSON.stringify({ amr: [{ method: 'otp' }] })) + '.fixture'
  expect(hasRecoveryMethod(bare, sent, now)).toBe(false)
  expect(hasRecoveryMethod(fresh, 'not-a-date', now)).toBe(false)
})
it('ordinary password claims do not satisfy recovery; session IDs must exist', () => {
  const token = (method: string) =>
    'unit.' +
    btoa(JSON.stringify({ session_id: 'unit-session', amr: [{ method }] })) +
    '.fixture'
  expect(hasRecoveryMethod(token('password'))).toBe(false)
  expect(hasRecoveryMethod(token('recovery'))).toBe(true)
  expect(recoverySessionId(token('recovery'))).toBe('unit-session')
  expect(recoverySessionId('invalid')).toBeNull()
})
