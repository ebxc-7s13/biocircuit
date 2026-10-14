import { Dialog } from '../components/Dialog'
import { useEffect, useState } from 'react'
import { isDemo, supabase } from '../data/gateway'
import type { Community } from '../data/useCommunity'
export default function Trust({ c }: { c: Community }) {
  const roles = (c.user?.suspended ? [] : c.data.roles)
    .filter((r) => r.user_id === c.userId)
    .map((r) => r.role)
  const [health, setHealth] = useState<Record<string, number> | null>(null)
  const [healthError, setHealthError] = useState('')
  const admin = roles.includes('admin')
  useEffect(() => {
    let active = true
    if (admin && !isDemo && supabase)
      void supabase.rpc('community_health').then((r) => {
        if (active) {
          if (r.error) setHealthError('Community health unavailable')
          else setHealth(r.data)
        }
      })
    return () => {
      active = false
    }
  }, [admin, c.data])
  const [queue, setQueue] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confirmation, setConfirmation] = useState<{
    type: string
    payload: Record<string, unknown>
  } | null>(null)
  const confirmAction = (type: string, payload: Record<string, unknown>) => {
    c.setError('')
    setConfirmation({ type, payload })
  }
  const [reason, setReason] = useState('')
  const [topic, setTopic] = useState('')
  const [points, setPoints] = useState(20)
  if (!roles.length)
    return (
      <>
        <h1>Trust console</h1>
        <p role="alert">
          Access denied. A server-assigned reviewer, moderator or administrator
          role is required.
        </p>
      </>
    )
  return (
    <>
      <span className="eyebrow">Least privilege / Recorded decisions</span>
      <h1>
        Trust & review<span className="signal">.</span>
      </h1>
      <p>
        Signed in with roles: {roles.join(', ')}. Every decision requires a
        reason and is recorded by the server.
      </p>
      <div className="review-toolbar">
        <label>
          Review queue
          <select value={queue} onChange={(e) => setQueue(e.target.value)}>
            <option value="all">All authorized queues</option>
            {(roles.includes('reviewer') || admin) && (
              <option value="academic">Academic eligibility</option>
            )}
            {(roles.includes('moderator') || admin) && (
              <option value="moderation">Content & appeals</option>
            )}
            {(roles.includes('metadata_editor') ||
              roles.includes('moderator') ||
              admin) && <option value="sources">Scholarly corrections</option>}
            {admin && <option value="admin">Administration</option>}
            <option value="audit">Authorized audit trail</option>
          </select>
        </label>
        <label>
          Academic status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All active reviews</option>
            <option value="pending">Pending</option>
            <option value="needs_evidence">Needs clarification</option>
            <option value="appeal">Appeal requested</option>
          </select>
        </label>
      </div>
      <label>
        Decision reason (minimum 5 characters)
        <textarea
          required
          minLength={5}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      {(roles.includes('reviewer') || roles.includes('admin')) &&
        (queue === 'all' || queue === 'academic') && (
          <>
            <h2>Academic review & appeals</h2>
            {!c.data.applications.some(
              (a) =>
                ['pending', 'appeal', 'needs_evidence'].includes(a.status) &&
                (statusFilter === 'all' || a.status === statusFilter),
            ) && (
              <p className="empty">
                No active academic applications match this queue.
              </p>
            )}
            {c.data.applications
              .filter(
                (a) =>
                  ['pending', 'appeal', 'needs_evidence'].includes(a.status) &&
                  (statusFilter === 'all' || a.status === statusFilter),
              )
              .map((a) => (
                <article key={a.id}>
                  <span className="figure-label">{a.status}</span>
                  <h3>{a.institution}</h3>
                  <p>
                    {a.degree} · {a.discipline} · {a.result_status} · {a.year}
                  </p>
                  <p>
                    {a.private_marks
                      ? 'Optional private marks supplied; not an approval criterion.'
                      : 'No marks collected'}
                  </p>
                  <p>{a.reason}</p>
                  <div className="actions">
                    {['approved', 'rejected', 'needs_evidence', 'expired'].map(
                      (status) => (
                        <button
                          key={status}
                          disabled={
                            c.busy ||
                            reason.length < 5 ||
                            a.user_id === c.userId
                          }
                          onClick={() =>
                            confirmAction('review', {
                              application_id: a.id,
                              status,
                              reason,
                            })
                          }
                        >
                          {status.replaceAll('_', ' ')}
                        </button>
                      ),
                    )}
                  </div>
                </article>
              ))}
          </>
        )}
      {(roles.includes('moderator') || roles.includes('admin')) &&
        (queue === 'all' || queue === 'moderation') && (
          <>
            <h2>Content appeals</h2>
            {!c.data.appeals.some((a) => a.status === 'pending') && (
              <p className="empty">No content appeals awaiting review.</p>
            )}
            {c.data.appeals
              .filter((a) => a.status === 'pending')
              .map((a) => (
                <article key={a.id}>
                  <h3>Appeal for contribution {a.post_id}</h3>
                  <p>{a.reason}</p>
                  <div className="actions">
                    <button
                      disabled={c.busy || reason.length < 5}
                      onClick={() =>
                        confirmAction('resolve_content_appeal', {
                          appeal_id: a.id,
                          accept: true,
                          reason,
                        })
                      }
                    >
                      Accept appeal & restore
                    </button>
                    <button
                      disabled={c.busy || reason.length < 5}
                      onClick={() =>
                        confirmAction('resolve_content_appeal', {
                          appeal_id: a.id,
                          accept: false,
                          reason,
                        })
                      }
                    >
                      Reject appeal
                    </button>
                  </div>
                </article>
              ))}
            <h2>Reports, corrections & takedowns</h2>
            {!c.data.reports.some((r) => r.status === 'open') && (
              <p className="empty">No open content reports.</p>
            )}
            {c.data.reports
              .filter((r) => r.status === 'open')
              .map((r) => (
                <article key={r.id}>
                  <h3>
                    {c.data.posts.find((p) => p.id === r.post_id)?.title ??
                      'Reported content'}
                  </h3>
                  <p>{r.reason}</p>
                  <div className="actions">
                    <button
                      disabled={reason.length < 5 || c.busy}
                      onClick={() =>
                        confirmAction('moderate', {
                          post_id: r.post_id,
                          report_id: r.id,
                          state: 'removed',
                          reason,
                        })
                      }
                    >
                      Remove content
                    </button>
                    <button
                      disabled={reason.length < 5 || c.busy}
                      onClick={() =>
                        confirmAction('moderate', {
                          post_id: r.post_id,
                          report_id: r.id,
                          state: 'published',
                          reason,
                        })
                      }
                    >
                      Dismiss report
                    </button>
                  </div>
                </article>
              ))}
          </>
        )}
      {roles.includes('admin') && (queue === 'all' || queue === 'admin') && (
        <>
          <h2>Community health</h2>
          {isDemo ? (
            <p>Live operational aggregates require a connected database.</p>
          ) : health ? (
            <dl>
              {Object.entries(health).map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replaceAll('_', ' ')}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p>{healthError || 'Loading database aggregates…'}</p>
          )}
          <h2>Taxonomy & contribution rules</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void c.action('taxonomy', { name: topic, reason })
            }}
          >
            <label>
              New topic
              <input
                value={topic}
                maxLength={60}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>
            <button disabled={c.busy || reason.length < 5 || !topic}>
              Add topic
            </button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void c.action('point_rule', { points, reason })
            }}
          >
            <label>
              Accepted answer points (0–100)
              <input
                type="number"
                min={0}
                max={100}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
              />
            </label>
            <button disabled={c.busy || reason.length < 5}>
              Update future awards
            </button>
          </form>
          <h2>Account restrictions</h2>
          {c.data.profiles
            .filter((p) => p.id !== c.userId)
            .map((p) => (
              <div className="list-row" key={p.id}>
                {p.name}
                <button
                  disabled={reason.length < 5 || c.busy}
                  onClick={() =>
                    confirmAction('suspend', {
                      target_id: p.id,
                      suspended: !p.suspended,
                      reason,
                    })
                  }
                >
                  {p.suspended ? 'Reinstate' : 'Suspend'}
                </button>
              </div>
            ))}
        </>
      )}
      {(roles.includes('metadata_editor') ||
        roles.includes('moderator') ||
        roles.includes('admin')) &&
        (queue === 'all' || queue === 'sources') && (
          <section>
            <h2>Scholarly corrections & takedowns</h2>
            {!c.data.paper_reports.some((r) => r.status === 'open') && (
              <p className="empty">No open source correction requests.</p>
            )}
            {c.data.paper_reports
              .filter((r) => r.status === 'open')
              .map((r) => (
                <article key={r.id}>
                  <h3>{r.paper_id}</h3>
                  <p>{r.reason}</p>
                  <button
                    disabled={c.busy || reason.length < 5}
                    onClick={() =>
                      void c.action('review_paper_report', {
                        report_id: r.id,
                        reason,
                      })
                    }
                  >
                    Record source review & close
                  </button>
                </article>
              ))}
          </section>
        )}
      {(queue === 'all' || queue === 'audit') && (
        <>
          <h2>Audit trail</h2>
          {!c.data.audit.length && (
            <p className="empty">No authorized audit entries returned.</p>
          )}
          {c.data.audit.map((a) => (
            <article key={a.id}>
              <b>{a.action}</b>
              <p>
                Target {a.target_id} · {a.reason}
              </p>
              <small>{new Date(a.created_at).toLocaleString()}</small>
            </article>
          ))}
        </>
      )}
      {confirmation && (
        <Dialog
          title="Confirm review decision"
          onClose={() => setConfirmation(null)}
        >
          <p>
            This {confirmation.type.replaceAll('_', ' ')} action will be
            recorded with your reviewer identity and reason.
          </p>
          <blockquote>{String(confirmation.payload.reason ?? '')}</blockquote>
          {c.error && (
            <p className="error" role="alert">
              {c.error}
            </p>
          )}
          <div className="actions">
            <button onClick={() => setConfirmation(null)}>Cancel</button>
            <button
              className="primary"
              disabled={c.busy}
              onClick={async () => {
                if (await c.action(confirmation.type, confirmation.payload))
                  setConfirmation(null)
              }}
            >
              Confirm & record decision
            </button>
          </div>
        </Dialog>
      )}
      <p>
        Reviewer assignments require a trusted database administrator. Clients
        cannot self-assign roles.
      </p>
    </>
  )
}
