import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getClient } from '../data/gateway'
import { takeOAuthArrival } from '../domain/oauth'
import { appPath } from '../domain/paths'

// Taken once per page load, so a remount cannot adopt the tokens twice.
let pending: Promise<boolean> | null = null
function adopt(): Promise<boolean> {
  pending ??= (async () => {
    const arrival = takeOAuthArrival()
    if (!arrival.tokens || arrival.error || !arrival.startedHere) return false
    const client = await getClient()
    if (!client) return false
    const verified = await client.auth.getUser(arrival.tokens.accessToken)
    if (verified.error || !verified.data.user) return false
    const adopted = await client.auth.setSession({
      access_token: arrival.tokens.accessToken,
      refresh_token: arrival.tokens.refreshToken,
    })
    return !adopted.error && adopted.data.user?.id === verified.data.user.id
  })().catch(() => false)
  return pending
}

export default function OAuthCallback() {
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    void adopt().then((ok) => {
      if (!active) return
      if (ok) navigate('/feed', { replace: true })
      else setFailed(true)
    })
    return () => {
      active = false
    }
  }, [navigate])
  return (
    <section className="email-auth" aria-labelledby="oauth-title">
      <span className="eyebrow">Account security</span>
      <h1 id="oauth-title">Signing you in</h1>
      {failed ? (
        <>
          <p role="alert" className="error">
            GitHub sign-in could not be completed. Start again from this
            browser.
          </p>
          <a href={appPath('feed')}>Return to feed</a>
        </>
      ) : (
        <p role="status">Confirming your GitHub sign-in…</p>
      )}
    </section>
  )
}
