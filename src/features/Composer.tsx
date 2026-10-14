import { useEffect, useState } from 'react'
import type { Community } from '../data/useCommunity'
import type { Kind, Post } from '../domain/models'
import { tagsFrom, postSchema } from '../domain/validation'
import { Dialog } from '../components/Dialog'
import { isDemo } from '../data/gateway'
export default function Composer({
  c,
  onClose,
  initialKind = 'discussion',
  projectId = null,
  paperId = null,
  edit,
}: {
  c: Community
  onClose: () => void
  initialKind?: Kind
  projectId?: string | null
  paperId?: string | null
  edit?: Post
}) {
  const draftKey =
    'biocircuit-draft-' +
    (isDemo ? 'demo' : (c.userId ?? 'guest')) +
    (edit ? '-' + edit.id : '')
  const blank = {
    log_type: 'note',
    kind: initialKind,
    title: '',
    body: '',
    tags: '',
    visibility: 'public' as Post['visibility'],
    source_url: '',
    methods: '',
    tried: '',
    project_id: projectId,
    paper_id: paperId,
  }
  const [form, setForm] = useState<typeof blank>(() => {
    if (edit) return { ...blank, ...edit, tags: edit.tags.join(', ') }
    try {
      return {
        ...blank,
        ...(JSON.parse(localStorage.getItem(draftKey) || '{}') as Partial<
          typeof blank
        >),
      }
    } catch {
      return blank
    }
  })
  const [preview, setPreview] = useState(false)
  const [error, setError] = useState('')
  const [draftStatus, setDraftStatus] = useState('Local unsynced draft')
  const [requestId] = useState(() => crypto.randomUUID())
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form))
      setDraftStatus('Draft saved locally · not synced')
    } catch {
      setDraftStatus('Draft cannot be saved locally; keep this window open')
    }
  }, [form, draftKey])
  const field = (key: string, value: string | null) =>
    setForm((v) => ({ ...v, [key]: value }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = postSchema.safeParse({ ...form, tags: tagsFrom(form.tags) })
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join('; '))
      return
    }
    if (
      await c.action(
        edit ? 'edit_post' : 'post',
        { ...parsed.data, ...(edit ? { post_id: edit.id } : {}) },
        requestId,
      )
    ) {
      try {
        localStorage.removeItem(draftKey)
      } catch {
        /* no storage */
      }
      onClose()
    }
  }
  return (
    <Dialog
      title={edit ? 'Edit contribution' : 'Create a contribution'}
      onClose={onClose}
    >
      <p className="muted">{draftStatus}</p>
      <p className="notice">
        No patient-identifiable data, clinical records or unauthorized datasets.
        Cite sources and describe limitations.
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <label>
          Contribution type
          <select
            value={form.kind}
            onChange={(e) => field('kind', e.target.value)}
          >
            {[
              'discussion',
              'question',
              'project_update',
              'paper_discussion',
              'resource',
            ].map((k) => (
              <option key={k} value={k}>
                {
                  {
                    discussion: 'Research note',
                    question: 'Technical question',
                    project_update: 'Project update',
                    paper_discussion: 'Paper discussion',
                    resource: 'Resource or protocol',
                  }[k]
                }
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input
            autoFocus
            required
            minLength={8}
            maxLength={180}
            value={form.title}
            onChange={(e) => field('title', e.target.value)}
          />
        </label>
        <label>
          Context
          <textarea
            required
            minLength={20}
            maxLength={10000}
            rows={6}
            value={form.body}
            onChange={(e) => field('body', e.target.value)}
          />
        </label>
        <label>
          Topics, separated by commas
          <input
            required
            value={form.tags}
            maxLength={480}
            onChange={(e) => field('tags', e.target.value)}
          />
        </label>
        <div className="two-col">
          <label>
            Visibility
            <select
              value={form.visibility}
              onChange={(e) => field('visibility', e.target.value)}
            >
              <option value="public">Public</option>
              <option value="members">Eligible members</option>
              <option value="private">Private draft-like note</option>
            </select>
          </label>
          <label>
            Source URL (HTTPS)
            <input
              type="url"
              value={form.source_url}
              onChange={(e) => field('source_url', e.target.value)}
            />
          </label>
        </div>
        {form.kind === 'question' && (
          <>
            <label>
              Methods / environment
              <textarea
                value={form.methods}
                maxLength={3000}
                onChange={(e) => field('methods', e.target.value)}
              />
            </label>
            <label>
              What you tried / reproducible steps
              <textarea
                value={form.tried}
                maxLength={3000}
                onChange={(e) => field('tried', e.target.value)}
              />
            </label>
          </>
        )}
        {form.kind === 'project_update' && (
          <label>
            Log type
            <select
              aria-label="Log type"
              value={form.log_type}
              onChange={(e) => field('log_type', e.target.value)}
            >
              {['note', 'milestone', 'blocker', 'experiment', 'lesson'].map(
                (k) => (
                  <option key={k}>{k}</option>
                ),
              )}
            </select>
          </label>
        )}
        {form.kind === 'project_update' && (
          <label>
            Project
            <select
              required
              value={form.project_id ?? ''}
              onChange={(e) => field('project_id', e.target.value || null)}
            >
              <option value="">Choose project</option>
              {c.data.projects
                .filter((p) =>
                  c.data.project_members.some(
                    (m) => m.project_id === p.id && m.user_id === c.userId,
                  ),
                )
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
            </select>
          </label>
        )}
        {form.kind === 'paper_discussion' && (
          <p className="muted">
            Use headings for Claims, Methods, Limitations, Reproducibility,
            Practical impact and Questions. This is member interpretation,
            separate from bibliographic facts.
          </p>
        )}
        <p className="muted">
          PDF and document attachments remain disabled pending
          validation/scanning. Member-scoped image uploads are available through
          project workspaces when the image processor and private Storage are
          configured.
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="actions">
          <button type="button" onClick={() => setPreview(!preview)}>
            {preview ? 'Hide preview' : 'Preview'}
          </button>
          <button
            className="primary"
            disabled={
              c.busy || c.user?.membership !== 'approved' || c.user?.suspended
            }
            type="submit"
          >
            {c.busy ? 'Publishing…' : edit ? 'Save edits' : 'Publish'}
          </button>
        </div>
        {c.user?.membership !== 'approved' && (
          <p>Approved membership is required to publish.</p>
        )}
        {preview && (
          <article>
            <h3>{form.title}</h3>
            <p className="body-text">{form.body}</p>
          </article>
        )}
      </form>
    </Dialog>
  )
}
