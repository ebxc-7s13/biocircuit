import { useEffect, useRef, useState } from 'react'
import type { Community } from '../data/useCommunity'
import { getClient, isDemo, supabase } from '../data/gateway'
import {
  applicationSchema,
  phoneSchema,
  profileSchema,
} from '../domain/validation'
import { Dialog } from '../components/Dialog'
import { topics } from '../domain/models'
import EmailAuth from './EmailAuth'
import { appPath } from '../domain/paths'
import { startGithubSignIn } from '../domain/oauth'
declare global {
  interface Window {
    hcaptcha?: {
      render: (el: HTMLElement, options: Record<string, unknown>) => string
      remove: (id: string) => void
      reset: (id: string) => void
    }
  }
}
function Captcha({
  onToken,
  resetKey,
}: {
  onToken: (token: string) => void
  resetKey: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (widgetRef.current) window.hcaptcha?.reset(widgetRef.current)
  }, [resetKey])
  const sitekey = import.meta.env.VITE_HCAPTCHA_SITE_KEY
  useEffect(() => {
    if (!sitekey) return
    let widget: string | undefined
    let disposed = false
    const render = () => {
      if (!disposed && ref.current && window.hcaptcha)
        widget = widgetRef.current = window.hcaptcha.render(ref.current, {
          sitekey,
          callback: onToken,
          'expired-callback': () => onToken(''),
        })
    }
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-captcha]',
    )
    if (window.hcaptcha) render()
    else {
      if (!script) {
        script = document.createElement('script')
        script.dataset.captcha = 'true'
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
        script.async = true
        document.head.append(script)
      }
      script.addEventListener('load', render)
    }
    return () => {
      disposed = true
      script?.removeEventListener('load', render)
      if (widget) window.hcaptcha?.remove(widget)
    }
  }, [sitekey, onToken])
  return sitekey ? (
    <div ref={ref} />
  ) : (
    <p className="notice">
      OTP sign-in requires CAPTCHA setup before launch. Set the public hCaptcha
      site key and configure its secret in Supabase Auth.
    </p>
  )
}
export default function Auth({
  c,
  onClose,
}: {
  c: Community
  onClose: () => void
}) {
  const [captchaReset, setCaptchaReset] = useState(0)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [attempts, setAttempts] = useState(0)
  const tokenCallback = useRef((v: string) => setCaptcha(v))
  useEffect(() => {
    if (!cooldown) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])
  const send = async () => {
    if (isDemo) {
      setError(
        'Demo mode never sends or verifies an OTP. Use the clearly labelled synthetic participants below.',
      )
      return
    }
    if (!supabase || !captcha) {
      setError('Auth service or anti-abuse challenge is not configured.')
      return
    }
    const p = phoneSchema.safeParse(phone.replace(/\s/g, ''))
    if (!p.success) {
      setError(p.error.issues[0].message)
      return
    }
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      phone: p.data,
      options: { captchaToken: captcha, shouldCreateUser: true },
    })
    setBusy(false)
    setCaptcha('')
    setCaptchaReset((v) => v + 1)
    if (error) {
      setError(
        'The code could not be requested. Please wait before trying again.',
      )
      setCooldown(60)
      return
    }
    setSent(true)
    setCooldown(60)
    setAttempts(0)
  }
  const verify = async () => {
    if (!supabase || !/^\d{6}$/.test(otp) || attempts >= 5) return
    setBusy(true)
    setAttempts(attempts + 1)
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.replace(/\s/g, ''),
      token: otp,
      type: 'sms',
    })
    setBusy(false)
    if (error) {
      setError(
        'Code unavailable, invalid or expired. Request another after the cooldown.',
      )
      return
    }
    await c.load()
    setError('')
    setSent(false)
  }
  return (
    <Dialog title="Account & academic eligibility" onClose={onClose}>
      <ol className="auth-steps" aria-label="Account progress">
        {['Identity check', 'Academic details', 'Eligibility review'].map(
          (step, index) => (
            <li
              key={step}
              aria-current={
                (c.user?.membership === 'approved' ? 2 : c.userId ? 1 : 0) ===
                index
                  ? 'step'
                  : undefined
              }
            >
              <span aria-hidden="true">{index + 1}</span>
              <b>{step}</b>
            </li>
          ),
        )}
      </ol>
      {isDemo && (
        <div className="notice">
          <b>Isolated demo, no identity verification.</b>
          <p>
            Switch synthetic participants to test replies and collaboration.
            Academic status here is a fixture, never a credential.
          </p>
          <label>
            Demo participant
            <select
              value={c.userId ?? ''}
              onChange={(e) => c.setUserId(e.target.value)}
            >
              {c.data.profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      {!c.userId && !isDemo && (
        <>
          <div className="notice">
            <b>Join with GitHub to participate.</b>
            <p>
              During this public preview, signing in with GitHub verifies your
              identity and approves membership automatically, so you can post,
              reply and collaborate. Email accounts can browse and edit their
              profile; using the same email on GitHub links them.
            </p>
            <button
              type="button"
              className="primary"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                setError('')
                void (async () => {
                  const client = await getClient().catch(() => null)
                  const result = client ? await startGithubSignIn(client) : null
                  // Success navigates away to GitHub; only failures return here.
                  if (!result || result.error) {
                    setBusy(false)
                    setError('GitHub sign-in is unavailable right now.')
                  }
                })()
              }}
            >
              Continue with GitHub
            </button>
          </div>
          <EmailAuth
            onAuthenticated={c.load}
            captchaToken={captcha}
            captchaReady={!import.meta.env.VITE_HCAPTCHA_SITE_KEY || !!captcha}
            onChallengeUsed={() => {
              setCaptcha('')
              setCaptchaReset((v) => v + 1)
            }}
          />
          {!!import.meta.env.VITE_HCAPTCHA_SITE_KEY && (
            <Captcha onToken={tokenCallback.current} resetKey={captchaReset} />
          )}
          <details className="phone-auth">
            <summary>Phone sign-in and verification</summary>
            <p>
              A phone OTP confirms control of a number. Academic eligibility
              requires a separate review.
            </p>
            <label>
              Mobile number with country code
              <input
                autoComplete="tel"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+ country code and number"
                disabled={sent}
              />
            </label>
            {!import.meta.env.VITE_HCAPTCHA_SITE_KEY && (
              <Captcha
                onToken={tokenCallback.current}
                resetKey={captchaReset}
              />
            )}
            <button
              className="primary"
              disabled={busy || cooldown > 0 || !supabase || !captcha}
              onClick={() => void send()}
            >
              {cooldown
                ? 'Resend in ' + cooldown + 's'
                : sent
                  ? 'Resend code'
                  : 'Send OTP'}
            </button>
            {sent && (
              <>
                <label>
                  Six-digit SMS code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </label>
                <button
                  disabled={busy || otp.length !== 6 || attempts >= 5}
                  onClick={() => void verify()}
                >
                  Verify phone
                </button>
                <button
                  onClick={() => {
                    setSent(false)
                    setOtp('')
                  }}
                >
                  Change number
                </button>
                {attempts >= 5 && (
                  <p>
                    Attempt limit reached. Request a new code after the
                    cooldown.
                  </p>
                )}
              </>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
          </details>
        </>
      )}
      {c.userId && (
        <>
          <p>
            Phone:{' '}
            {c.user?.phone_verified
              ? 'Verified by Auth provider'
              : isDemo
                ? 'Not verified · demo'
                : c.user
                  ? 'Not verified'
                  : 'Verification information loading'}
          </p>
          <p>
            Academic eligibility: <b>{c.user?.membership ?? 'Not submitted'}</b>
            {c.user?.suspended ? ' · Account restricted' : ''}
          </p>
          {c.user?.phone_verified || isDemo ? (
            <Onboarding key={c.userId} c={c} />
          ) : (
            <div className="notice">
              <b>Signed in; phone verification still required.</b>
              <p>
                You can edit your own profile in Settings. Posting, replies,
                reactions, bookmarks and projects need approved membership.
                Email registration grants neither. During the public preview,
                sign out and use <b>Continue with GitHub</b> (with the same
                email) to verify and join.
              </p>
              <a href={appPath('settings')} onClick={onClose}>
                Open profile and account settings
              </a>
            </div>
          )}
        </>
      )}
      <p className="muted">
        Only biomedical engineering degree pathways are eligible. Combined or
        ambiguous degrees receive manual review. Exact grades are optional,
        private and never used for ranking. Credential document upload is
        disabled pending reviewed document validation/scanning and private
        reviewer access.
      </p>
    </Dialog>
  )
}
function Onboarding({ c }: { c: Community }) {
  const u = c.user
  const draftKey = 'biocircuit-onboarding-' + c.userId
  const [draft] = useState(() => {
    try {
      const raw = JSON.parse(
        sessionStorage.getItem(draftKey) ?? '{}',
      ) as Record<string, unknown>
      return Object.fromEntries(
        Object.entries(raw).filter(
          ([k, v]) =>
            [
              'name',
              'handle',
              'institution',
              'degree',
              'discipline',
              'status',
            ].includes(k) && typeof v === 'string',
        ),
      ) as Record<string, string>
    } catch {
      return {}
    }
  })
  const [name, setName] = useState(draft.name ?? u?.name ?? '')
  const [handle, setHandle] = useState(draft.handle ?? u?.handle ?? '')
  const [institution, setInstitution] = useState(
    draft.institution ?? u?.institution ?? '',
  )
  const [degree, setDegree] = useState(draft.degree ?? 'B.Tech / BE')
  const [discipline, setDiscipline] = useState(
    draft.discipline ?? 'Biomedical Engineering',
  )
  const [status, setStatus] = useState(draft.status ?? 'currently_enrolled')
  const [year, setYear] = useState(new Date().getFullYear())
  const [marks, setMarks] = useState('')
  const [interests, setInterests] = useState(u?.interests ?? [])
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const app = c.data.applications.find((a) => a.user_id === c.userId)
  const [appeal, setAppeal] = useState('')
  useEffect(() => {
    try {
      sessionStorage.setItem(
        draftKey,
        JSON.stringify({
          name,
          handle,
          institution,
          degree,
          discipline,
          status,
        }),
      )
    } catch {
      /* Draft recovery unavailable. */
    }
  }, [draftKey, name, handle, institution, degree, discipline, status])
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consent) {
      setError('Read and acknowledge the community and privacy rules.')
      return
    }
    const p = profileSchema.safeParse({
      name,
      handle,
      institution,
      degree,
      bio: u?.bio ?? '',
      methods: u?.methods ?? '',
      equipment: u?.equipment ?? '',
      interests,
      available: u?.available ?? false,
      visibility: u?.visibility ?? 'members',
    })
    const a = applicationSchema.safeParse({
      institution,
      degree,
      discipline,
      result_status: status,
      year,
      private_marks: marks,
    })
    if (!p.success || !a.success) {
      setError(
        [
          ...(p.success ? [] : p.error.issues),
          ...(a.success ? [] : a.error.issues),
        ]
          .map((i) => i.message)
          .join('; '),
      )
      return
    }
    if (await c.action('profile', p.data)) {
      if (await c.action('application', a.data)) {
        setMarks('')
        setError('')
        try {
          sessionStorage.removeItem(draftKey)
        } catch {
          /* No sensitive draft saved. */
        }
      }
    }
  }
  if (u?.membership === 'approved')
    return (
      <p className="notice">
        {isDemo
          ? 'Synthetic member fixture. No real academic review occurred.'
          : 'Your academic eligibility was approved. Public profile fields can be edited in Workspace.'}
      </p>
    )
  if (app && ['pending', 'appeal'].includes(app.status))
    return (
      <div className="notice">
        <h3>Application under review</h3>
        <p>
          {app.reason ||
            'An authorized reviewer will review your biomedical pathway. No member access has been granted.'}
        </p>
      </div>
    )
  return (
    <>
      {app && (
        <p className="notice">
          Decision: {app.status} · {app.reason}
        </p>
      )}
      <p className="muted">
        Basic eligibility fields recover in this browser tab. Marks, OTPs,
        consent and phone numbers are never saved in a draft.
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <label>
          Preferred name
          <input
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Handle (lowercase, digits, underscores)
          <input
            required
            pattern="[a-z0-9_]{3,32}"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </label>
        <label>
          Institution
          <input
            required
            maxLength={160}
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </label>
        <label>
          Degree pathway
          <select value={degree} onChange={(e) => setDegree(e.target.value)}>
            {[
              'B.Tech / BE',
              'M.Tech / ME / MS',
              'PhD',
              'Equivalent / combined',
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Discipline / full degree title
          <input
            required
            maxLength={200}
            value={discipline}
            onChange={(e) => setDiscipline(e.target.value)}
          />
        </label>
        <div className="two-col">
          <label>
            Education / result status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="currently_enrolled">Currently enrolled</option>
              <option value="completed">Completed</option>
              <option value="awaiting_results">Awaiting results</option>
            </select>
          </label>
          <label>
            Expected / graduation year
            <input
              type="number"
              min={1950}
              max={new Date().getFullYear() + 10}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          Marks / CGPA (optional and private)
          <input
            maxLength={40}
            value={marks}
            onChange={(e) => setMarks(e.target.value)}
          />
        </label>
        <fieldset>
          <legend>Research interests</legend>
          {topics.map((t) => (
            <label className="check" key={t}>
              <input
                type="checkbox"
                checked={interests.includes(t)}
                onChange={() =>
                  setInterests((v) =>
                    v.includes(t) ? v.filter((x) => x !== t) : v.concat(t),
                  )
                }
              />
              {t}
            </label>
          ))}
        </fieldset>
        <label className="check">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
          />
          I have read the privacy and community rules and will not upload
          patient-identifiable data.
        </label>
        <a href={appPath('policies')} target="_blank" rel="noopener noreferrer">
          Privacy and community rules
        </a>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="primary" disabled={c.busy}>
          Submit for academic review
        </button>
      </form>
      {app && ['rejected', 'expired'].includes(app.status) && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void c.action('appeal', { reason: appeal })
          }}
        >
          <label>
            Appeal reason
            <textarea
              required
              minLength={5}
              maxLength={1000}
              value={appeal}
              onChange={(e) => setAppeal(e.target.value)}
            />
          </label>
          <button disabled={c.busy}>Request appeal</button>
        </form>
      )}
    </>
  )
}
