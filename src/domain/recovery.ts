import { appPath } from './paths'
export type RecoveryArrival = {
  tokenHash: string | null
  invalid: boolean
  fragment?: { accessToken: string; refreshToken: string } | null
}
let arrival: RecoveryArrival = { tokenHash: null, invalid: false }

// Called before React/router startup. Never persist recovery artifacts or enable
// general URL session detection. A token hash is still a bearer secret.
export function captureRecoveryArrival(location: Location, history: History) {
  if (location.pathname !== appPath('account/recovery')) return
  const query = new URLSearchParams(location.search)
  const present = !!location.search || !!location.hash
  const hash = query.get('token_hash')
  const fragment = new URLSearchParams(location.hash.slice(1))
  const accessToken = fragment.get('access_token') ?? ''
  const refreshToken = fragment.get('refresh_token') ?? ''
  const validFragment =
    !location.search &&
    fragment.get('type') === 'recovery' &&
    fragment.get('token_type') === 'bearer' &&
    fragment.getAll('access_token').length === 1 &&
    fragment.getAll('refresh_token').length === 1 &&
    fragment.getAll('type').length === 1 &&
    // Hosted Auth may append an empty `sb` marker to redirects; nothing else is accepted.
    fragment.getAll('sb').every((value) => value === '') &&
    fragment.getAll('sb').length <= 1 &&
    [...fragment.keys()].every(
      (key) =>
        key === 'sb' ||
        [
          'access_token',
          'refresh_token',
          'type',
          'token_type',
          'expires_in',
          'expires_at',
        ].includes(key),
    ) &&
    accessToken.length <= 8192 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken) &&
    // Structural sanity only: hosted Auth validates the token itself, and token
    // formats (short opaque or longer dotted) vary between Auth releases.
    /^[A-Za-z0-9._~-]{8,2048}$/.test(refreshToken)
  const valid =
    query.getAll('token_hash').length === 1 &&
    query.getAll('type').length === 1 &&
    query.get('type') === 'recovery' &&
    !location.hash &&
    [...query.keys()].every((k) => ['token_hash', 'type'].includes(k)) &&
    /^[a-f0-9]{56}$/i.test(hash ?? '')
  arrival = {
    tokenHash: valid ? hash : null,
    invalid: present && !valid && !validFragment,
    fragment: validFragment ? { accessToken, refreshToken } : null,
  }
  if (present) history.replaceState(history.state, '', location.pathname)
  return { ...arrival }
}
export const readRecoveryArrival = () => ({ ...arrival })
export const clearRecoveryArrival = () => {
  arrival = { tokenHash: null, invalid: false }
}

// Compare a managed session's stable ID, never use decoded claims to authorize.
// getUser must independently verify the actual token before this is used.
export function recoverySessionId(accessToken: string): string | null {
  try {
    const payload = JSON.parse(
      atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    return typeof payload.session_id === 'string' && payload.session_id
      ? payload.session_id
      : null
  } catch {
    return null
  }
}

// Hosted email links (implicit flow) label recovery sessions amr "otp", not
// "recovery" (supabase/auth verify.go issues models.OTP); PKCE uses "recovery".
// An "otp" session is accepted only if issued within the link lifetime after the
// user's recorded recovery email. Password (and older OTP) sessions never pass.
const LINK_LIFETIME_S = 3600
const CLOCK_SKEW_S = 120

// Only consult this AFTER getUser(accessToken) verifies the token with hosted
// Auth, passing that verified user's recovery_sent_at. A fabricated fragment
// type or unsigned local claim cannot grant access.
export function hasRecoveryMethod(
  accessToken: string,
  recoverySentAt?: string | null,
  now = Date.now(),
): boolean {
  try {
    const payload = JSON.parse(
      atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
    )
    if (!Array.isArray(payload.amr)) return false
    const entries = payload.amr as { method?: string; timestamp?: number }[]
    if (entries.some((entry) => entry.method === 'recovery')) return true
    const sent = recoverySentAt ? Date.parse(recoverySentAt) / 1000 : NaN
    const nowS = now / 1000
    return (
      Number.isFinite(sent) &&
      entries.some(
        (entry) =>
          entry.method === 'otp' &&
          typeof entry.timestamp === 'number' &&
          entry.timestamp >= sent - CLOCK_SKEW_S &&
          entry.timestamp <= sent + LINK_LIFETIME_S &&
          entry.timestamp <= nowS + CLOCK_SKEW_S &&
          nowS - entry.timestamp <= LINK_LIFETIME_S,
      )
    )
  } catch {
    return false
  }
}
