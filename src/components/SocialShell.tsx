import { Link } from 'react-router-dom'
import type { RefObject } from 'react'
import {
  Activity,
  Home,
  Compass,
  CircleHelp,
  Layers3,
  BookOpen,
  Users,
  Bookmark,
  Bell,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  Menu,
  Sun,
  Moon,
  ArrowUpRight,
  FlaskConical,
  Pause,
  Play,
} from 'lucide-react'
import type { Community } from '../data/useCommunity'
import { isDemo } from '../data/gateway'
import { safeUrl } from '../domain/validation'
export const destinations = [
  { path: '/feed', label: 'Research feed', icon: Home },
  { path: '/explore', label: 'Explore', icon: Compass },
  { path: '/questions', label: 'Questions', icon: CircleHelp },
  { path: '/projects', label: 'Projects', icon: Layers3 },
  { path: '/journal', label: 'Journal club', icon: BookOpen },
  { path: '/collaborators', label: 'Collaborators', icon: Users },
  { path: '/saved', label: 'Saved', icon: Bookmark },
  { path: '/notifications', label: 'Notifications', icon: Bell },
]
export function Brand() {
  return (
    <Link to="/feed" className="brand" aria-label="BioCircuit home">
      <span className="brand-mark">
        <Activity size={23} />
      </span>
      <span>
        bio<strong>circuit</strong>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  )
}
export function ProfileAvatar({
  name,
  id = '',
  large = false,
}: {
  name: string
  id?: string
  large?: boolean
}) {
  const tone = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4
  return (
    <span
      className={'avatar avatar-tone-' + tone + (large ? ' avatar-large' : '')}
      aria-hidden="true"
    >
      {name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  )
}
export function Navigation({
  base,
  c,
  onSelect,
}: {
  base: string
  c: Community
  onSelect?: () => void
}) {
  return (
    <nav aria-label="Research destinations">
      {destinations.map((s) => (
        <Link
          key={s.path}
          to={s.path}
          onClick={onSelect}
          className={base === s.path ? 'active' : ''}
          aria-current={base === s.path ? 'page' : undefined}
        >
          <s.icon size={20} />
          <span>{s.label}</span>
          {s.path === '/notifications' &&
            c.data.notifications.some(
              (n) => n.user_id === c.userId && !n.read,
            ) && (
              <span className="notification-dot" aria-label="Unread activity" />
            )}
        </Link>
      ))}
    </nav>
  )
}
export function SidebarNavigation({
  base,
  c,
  theme,
  setTheme,
  onAuth,
  onCreate,
  onHelp,
}: {
  base: string
  c: Community
  theme: string
  setTheme: (s: string) => void
  onAuth: () => void
  onCreate: () => void
  onHelp: () => void
}) {
  return (
    <aside className="sidebar">
      <Brand />
      <p className="brand-caption">Where research connects.</p>
      <Navigation base={base} c={c} />
      <button className="primary sidebar-create" onClick={onCreate}>
        <Plus size={19} />
        Create a post
      </button>
      <div className="sidebar-bottom">
        <div className="sidebar-tools">
          <Link to="/settings">
            <Settings size={18} />
            Settings
          </Link>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={onHelp} aria-label="Keyboard shortcuts">
            <CircleHelp size={18} />
          </button>
        </div>
        {!c.user?.suspended &&
          c.data.roles.some((r) => r.user_id === c.userId) && (
            <Link to="/trust" className="trust-link">
              <ShieldCheck size={17} />
              Trust & review
            </Link>
          )}
        <Link to="/policies" className="policy-link">
          Privacy & community rules
        </Link>
        <div className="sidebar-profile">
          <ProfileAvatar name={c.user?.name ?? 'Guest'} id={c.userId ?? ''} />
          <Link to="/profile">
            <b>{c.user?.name ?? 'Your profile'}</b>
            <small>
              {isDemo
                ? 'Synthetic participant'
                : c.user
                  ? 'Your research identity'
                  : 'Join the community'}
            </small>
          </Link>
          <button aria-label="Account & eligibility" onClick={onAuth}>
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </aside>
  )
}
export function TopBar({
  paused,
  reduced,
  onMotion,
  title,
  c,
  query,
  setQuery,
  search,
  onCreate,
  onAuth,
  onMenu,
}: {
  paused: boolean
  reduced: boolean
  onMotion: () => void
  title: string
  c: Community
  query: string
  setQuery: (s: string) => void
  search: RefObject<HTMLInputElement | null>
  onCreate: () => void
  onAuth: () => void
  onMenu: () => void
}) {
  const unread = c.data.notifications.filter(
    (n) => n.user_id === c.userId && !n.read,
  ).length
  return (
    <header className="top-bar">
      <div className="desktop-context">
        <span className="context-dot" />
        <b>{title}</b>
      </div>
      <div className="mobile-brand">
        <Brand />
      </div>
      <label className="global-search">
        <Search size={18} />
        <input
          ref={search}
          list="research-topic-suggestions"
          aria-label="Search community"
          placeholder="Search research, people, ideas…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button
            aria-label="Clear community search"
            onClick={() => setQuery('')}
          >
            ×
          </button>
        ) : (
          <kbd>/</kbd>
        )}
        <datalist id="research-topic-suggestions">
          {c.data.taxonomy.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </label>
      <button
        className="ambient-toggle icon-button"
        aria-label={
          reduced
            ? 'Ambient motion reduced by device preference'
            : paused
              ? 'Resume ambient motion'
              : 'Pause ambient motion'
        }
        aria-pressed={paused}
        disabled={reduced}
        onClick={onMotion}
        title={
          reduced
            ? 'Reduced motion is enabled'
            : paused
              ? 'Resume ambient motion'
              : 'Pause ambient motion'
        }
      >
        {paused ? <Play size={17} /> : <Pause size={17} />}
      </button>
      <button className="top-create" aria-label="Contribute" onClick={onCreate}>
        <Plus size={19} />
        <span>Create</span>
      </button>
      <Link
        className="icon-button notification-shortcut"
        to="/notifications"
        aria-label={
          'Notifications' + (unread ? ' · ' + unread + ' unread' : '')
        }
      >
        <Bell size={20} />
        {unread > 0 && <span className="notification-dot" />}
      </Link>
      <button
        className="account-button"
        aria-label={c.user?.name ?? 'Join the community'}
        onClick={onAuth}
      >
        <ProfileAvatar name={c.user?.name ?? 'Join'} id={c.userId ?? ''} />
        <span>{c.user?.name ?? 'Join'}</span>
      </button>
      <button
        className="mobile-menu icon-button"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <Menu size={21} />
      </button>
    </header>
  )
}
export function MobileBottomNavigation({
  base,
  onCreate,
}: {
  base: string
  onCreate: () => void
}) {
  return (
    <nav className="mobile-bottom" aria-label="Mobile primary navigation">
      {[
        { path: '/feed', label: 'Feed', icon: Home },
        { path: '/explore', label: 'Explore', icon: Compass },
      ].map((s) => (
        <Link
          key={s.path}
          to={s.path}
          aria-current={base === s.path ? 'page' : undefined}
        >
          <s.icon size={22} />
          <span>{s.label}</span>
        </Link>
      ))}
      <button onClick={onCreate} aria-label="Create a post">
        <span className="mobile-create">
          <Plus size={25} />
        </span>
        <span>Create</span>
      </button>
      {[
        { path: '/projects', label: 'Projects', icon: Layers3 },
        { path: '/profile', label: 'Profile', icon: Users },
      ].map((s) => (
        <Link
          key={s.path}
          to={s.path}
          aria-current={base === s.path ? 'page' : undefined}
        >
          <s.icon size={22} />
          <span>{s.label}</span>
        </Link>
      ))}
    </nav>
  )
}
export function RightRail({ c, base }: { c: Community; base: string }) {
  const muted =
    c.data.preferences.find((p) => p.user_id === c.userId)?.muted ?? []
  const blocked = (id: string) =>
    c.data.blocks.some(
      (b) =>
        (b.user_id === c.userId && b.target_id === id) ||
        (b.target_id === c.userId && b.user_id === id),
    )
  const candidates = c.data.profiles
    .filter(
      (p) =>
        p.id !== c.userId &&
        p.membership === 'approved' &&
        !p.suspended &&
        !blocked(p.id) &&
        !p.interests.some((t) => muted.includes(t)) &&
        (p.visibility === 'public' ||
          (p.visibility === 'members' &&
            c.user?.membership === 'approved' &&
            !c.user.suspended)),
    )
    .sort(
      (a, b) =>
        b.interests.filter((t) => c.user?.interests.includes(t)).length -
        a.interests.filter((t) => c.user?.interests.includes(t)).length,
    )
    .slice(0, 3)
  const paper = c.data.papers.find((p) => safeUrl(p.source_url))
  return (
    <aside className="right-rail" aria-label="Community context">
      <section className="rail-section">
        <div className="rail-heading">
          <h2>People to connect with</h2>
          <Link to="/collaborators" aria-label="Explore collaborators">
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <p className="rail-intro">Complementary interests. New perspectives.</p>
        {c.loading ? (
          <p className="muted">Loading profiles…</p>
        ) : candidates.length ? (
          candidates.map((p) => (
            <div className="suggested-member" key={p.id}>
              <ProfileAvatar name={p.name} id={p.id} />
              <div>
                <Link to={'/member/' + p.id}>
                  <b>{p.name}</b>
                </Link>
                <small>
                  {p.interests[0] ?? 'Research interests not listed'}
                </small>
                <small>
                  {isDemo
                    ? 'Demo participant'
                    : p.available
                      ? 'Open to collaboration'
                      : 'Researcher'}
                </small>
              </div>
              <button
                disabled={
                  c.busy ||
                  !c.userId ||
                  c.user?.membership !== 'approved' ||
                  c.user.suspended
                }
                aria-label={
                  (c.data.follows.some(
                    (f) => f.user_id === c.userId && f.target_id === p.id,
                  )
                    ? 'Unfollow '
                    : 'Follow ') + p.name
                }
                onClick={() => void c.action('follow', { target_id: p.id })}
              >
                {c.data.follows.some(
                  (f) => f.user_id === c.userId && f.target_id === p.id,
                )
                  ? 'Following'
                  : 'Follow'}
              </button>
            </div>
          ))
        ) : (
          <p className="muted">
            No eligible profiles returned yet. Try expertise discovery.
          </p>
        )}
      </section>
      <section className="rail-section">
        <div className="rail-heading">
          <h2>Research topics</h2>
          <FlaskConical size={18} />
        </div>
        <p className="rail-intro">
          {isDemo ? 'Editorial demo taxonomy' : 'Community taxonomy'} · explore
          your interests
        </p>
        <div className="rail-topics">
          {c.data.taxonomy
            .filter((t) => !muted.includes(t))
            .slice(0, 5)
            .map((t) => (
              <Link key={t} to={'/feed?topic=' + encodeURIComponent(t)}>
                <span className="topic-node" />
                {t}
                <ArrowUpRight size={14} />
              </Link>
            ))}
        </div>
        <Link className="text-link" to="/explore">
          Explore all topics →
        </Link>
      </section>
      {paper ? (
        <section className="rail-section source-spotlight">
          <span className="figure-label">
            {paper.source} · sourced metadata
          </span>
          <h2>{paper.title}</h2>
          <p>{paper.venue || 'Venue unavailable'}</p>
          <a
            href={safeUrl(paper.source_url)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open canonical source ↗
          </a>
        </section>
      ) : (
        <section className="journal-invite">
          <span className="invite-icon">
            <BookOpen size={22} />
          </span>
          <h2>
            Read it. Question it.
            <br />
            Discuss it together.
          </h2>
          <p>
            Find a paper and bring the methods, limitations, and questions to
            your circle.
          </p>
          <Link to="/journal">
            Visit journal club <ArrowUpRight size={16} />
          </Link>
          <small>Live search needs the configured source proxy.</small>
        </section>
      )}
      <section className="rail-footer">
        <p>Good science starts with good questions.</p>
        <Link to="/policies">Community guidelines</Link>
        <span> · </span>
        <Link to="/policies">Privacy</Link>
        <small>BioCircuit · biomedical engineering</small>
        {base === '/profile' && !c.user && (
          <Link to="/">Learn about eligibility</Link>
        )}
      </section>
    </aside>
  )
}
