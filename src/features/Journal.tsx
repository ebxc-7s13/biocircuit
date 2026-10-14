import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Community } from '../data/useCommunity'
import { Dialog } from '../components/Dialog'
import type { Paper } from '../domain/models'
import { searchPapers } from '../data/scholarly'
import { PaperMetadataCard } from '../components/PaperMetadataCard'
const Composer = lazy(() => import('./Composer'))
export default function Journal({
  c,
  query = '',
}: {
  c: Community
  query?: string
}) {
  const [report, setReport] = useState<Paper | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [provider, setProvider] = useState('Crossref')
  const [searched, setSearched] = useState(false)
  const [q, setQ] = useState(query)
  useEffect(() => {
    if (query) setQ(query)
  }, [query])
  const [year, setYear] = useState('')
  const [papers, setPapers] = useState<Paper[]>([])
  const [cursor, setCursor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Paper | null>(null)
  useEffect(() => {
    setCursor('')
    setSearched(false)
  }, [q, year, provider])
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  const search = async (more = false) => {
    controller.current?.abort()
    const ac = new AbortController()
    controller.current = ac
    setLoading(true)
    setError('')
    try {
      const r = await searchPapers(
        q,
        more ? cursor : '*',
        ac.signal,
        year,
        provider,
      )
      if (ac.signal.aborted) return
      setSearched(true)
      setPapers((prev) =>
        more
          ? [
              ...prev,
              ...r.papers.filter((p) => !prev.some((x) => x.doi === p.doi)),
            ]
          : r.papers,
      )
      setCursor(r.cursor)
    } catch (e) {
      if (!ac.signal.aborted)
        setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      if (!ac.signal.aborted) setLoading(false)
    }
  }
  const discuss = async (p: Paper) => {
    if (await c.action('paper', { paper: p })) setSelected(p)
  }
  const card = (p: Paper) => (
    <PaperMetadataCard
      key={p.id}
      p={p}
      c={c}
      onDiscuss={(p) => void discuss(p)}
      onReport={(p) => {
        setReport(p)
        setReportReason('')
      }}
    />
  )
  return (
    <>
      <header className="section-heading">
        <span className="eyebrow">Research has provenance</span>
        <h1>
          Journal club<span className="signal">.</span>
        </h1>
        <p>
          Sourced bibliographic facts. Clearly separated community
          interpretation.
        </p>
      </header>
      <form
        className="scholarly-search-form"
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
      >
        <label>
          Title, author, topic, DOI or PMID
          <input
            required
            minLength={3}
            maxLength={200}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          Source
          <select
            aria-label="Scholarly source"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value)
              setCursor('')
            }}
          >
            <option>Crossref</option>
            <option>PubMed</option>
          </select>
        </label>
        <label>
          Published year
          <input
            type="number"
            min={1600}
            max={new Date().getFullYear() + 1}
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </label>
        <button className="primary" disabled={loading}>
          {loading ? 'Searching…' : 'Search ' + provider}
        </button>
      </form>
      <p className="muted">
        Crossref / PubMed metadata, cached by the server. No publisher scraping,
        full-text redistribution or AI summaries.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {papers.filter((p) => !year || p.published.startsWith(year)).map(card)}
      {searched &&
        !loading &&
        !papers.filter((p) => !year || p.published.startsWith(year)).length && (
          <p className="empty">
            No records match this page. Try another query or continue to the
            next page.
          </p>
        )}
      {cursor && (
        <button disabled={loading} onClick={() => void search(true)}>
          Next scholarly page
        </button>
      )}
      {!searched && !error && (
        <div className="journal-start">
          <h2>A good discussion starts with the source.</h2>
          <p>
            Search a title, DOI, PMID, topic, or author. Bibliographic facts
            stay distinct from community interpretation.
          </p>
        </div>
      )}
      <h2>Your saved scholarly records</h2>
      {c.data.papers
        .filter((p) =>
          c.data.paper_saves.some(
            (s) => s.user_id === c.userId && s.paper_id === p.id,
          ),
        )
        .map(card)}
      <h2>Indexed scholarly discovery</h2>
      {query &&
        c.data.papers
          .filter((p) =>
            [p.title, p.doi, p.pmid, ...p.authors]
              .join(' ')
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map(card)}
      {!c.data.paper_saves.some((x) => x.user_id === c.userId) && (
        <div className="empty">
          No scholarly records saved yet. Live search requires the deployed
          scholarly proxy.
        </div>
      )}
      <h2>Community journal discussions</h2>
      {c.data.posts
        .filter((p) => p.kind === 'paper_discussion')
        .map((p) => (
          <p key={p.id}>
            <Link to={'/post/' + p.id}>{p.title}</Link>
          </p>
        ))}
      {report && (
        <Dialog
          title="Report scholarly metadata"
          onClose={() => setReport(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              if (
                await c.action('paper_report', {
                  paper_id: report.id,
                  reason: reportReason,
                })
              )
                setReport(null)
            }}
          >
            <p>
              Source: {report.source} · {report.title}
            </p>
            <label>
              Correction / retraction / IP concern
              <textarea
                required
                minLength={5}
                maxLength={1000}
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </label>
            <p>
              Do not include private evidence or patient information. Source
              metadata is not silently changed by members.
            </p>
            <button disabled={c.busy}>Submit scholarly report</button>
          </form>
        </Dialog>
      )}
      {selected && (
        <Suspense fallback={<p>Opening journal editor…</p>}>
          <Composer
            c={c}
            initialKind="paper_discussion"
            paperId={selected.id}
            onClose={() => setSelected(null)}
          />
        </Suspense>
      )}
    </>
  )
}
