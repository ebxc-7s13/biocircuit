import type { SupabaseClient } from '@supabase/supabase-js'
import { appPath } from './paths'

// GitHub OAuth (implicit flow, detectSessionInUrl disabled). The callback
// fragment is captured before router startup, stripped from the URL, held only
// in memory, and adopted only if THIS browser started a sign-in in the last
// 10 minutes (protects against login CSRF into someone else's account).
const NONCE_KEY = 'biocircuit-oauth-started'
const MAX_AGE_MS = 10 * 60 * 1000
export const oauthCallbackPath = () => appPath('auth/callback')

export type OAuthArrival = {
  tokens: { accessToken: string; refreshToken: string } | null
  error: boolean
}
let arrival: OAuthArrival = { tokens: null, error: false }

export async function startGithubSignIn(client: SupabaseClient) {
  try {
    sessionStorage.setItem(NONCE_KEY, String(Date.now()))
  } catch {
    /* without storage the callback refuses adoption; nothing leaks */
  }
  return client.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: window.location.origin + oauthCallbackPath() },
  })
}

export function captureOAuthArrival(location: Location, history: History) {
  if (location.pathname !== oauthCallbackPath()) return
  const fragment = new URLSearchParams(location.hash.slice(1))
  const query = new URLSearchParams(location.search)
  const allowed = [
    'access_token',
    'refresh_token',
    'expires_in',
    'expires_at',
    'token_type',
    'provider_token',
    'provider_refresh_token',
    'sb',
  ]
  const accessToken = fragment.get('access_token') ?? ''
  const refreshToken = fragment.get('refresh_token') ?? ''
  const valid =
    !location.search &&
    fragment.get('token_type') === 'bearer' &&
    [...fragment.keys()].every((k) => allowed.includes(k)) &&
    allowed.every((k) => fragment.getAll(k).length <= 1) &&
    accessToken.length <= 8192 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken) &&
    /^[A-Za-z0-9._~-]{8,2048}$/.test(refreshToken)
  arrival = {
    tokens: valid ? { accessToken, refreshToken } : null,
    error: !valid || fragment.has('error') || query.has('error'),
  }
  if (location.search || location.hash)
    history.replaceState(history.state, '', location.pathname)
}

export function takeOAuthArrival(now = Date.now()): OAuthArrival & {
  startedHere: boolean
} {
  const current = arrival
  arrival = { tokens: null, error: false }
  let started = NaN
  try {
    started = Number(sessionStorage.getItem(NONCE_KEY))
    sessionStorage.removeItem(NONCE_KEY)
  } catch {
    /* treated as not started here */
  }
  return {
    ...current,
    startedHere:
      Number.isFinite(started) && started <= now && now - started < MAX_AGE_MS,
  }
}
