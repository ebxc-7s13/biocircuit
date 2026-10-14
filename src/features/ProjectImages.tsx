import { useEffect, useState } from 'react'
import { isDemo, supabase } from '../data/gateway'
import type { Community } from '../data/useCommunity'
import { safeUrl } from '../domain/validation'
interface ImageRecord {
  id: string
  user_id: string
  project_id: string
  created_at: string
}
export default function ProjectImages({
  c,
  id,
  owner,
}: {
  c: Community
  id: string
  owner: boolean
}) {
  const [files, setFiles] = useState<ImageRecord[]>([])
  const [busy, setBusy] = useState(false)
  const [more, setMore] = useState(false)
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const load = async (append = false) => {
    if (isDemo || !supabase) return
    setBusy(true)
    try {
      const r = await supabase.functions.invoke('project-images', {
        body: {
          operation: 'list',
          project_id: id,
          after_id: append ? files.at(-1)?.id : null,
        },
      })
      if (r.error) throw Error('Project images unavailable')
      const page = r.data.files as ImageRecord[]
      setFiles((old) =>
        append
          ? [...old, ...page.filter((x) => !old.some((y) => y.id === x.id))]
          : page,
      )
      setMore(page.length === 50)
      setError('')
    } catch {
      setError(
        'Project images unavailable. Check service configuration and membership.',
      )
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void load()
  }, [id, revision])
  return (
    <section>
      <h2>Private project images</h2>
      <p className="muted">
        Only active project members can access these images. PNG/JPEG under 5
        MB; decoded, stripped of metadata and normalized to at most 2048 pixels.
        Keep scientific originals separately. Do not upload patient-identifiable
        images. Project license and attribution notes apply.
      </p>
      <label>
        Add project image
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
              setError('Use PNG/JPEG under 5 MB')
              return
            }
            setBusy(true)
            try {
              const form = new FormData()
              form.append('file', file)
              form.append('project_id', id)
              form.append('request_id', crypto.randomUUID())
              const r = await supabase!.functions.invoke('project-images', {
                body: form,
              })
              if (r.error || !r.data.saved) throw Error('Image was not saved')
              setRevision((v) => v + 1)
              c.setMessage('Processed project image saved privately')
            } catch {
              setError(
                'Image was not saved. Configure the processor and check validation.',
              )
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {isDemo ? (
        <p>File persistence is unavailable in synthetic demo mode.</p>
      ) : (
        <button disabled={busy} onClick={() => void load()}>
          Refresh project images
        </button>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {files.map((file) => (
        <article key={file.id}>
          <p>Image · {new Date(file.created_at).toLocaleString()}</p>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                const r = await supabase!.functions.invoke('project-images', {
                  body: { operation: 'read', file_id: file.id },
                })
                const url = safeUrl(r.data?.url ?? '')
                if (r.error || !url) throw Error('Access refused')
                const a = document.createElement('a')
                a.href = url
                a.target = '_blank'
                a.rel = 'noopener noreferrer'
                a.click()
              } catch {
                setError('Image access unavailable')
              } finally {
                setBusy(false)
              }
            }}
          >
            Open image (60-second link)
          </button>
          {(owner || file.user_id === c.userId) && (
            <button
              disabled={busy}
              onClick={async () => {
                if (!confirm('Remove this project image?')) return
                setBusy(true)
                try {
                  const r = await supabase!.functions.invoke('project-images', {
                    body: { operation: 'delete', file_id: file.id },
                  })
                  if (r.error || !r.data.deleted) throw Error('Removal failed')
                  setRevision((v) => v + 1)
                } catch {
                  setError('Image removal unavailable')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Remove image
            </button>
          )}
        </article>
      ))}
      {more && (
        <button disabled={busy} onClick={() => void load(true)}>
          Load more project images
        </button>
      )}
      <p>
        PDFs and other document uploads remain disabled pending their
        validation/scanning service.
      </p>
    </section>
  )
}
