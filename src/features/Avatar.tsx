import { useEffect, useState } from 'react'
import { isDemo, supabase } from '../data/gateway'
import type { Community } from '../data/useCommunity'
export default function Avatar({ c }: { c: Community }) {
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    if (!isDemo && supabase)
      void supabase.functions
        .invoke('avatar', { body: { operation: 'read', user_id: c.userId } })
        .then((r) => {
          if (active) setUrl(r.data?.url ?? '')
        })
    return () => {
      active = false
    }
  }, [c.userId, revision])
  return (
    <section>
      <h2>Profile image</h2>
      {url && (
        <img
          src={url}
          onError={() => setUrl('')}
          alt="Your profile avatar"
          width="96"
          height="96"
        />
      )}
      <p className="muted">
        PNG/JPEG, up to 5 MB. A configured first-party service decodes, resizes
        and strips metadata before private storage. Signed image links expire
        after one minute. Never upload patient images.
      </p>
      <label>
        Upload avatar
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={isDemo || busy || !supabase}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (
              file.size > 5 * 1024 * 1024 ||
              !['image/png', 'image/jpeg'].includes(file.type)
            ) {
              c.setError('Use a PNG or JPEG image under 5 MB')
              return
            }
            setBusy(true)
            const form = new FormData()
            form.append('file', file)
            try {
              const result = await supabase!.functions.invoke('avatar', {
                body: form,
              })
              if (result.error || !result.data?.saved)
                throw Error(
                  'Avatar was not saved. Check image validation and processor configuration.',
                )
              setRevision((v) => v + 1)
              c.setMessage('Processed avatar saved privately')
            } catch (e) {
              c.setError(
                e instanceof Error ? e.message : 'Avatar upload unavailable',
              )
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {isDemo && <p>Avatar storage is unavailable in synthetic demo mode.</p>}
      {!isDemo && (
        <div className="actions">
          <button disabled={busy} onClick={() => setRevision((v) => v + 1)}>
            Refresh image link
          </button>
          <button
            disabled={busy || !url}
            onClick={async () => {
              setBusy(true)
              try {
                const r = await supabase?.functions.invoke('avatar', {
                  body: { operation: 'delete' },
                })
                if (r?.error || !r?.data?.deleted)
                  throw Error('Avatar removal failed')
                setUrl('')
                c.setMessage('Avatar removed')
              } catch {
                c.setError('Avatar removal unavailable')
              } finally {
                setBusy(false)
              }
            }}
          >
            Remove avatar
          </button>
        </div>
      )}
    </section>
  )
}
