import { useId, useRef, useState } from 'react'
import { getClient, isDemo } from '../data/gateway'
import {
  emailSchema,
  loginPasswordSchema,
  registrationPasswordSchema,
} from '../domain/validation'
import { appPath } from '../domain/paths'

export default function EmailAuth({
  onAuthenticated,
  captchaToken,
  captchaReady,
  onChallengeUsed,
}: {
  onAuthenticated: () => Promise<void>
  captchaToken: string
  captchaReady: boolean
  onChallengeUsed: () => void
}) {
  const id = useId()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const inFlight = useRef(false)
  const section = useRef<HTMLElement>(null)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (inFlight.current) return
    setError('')
    setMessage('')
    const e = emailSchema.safeParse(email)
    const p = (
      mode === 'register' ? registrationPasswordSchema : loginPasswordSchema
    ).safeParse(password)
    if (!e.success || !p.success) {
      setError(
        !e.success
          ? e.error.issues[0].message
          : !p.success
            ? p.error.issues[0].message
            : '',
      )
      return
    }
    if (isDemo) {
      setError(
        'Email authentication requires connected mode. No demo account was created.',
      )
      return
    }
    if (!captchaReady) {
      setError('Complete the anti-abuse challenge before continuing.')
      return
    }
    inFlight.current = true
    setBusy(true)
    try {
      const client = await getClient()
      if (!client)
        throw Error(
          'Authentication is not configured. Please retry after setup.',
        )
      const credentials = {
        email: e.data,
        password: p.data,
        ...(captchaToken ? { options: { captchaToken } } : {}),
      }
      const result =
        mode === 'register'
          ? await client.auth.signUp(credentials)
          : await client.auth.signInWithPassword(credentials)
      onChallengeUsed()
      if (result.error) {
        const code = result.error.code
        setError(
          code === 'over_request_rate_limit' ||
            code === 'over_email_send_rate_limit'
            ? 'Too many attempts. Wait before trying again.'
            : code === 'captcha_failed'
              ? 'Anti-abuse verification failed. Complete the challenge or contact the staging operator.'
              : code === 'weak_password'
                ? 'Choose a stronger, unique password that meets the server requirements.'
                : mode === 'login'
                  ? 'Sign-in failed. Check your email and password, then try again.'
                  : 'Account could not be created. If you already registered, sign in; otherwise check your details and try again.',
        )
        return
      }
      setPassword('')
      setVisible(false)
      if (!result.data.session) {
        setMessage(
          'Registration received. Check your email for confirmation before signing in. No signed-in session was returned.',
        )
        return
      }
      setMessage(
        mode === 'register'
          ? 'Account created and signed in. Phone and academic eligibility remain separate.'
          : 'Signed in. Phone and academic eligibility remain separate.',
      )
      await onAuthenticated()
    } catch {
      setError(
        'Authentication could not be completed. Check your connection and try again.',
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <section
      ref={section}
      className="email-auth"
      aria-labelledby={id + '-title'}
    >
      <span className="eyebrow">Your research identity</span>
      <h3 id={id + '-title'}>
        {mode === 'login' ? 'Welcome back' : 'Create your account'}
      </h3>
      <p className="muted">
        Sign in with email to browse and manage your own profile. During the
        public preview, contributing requires Continue with GitHub. Email
        sign-in does not verify your phone.
      </p>
      <form noValidate onSubmit={(e) => void submit(e)} aria-busy={busy}>
        <label htmlFor={id + '-email'}>Email address</label>
        <input
          id={id + '-email'}
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={busy}
          aria-describedby={error ? id + '-error' : undefined}
        />
        <label htmlFor={id + '-password'}>Password</label>
        <div className="password-control">
          <input
            id={id + '-password'}
            type={visible ? 'text' : 'password'}
            autoComplete={
              mode === 'register' ? 'new-password' : 'current-password'
            }
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={busy}
            aria-describedby={id + '-hint'}
          />
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            onClick={() => setVisible((v) => !v)}
            disabled={busy}
          >
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
        <p id={id + '-hint'} className="muted">
          {mode === 'register'
            ? 'Use at least 12 characters and a password you do not use elsewhere.'
            : 'Use the password you registered with.'}
        </p>
        {error && (
          <p id={id + '-error'} role="alert" className="error">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
        <a href={appPath('account/recovery')}>Forgot your password?</a>
        <div className="actions">
          <button className="primary" disabled={busy || !captchaReady}>
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in with email'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
              setMessage('')
              setPassword('')
              setVisible(false)
              section.current?.closest('dialog')?.scrollTo({ top: 0 })
            }}
          >
            {mode === 'login'
              ? 'New here? Create an account'
              : 'Already registered? Sign in'}
          </button>
        </div>
      </form>
    </section>
  )
}
