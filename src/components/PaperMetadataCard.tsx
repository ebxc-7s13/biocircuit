import { BookOpen, Bookmark, ExternalLink } from 'lucide-react'
import type { Paper } from '../domain/models'
import type { Community } from '../data/useCommunity'
import { safeUrl } from '../domain/validation'
export function PaperMetadataCard({
  p,
  c,
  onDiscuss,
  onReport,
}: {
  p: Paper
  c: Community
  onDiscuss?: (p: Paper) => void
  onReport?: (p: Paper) => void
}) {
  const saved = c.data.paper_saves.some(
    (s) => s.user_id === c.userId && s.paper_id === p.id,
  )
  return (
    <article className="paper">
      <div className="paper-provenance">
        <BookOpen size={18} />
        <span>{p.source} · Bibliographic metadata</span>
      </div>
      <h2>{p.title}</h2>
      <p className="paper-authors">
        {p.authors.join(', ') || 'Authors unavailable'}
      </p>
      <p>
        {p.venue || 'Venue unavailable'} ·{' '}
        {p.published || 'Publication date unavailable'}
      </p>
      <div className="paper-identifiers">
        <span className="mono">
          DOI: {p.doi || 'Unavailable'}
          {p.pmid ? ' · PMID: ' + p.pmid : ''}
        </span>
        <small>Retrieved {new Date(p.retrieved_at).toLocaleString()}</small>
      </div>
      <p className="muted">
        Abstract / full text: check the canonical source; availability and
        rights vary.
      </p>
      {p.correction && <p className="notice">{p.correction}</p>}
      <div className="actions">
        {safeUrl(p.source_url) && (
          <a
            href={safeUrl(p.source_url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={15} />
            Canonical record
          </a>
        )}
        <button
          disabled={
            c.busy || c.user?.membership !== 'approved' || c.user.suspended
          }
          onClick={() =>
            void c.action(saved ? 'unsave_paper' : 'paper', {
              paper: p,
              paper_id: p.id,
            })
          }
        >
          <Bookmark size={15} />
          {saved ? 'Unsave scholarly record' : 'Save scholarly record'}
        </button>
        {onDiscuss && (
          <button
            className="primary"
            disabled={
              c.busy || c.user?.membership !== 'approved' || c.user.suspended
            }
            onClick={() => onDiscuss(p)}
          >
            Create journal discussion
          </button>
        )}
        {onReport && (
          <button
            className="paper-report"
            disabled={
              c.busy || c.user?.membership !== 'approved' || c.user.suspended
            }
            onClick={() => onReport(p)}
          >
            Report metadata issue
          </button>
        )}
      </div>
    </article>
  )
}
