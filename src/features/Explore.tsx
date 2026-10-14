import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  ArrowUpRight,
  CircleHelp,
  Layers3,
  Users,
  BookOpen,
  X,
} from 'lucide-react'
import type { Community } from '../data/useCommunity'
import { visiblePost } from '../domain/ranking'
import { matchesSearch } from '../domain/search'
import { safeUrl } from '../domain/validation'
import { ProfileAvatar } from '../components/SocialShell'
export default function Explore({
  c,
  query,
  setQuery,
  searching = false,
}: {
  c: Community
  query: string
  setQuery: (s: string) => void
  searching?: boolean
}) {
  const [type, setType] = useState('All'),
    [stage, setStage] = useState(''),
    [unanswered, setUnanswered] = useState(false),
    [year, setYear] = useState('')
  const muted =
    c.data.preferences.find((p) => p.user_id === c.userId)?.muted ?? []
  const blocked = (id: string) =>
    c.data.blocks.some(
      (b) =>
        (b.user_id === c.userId && b.target_id === id) ||
        (b.target_id === c.userId && b.user_id === id),
    )
  const match = (
    text: string,
    id: string,
    entity: 'posts' | 'profiles' | 'projects' | 'papers',
  ) =>
    matchesSearch(
      text,
      query,
      id,
      c.searchResults
        ? { query: c.searchResults.query, ids: c.searchResults[entity] }
        : undefined,
    )
  const posts = c.data.posts.filter(
    (p) =>
      visiblePost(p, c.user, c.data) &&
      !p.tags.some((t) => muted.includes(t)) &&
      match([p.title, p.body, ...p.tags].join(' '), p.id, 'posts') &&
      (type !== 'Questions' || p.kind === 'question') &&
      (!unanswered ||
        (p.kind === 'question' && !p.accepted_answer_id && !p.resolution)),
  )
  const profiles = c.data.profiles.filter(
    (p) =>
      p.membership === 'approved' &&
      !p.suspended &&
      !blocked(p.id) &&
      (p.id === c.userId ||
        p.visibility === 'public' ||
        (p.visibility === 'members' &&
          c.user?.membership === 'approved' &&
          !c.user.suspended)) &&
      !p.interests.some((t) => muted.includes(t)) &&
      match(
        [p.name, p.methods, p.equipment, ...p.interests].join(' '),
        p.id,
        'profiles',
      ),
  )
  const projects = c.data.projects.filter(
    (p) =>
      !p.archived &&
      !blocked(p.owner_id) &&
      !p.tags.some((t) => muted.includes(t)) &&
      (p.visibility === 'public' ||
        p.owner_id === c.userId ||
        c.data.project_members.some(
          (m) => m.project_id === p.id && m.user_id === c.userId,
        )) &&
      (!stage || p.stage === stage) &&
      match(
        [p.title, p.problem, p.methods, p.equipment, ...p.tags].join(' '),
        p.id,
        'projects',
      ),
  )
  const papers = c.data.papers.filter(
    (p) =>
      (!year || p.published.startsWith(year)) &&
      match([p.title, p.doi, p.pmid, ...p.authors].join(' '), p.id, 'papers'),
  )
  return (
    <>
      <header className="section-heading">
        <span className="eyebrow">Follow your curiosity</span>
        <h1>
          Explore the circuit<span className="signal">.</span>
        </h1>
        <p>Find the ideas, methods, and people that move your work forward.</p>
      </header>
      <label className="explore-search">
        <Search size={21} />
        <input
          aria-label="Explore search"
          placeholder="Try a topic, method, project, or researcher"
          maxLength={200}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            aria-label="Clear explore search"
            onClick={() => setQuery('')}
          >
            <X size={17} />
          </button>
        )}
      </label>
      <div className="mode-tabs" role="group" aria-label="Search result types">
        {['All', 'Posts', 'Questions', 'Projects', 'Members', 'Papers'].map(
          (t) => (
            <button
              key={t}
              aria-pressed={type === t}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ),
        )}
      </div>
      {searching && (
        <p className="search-status" role="status">
          Searching accessible research…
        </p>
      )}
      {type === 'Projects' && (
        <label>
          Project stage
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option value="">All stages</option>
            {[...new Set(c.data.projects.map((p) => p.stage))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      )}
      {type === 'Questions' && (
        <label className="check">
          <input
            type="checkbox"
            checked={unanswered}
            onChange={(e) => setUnanswered(e.target.checked)}
          />
          Unanswered questions only
        </label>
      )}
      {type === 'Papers' && (
        <label>
          Publication year
          <input
            type="number"
            min={1600}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
      )}
      {(stage || unanswered || year) && (
        <button
          onClick={() => {
            setStage('')
            setUnanswered(false)
            setYear('')
          }}
        >
          Reset discovery filters
        </button>
      )}
      {!query && type === 'All' && (
        <section className="discovery-topics">
          <h2>Find your research circle</h2>
          <p className="muted">
            {c.data.taxonomy.length
              ? 'Browse the community taxonomy'
              : 'Topics will appear when the configured service returns them.'}
          </p>
          <div className="topic-tile-grid">
            {c.data.taxonomy
              .filter((t) => !muted.includes(t))
              .map((t, i) => (
                <button
                  className={'topic-tile tone-' + (i % 4)}
                  key={t}
                  onClick={() => setQuery(t)}
                >
                  <span className="topic-symbol">
                    <Layers3 size={20} />
                  </span>
                  <b>{t}</b>
                  <ArrowUpRight size={17} />
                </button>
              ))}
          </div>
        </section>
      )}
      {(type === 'All' || type === 'Posts' || type === 'Questions') && (
        <section className="discovery-section">
          <h2>
            <CircleHelp size={18} />
            {type === 'Questions' ? 'Questions' : 'Conversations & questions'}
          </h2>
          {posts.slice(0, 15).map((p) => (
            <article className="discovery-result" key={p.id}>
              <span className="figure-label">
                {p.kind.replaceAll('_', ' ')}
                {p.kind === 'question'
                  ? ' · ' +
                    (p.accepted_answer_id || p.resolution
                      ? 'Resolved'
                      : 'Open question')
                  : ''}
              </span>
              <h3>
                <Link to={'/post/' + p.id}>{p.title}</Link>
              </h3>
              <p className="clamp-copy">{p.body}</p>
              <div className="tags">
                {p.tags.slice(0, 3).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </article>
          ))}
          {!posts.length && (
            <p className="empty">
              No readable conversations match. Try another topic or{' '}
              <Link to="/feed">browse the feed</Link>.
            </p>
          )}
        </section>
      )}
      {(type === 'All' || type === 'Projects') && (
        <section className="discovery-section">
          <h2>
            <Layers3 size={18} />
            Projects & open work
          </h2>
          {projects.slice(0, 15).map((p) => (
            <article className="discovery-result" key={p.id}>
              <span className="status">
                {p.stage} · {p.visibility}
              </span>
              <h3>
                <Link to={'/project/' + p.id}>{p.title}</Link>
              </h3>
              <p>{p.problem}</p>
              <small>{p.needs || 'No collaborator request listed'}</small>
            </article>
          ))}
          {!projects.length && (
            <p className="empty">
              No accessible projects match.{' '}
              <Link to="/projects">Browse project discovery</Link>.
            </p>
          )}
        </section>
      )}
      {(type === 'All' || type === 'Members') && (
        <section className="discovery-section">
          <h2>
            <Users size={18} />
            People & complementary expertise
          </h2>
          {profiles.slice(0, 15).map((p) => (
            <article className="discovery-result member-result" key={p.id}>
              <ProfileAvatar name={p.name} id={p.id} />
              <div>
                <h3>
                  <Link to={'/member/' + p.id}>{p.name}</Link>
                </h3>
                <p>{p.methods || p.interests.join(' · ')}</p>
                <small>
                  {p.available ? 'Open to collaboration' : 'Researcher'} ·{' '}
                  {p.institution}
                </small>
              </div>
            </article>
          ))}
          {!profiles.length && (
            <p className="empty">
              No eligible visible profiles match.{' '}
              <Link to="/collaborators">Explore expertise</Link>.
            </p>
          )}
        </section>
      )}
      {(type === 'All' || type === 'Papers') && (
        <section className="discovery-section">
          <h2>
            <BookOpen size={18} />
            Sourced papers
          </h2>
          {papers.slice(0, 15).map((p) => (
            <article className="paper" key={p.id}>
              <span className="figure-label">
                {p.source} · Bibliographic metadata
              </span>
              <h3>{p.title}</h3>
              <p>
                {p.authors.join(', ')} · {p.published || 'Date unavailable'}
              </p>
              <p className="mono">{p.doi || p.pmid}</p>
              {safeUrl(p.source_url) && (
                <a
                  href={safeUrl(p.source_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Canonical source ↗
                </a>
              )}
            </article>
          ))}
          {!papers.length && (
            <div className="empty">
              <BookOpen size={26} />
              <h3>Start with a source.</h3>
              <p>
                No indexed papers match this view. Search Crossref or PubMed
                through Journal Club.
              </p>
              <Link to="/journal">Search scholarly sources →</Link>
            </div>
          )}
        </section>
      )}
      {query.length >= 2 && c.searchHasMore && (
        <button
          disabled={c.busy}
          onClick={() =>
            void c.search(query, new AbortController().signal, true)
          }
        >
          More search results
        </button>
      )}
    </>
  )
}
