import { useEffect, useRef, useState } from 'react'
import { getClient, isDemo } from '../data/gateway'
import { emailSchema, registrationPasswordSchema } from '../domain/validation'
import {
  clearRecoveryArrival,
  readRecoveryArrival,
  recoverySessionId,
  hasRecoveryMethod,
  type RecoveryArrival,
} from '../domain/recovery'
import { appPath } from '../domain/paths'

// Recovery artifacts are verified by managed Auth, never by a browser-local
// flag. Default links additionally require a verified recovery AMR claim.
// Refresh intentionally clears this in-memory password editor context.
export default function Recovery({
  callback = readRecoveryArrival(),
}: { callback?: RecoveryArrival } = {}) {
  const [stage, setStage] = useState<
    'request' | 'verify' | 'link' | 'password' | 'done'
  >(callback.tokenHash || callback.fragment ? 'link' : 'request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(
    callback.invalid
      ? 'Recovery link unavailable, invalid or incomplete. Request a new email.'
      : '',
  )
  const [message, setMessage] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const owner = useRef<{ id: string; sessionId: string } | null>(null)
  const link = useRef(callback.tokenHash)
  const fragment = useRef(callback.fragment)
  const exchangeSession = useRef<string | null>(null)
  // True only while this page adopts the session it just exchanged. supabase-js
  // announces SIGNED_IN for that session before the identity checks below have
  // finished; the checks themselves (getSession must hold exactly this session
  // for the same user) then decide whether the adoption stands.
  const adopting = useRef(false)
  const inFlight = useRef(false)
  const mounted = useRef(false)
  const generation = useRef(0)
  useEffect(() => {
    mounted.current = true
    const effectRun = generation.current
    clearRecoveryArrival()
    let unsubscribe = () => {}
    if (!isDemo)
      void getClient()
        .then((client) => {
          if (!mounted.current || generation.current !== effectRun || !client)
            return
          const subscription = client.auth.onAuthStateChange(
            (event, session) => {
              if (event !== 'SIGNED_OUT' && event !== 'SIGNED_IN') return
              if (event === 'SIGNED_IN' && adopting.current) return
              if (
                event === 'SIGNED_IN' &&
                session &&
                (exchangeSession.current ===
                  recoverySessionId(session.access_token) ||
                  (owner.current?.id === session.user.id &&
                    owner.current.sessionId ===
                      recoverySessionId(session.access_token)))
              )
                return // SDK may re-emit SIGNED_IN when the same session refocuses.
              generation.current++
              owner.current = null
              link.current = null
              fragment.current = null
              setPassword('')
              setConfirm('')
              setToken('')
              setVisible(false)
              setBusy(false)
              inFlight.current = false
              setStage((current) =>
                current === 'password' || current === 'link'
                  ? 'request'
                  : current,
              )
            },
          )
          unsubscribe = () => subscription.data.subscription.unsubscribe()
        })
        .catch(() => {
          /* submit presents a safe connection error */
        })
    return () => {
      mounted.current = false
      generation.current++
      owner.current = null
      clearRecoveryArrival()
      unsubscribe()
    }
  }, [])
  useEffect(() => {
    if (!cooldown) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (inFlight.current || stage === 'done') return
    setError('')
    const address = emailSchema.safeParse(email)
    if ((stage === 'request' || stage === 'verify') && !address.success) {
      setError('Enter a valid email address.')
      return
    }
    if (stage === 'verify' && (!/^\d{6,10}$/.test(token) || attempts >= 5)) {
      setError('Enter the code from your recovery email, or request a new one.')
      return
    }
    if (
      stage === 'password' &&
      (!registrationPasswordSchema.safeParse(password).success ||
        password !== confirm)
    ) {
      setError('Use at least 12 characters and matching passwords.')
      return
    }
    if (stage === 'request' && cooldown) return
    if (isDemo) {
      setError(
        'Recovery requires connected Auth. Demo mode never sends or verifies recovery codes.',
      )
      return
    }
    inFlight.current = true
    const run = generation.current
    const current = () => mounted.current && generation.current === run
    setBusy(true)
    try {
      const client = await getClient()
      if (!client || !current()) throw Error('Unavailable')
      if (stage === 'request' && address.success) {
        // Identical UI for unknown accounts, success and provider rejection.
        // Backend rate limits/CAPTCHA remain authoritative.
        await client.auth.resetPasswordForEmail(address.data, {
          redirectTo: window.location.origin + appPath('account/recovery'),
        })
        if (!current()) return
        setCooldown(60)
        setMessage(
          'If delivery is available for this address, check your email for a recovery link or code. This does not confirm account existence or email delivery.',
        )
        setStage('verify')
        setAttempts(0)
      } else if (stage === 'verify' || stage === 'link') {
        setAttempts((v) => v + 1)
        const tokenHash = link.current
        const recoveryFragment = fragment.current
        link.current = null
        fragment.current = null
        if (stage === 'link' && recoveryFragment) {
          const checked = await client.auth.getUser(
            recoveryFragment.accessToken,
          )
          if (!current()) return
          if (
            checked.error ||
            !checked.data.user ||
            !hasRecoveryMethod(
              recoveryFragment.accessToken,
              checked.data.user.recovery_sent_at,
            )
          )
            throw Error('Unavailable')
          exchangeSession.current = recoverySessionId(
            recoveryFragment.accessToken,
          )
        }
        adopting.current = true
        const result =
          stage === 'link' && recoveryFragment
            ? await client.auth.setSession({
                access_token: recoveryFragment.accessToken,
                refresh_token: recoveryFragment.refreshToken,
              })
            : stage === 'link' && tokenHash
              ? await client.auth.verifyOtp({
                  token_hash: tokenHash,
                  type: 'recovery',
                })
              : stage === 'verify' && address.success
                ? await client.auth.verifyOtp({
                    email: address.data,
                    token,
                    type: 'recovery',
                  })
                : null
        if (!current()) return
        exchangeSession.current = null
        setToken('')
        if (
          !result ||
          result.error ||
          !result.data.session ||
          !result.data.user
        ) {
          if (stage === 'link') setStage('request')
          setError(
            'Recovery link or code unavailable, invalid, expired or already used. Request a new email.',
          )
          return
        }
        const managed = await client.auth.getUser(
          result.data.session.access_token,
        )
        const session = await client.auth.getSession()
        if (!current()) return
        const sessionId = recoverySessionId(result.data.session.access_token)
        if (
          managed.error ||
          managed.data.user?.id !== result.data.user.id ||
          session.error ||
          !sessionId ||
          !session.data.session ||
          recoverySessionId(session.data.session.access_token) !== sessionId ||
          session.data.session.user.id !== managed.data.user.id
        )
          throw Error('Unavailable')
        owner.current = { id: managed.data.user.id, sessionId }
        adopting.current = false
        setMessage('Recovery verified by Auth. Choose a new, unique password.')
        setStage('password')
      } else {
        const session = await client.auth.getSession()
        if (!current()) return
        if (
          !owner.current ||
          session.error ||
          !session.data.session ||
          recoverySessionId(session.data.session.access_token) !==
            owner.current.sessionId ||
          session.data.session.user.id !== owner.current.id
        )
          throw Error('Unavailable')
        const managed = await client.auth.getUser(
          session.data.session.access_token,
        )
        if (!current()) return
        if (
          !owner.current ||
          managed.error ||
          managed.data.user?.id !== owner.current.id
        )
          throw Error('Unavailable')
        const result = await client.auth.updateUser({ password })
        if (!current()) return
        setPassword('')
        setConfirm('')
        setVisible(false)
        if (result.error) {
          setError(
            'Password update unavailable. Use a stronger password or request a new recovery code.',
          )
          return
        }
        owner.current = null
        const signedOut = await client.auth.signOut()
        if (!mounted.current) return
        setStage('done')
        setMessage(
          signedOut.error
            ? 'Password updated by Auth. Sign out from Settings before using another device.'
            : 'Password updated by Auth and signed out. Sign in with your new password.',
        )
      }
    } catch {
      exchangeSession.current = null
      if (current() && stage === 'link') setStage('request')
      if (current())
        setError(
          'Recovery could not be completed. Check your connection or request a new code.',
        )
    } finally {
      adopting.current = false
      if (current()) {
        inFlight.current = false
        setBusy(false)
      }
    }
  }
  const cancel = () => {
    generation.current++
    owner.current = null
    link.current = null
    fragment.current = null
    exchangeSession.current = null
    clearRecoveryArrival()
    setPassword('')
    setConfirm('')
    setToken('')
    setVisible(false)
    setError('')
    setMessage('Recovery cancelled. No password was changed.')
    setStage('request')
  }
  return (
    <section className="email-auth" aria-labelledby="recovery-title">
      <span className="eyebrow">Account security</span>
      <h1 id="recovery-title">Recover your account</h1>
      <p>
        Email recovery never verifies a phone number, approves academic
        membership, or assigns a trusted role.
      </p>
      <p className="notice">
        Email delivery depends on the configured sender. A request does not
        prove that an email was delivered.
      </p>
      {stage === 'link' && (
        <p className="notice">
          Continue to verify this single-use link with Auth. Opening the page
          alone never changes your password.
        </p>
      )}
      <form noValidate onSubmit={(e) => void submit(e)} aria-busy={busy}>
        {(stage === 'request' || stage === 'verify') && (
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy || stage !== 'request'}
              required
            />
          </label>
        )}
        {stage === 'verify' && (
          <label>
            Recovery code
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={10}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              disabled={busy}
              required
            />
          </label>
        )}
        {stage === 'password' && (
          <>
            <label>
              New password
              <input
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <label>
              Confirm new password
              <input
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={busy}
                required
              />
            </label>
            <button
              type="button"
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
              disabled={busy}
            >
              {visible ? 'Hide passwords' : 'Show passwords'}
            </button>
          </>
        )}
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <div className="actions">
          {stage !== 'done' && (
            <button
              className="primary"
              disabled={
                busy ||
                (stage === 'request' && cooldown > 0) ||
                (stage === 'verify' && attempts >= 5)
              }
            >
              {busy
                ? 'Please wait…'
                : stage === 'request'
                  ? cooldown
                    ? `Request again in ${cooldown}s`
                    : 'Request recovery email'
                  : stage === 'verify'
                    ? 'Verify recovery code'
                    : stage === 'link'
                      ? 'Continue recovery'
                      : 'Update password'}
            </button>
          )}
          {stage === 'verify' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setStage('request')
                setToken('')
                setError('')
                setMessage('')
              }}
            >
              Request a new code
            </button>
          )}
          {stage === 'request' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!emailSchema.safeParse(email).success) {
                  setError('Enter a valid email address.')
                  return
                }
                setError('')
                setAttempts(0)
                setStage('verify')
                setMessage(
                  'Enter the actual code from your recovery email. No new email was requested.',
                )
              }}
            >
              I already have a code
            </button>
          )}
          {['verify', 'link', 'password'].includes(stage) && (
            <button type="button" onClick={cancel} disabled={busy}>
              Cancel recovery
            </button>
          )}
          <a href={appPath('feed')}>Return to feed</a>
        </div>
      </form>
    </section>
  )
}
