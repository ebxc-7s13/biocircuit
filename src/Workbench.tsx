import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  BrowserRouter,
  Link,
  useLocation,
  useNavigate,
  useNavigationType,
} from 'react-router-dom'
import { useReducedMotion } from 'motion/react'
import { useCommunity } from './data/useCommunity'
import { isDemo, configured } from './data/gateway'
import { Dialog } from './components/Dialog'
import {
  SidebarNavigation,
  TopBar,
  MobileBottomNavigation,
  RightRail,
  Navigation,
  destinations,
} from './components/SocialShell'
import AmbientField from './components/AmbientField'
import Feed from './features/Feed'
import Auth from './features/Auth'
import type { Kind } from './domain/models'
import { basePath } from './domain/paths'
const Projects = lazy(() => import('./features/Projects'))
const Journal = lazy(() => import('./features/Journal'))
const Recovery = lazy(() => import('./features/Recovery'))
const Account = lazy(() => import('./features/Account'))
const Member = lazy(() => import('./features/Member'))
const Trust = lazy(() => import('./features/Trust'))
const Explore = lazy(() => import('./features/Explore'))
const Composer = lazy(() => import('./features/Composer'))
export default function App() {
  return (
    <BrowserRouter basename={basePath || undefined}>
      <Workbench />
    </BrowserRouter>
  )
}
function Workbench() {
  const c = useCommunity(),
    location = useLocation(),
    navigate = useNavigate()
  const base = '/' + location.pathname.split('/')[1]
  const navigationType = useNavigationType()
  const scrollPositions = useRef(new Map<string, number>())
  useEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = previous
    }
  }, [])
  useLayoutEffect(() => {
    window.scrollTo({
      top:
        navigationType === 'POP'
          ? (scrollPositions.current.get(location.key) ?? 0)
          : 0,
      behavior: 'instant',
    })
    const remember = () =>
      scrollPositions.current.set(location.key, window.scrollY)
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [location.key, navigationType])
  const [compose, setCompose] = useState<Kind | null>(null),
    [auth, setAuth] = useState(false),
    [help, setHelp] = useState(false),
    [menu, setMenu] = useState(false),
    [query, setQuery] = useState(''),
    [searching, setSearching] = useState(false),
    [offline, setOffline] = useState(!navigator.onLine)
  const suppressSearchNavigationFocus = useRef(false)
  const search = useRef<HTMLInputElement>(null),
    reduced = useReducedMotion()
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('biocircuit-theme') ?? 'dark'
    } catch {
      return 'dark'
    }
  })
  const [paused, setPaused] = useState(() => {
    try {
      return localStorage.getItem('biocircuit-motion') === 'off'
    } catch {
      return false
    }
  })
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0b0d12' : '#f2f4f9')
    try {
      localStorage.setItem('biocircuit-theme', theme)
    } catch {
      /* optional */
    }
  }, [theme])
  useEffect(() => {
    document.documentElement.dataset.motion = paused || reduced ? 'off' : 'on'
    try {
      localStorage.setItem('biocircuit-motion', paused ? 'off' : 'on')
    } catch {
      /* optional */
    }
  }, [paused, reduced])
  useEffect(() => {
    const on = () => setOffline(!navigator.onLine)
    window.addEventListener('online', on)
    window.addEventListener('offline', on)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', on)
    }
  }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest(
          'input,textarea,select,[contenteditable],dialog',
        ) ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey
      )
        return
      if (e.key === '/') {
        e.preventDefault()
        search.current?.focus()
      }
      if (e.key.toLowerCase() === 'c') setCompose('discussion')
      if (e.key === '?') setHelp(true)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (c.loading) return
    const ac = new AbortController()
    if (base === '/post' || base === '/project')
      void c.enrich(
        base === '/post' ? 'post' : 'project',
        location.pathname.split('/')[2],
        ac.signal,
      )
    return () => {
      ac.abort()
      c.clearDetail()
    }
  }, [base, location.pathname, c.loading])
  useEffect(() => {
    const ac = new AbortController()
    setSearching(query.trim().length >= 2)
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        await c.search(query.trim(), ac.signal)
        if (!ac.signal.aborted) setSearching(false)
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      ac.abort()
    }
  }, [query])
  const title =
    destinations.find((s) => s.path === base)?.label ??
    {
      '/account': 'Account recovery',
      '/profile': 'Your profile',
      '/settings': 'Settings',
      '/post': 'Discussion',
      '/project': 'Project workspace',
      '/member': 'Researcher profile',
      '/trust': 'Trust & review',
      '/policies': 'Community & privacy',
      '/': 'Welcome',
    }[base] ??
    'BioCircuit'
  useEffect(() => {
    document.title = 'BioCircuit · ' + title
    if (
      !suppressSearchNavigationFocus.current &&
      document.activeElement !== search.current &&
      !document.querySelector('dialog[open]')
    )
      document.getElementById('main')?.focus({ preventScroll: true })
    suppressSearchNavigationFocus.current = false
  }, [location.pathname, title])
  const create = () => {
    if (base === '/projects') navigate('/projects?create=1')
    else
      setCompose(
        base === '/questions'
          ? 'question'
          : base === '/journal'
            ? 'paper_discussion'
            : 'discussion',
      )
  }
  const accountProps = { c, query, theme, setTheme, paused, setPaused }
  const content =
    location.pathname === '/account/recovery' ? (
      <Recovery />
    ) : base === '/feed' || base === '/questions' ? (
      <Feed
        c={c}
        query={query}
        questions={base === '/questions'}
        onCompose={setCompose}
      />
    ) : base === '/explore' ? (
      <Explore c={c} query={query} setQuery={setQuery} searching={searching} />
    ) : base === '/projects' ? (
      <Projects c={c} query={query} />
    ) : base === '/journal' ? (
      <Journal c={c} query={query} />
    ) : base === '/post' ? (
      <Feed c={c} query="" detailId={location.pathname.split('/')[2]} />
    ) : base === '/project' ? (
      <Projects c={c} query="" detailId={location.pathname.split('/')[2]} />
    ) : base === '/member' ? (
      <Member c={c} id={location.pathname.split('/')[2]} />
    ) : base === '/trust' ? (
      <Trust c={c} />
    ) : [
        '/profile',
        '/collaborators',
        '/settings',
        '/notifications',
        '/saved',
        '/policies',
      ].includes(base) ? (
      <Account {...accountProps} kind={base.slice(1)} />
    ) : location.pathname === '/' ? (
      <Landing onJoin={() => setAuth(true)} />
    ) : (
      <div className="empty">
        <h1>Page not found</h1>
        <p>This research route is unavailable.</p>
        <Link to="/feed">Return to the feed</Link>
      </div>
    )
  return (
    <div className="social-app">
      <a className="skip-link" href="#main">
        Skip to research content
      </a>
      <AmbientField paused={paused || !!reduced} />
      <SidebarNavigation
        base={base}
        c={c}
        theme={theme}
        setTheme={setTheme}
        onAuth={() => setAuth(true)}
        onCreate={create}
        onHelp={() => setHelp(true)}
      />
      <div className="social-workspace">
        <TopBar
          title={title}
          paused={paused || !!reduced}
          reduced={!!reduced}
          onMotion={() => setPaused((v) => !v)}
          c={c}
          query={query}
          setQuery={(v) => {
            setQuery(v)
            if (base !== '/explore' && v) {
              suppressSearchNavigationFocus.current = true
              navigate('/explore')
            }
          }}
          search={search}
          onCreate={create}
          onAuth={() => setAuth(true)}
          onMenu={() => setMenu(true)}
        />
        <div className="social-grid">
          <main
            id="main"
            tabIndex={-1}
            className={'page-column page-' + base.slice(1)}
          >
            <div
              className={'connection ' + (isDemo ? 'demo' : '')}
              role="status"
            >
              {isDemo
                ? 'DEMO · synthetic research and local persistence · no SMS or academic verification'
                : configured
                  ? 'Connected backend · membership review required'
                  : 'SETUP REQUIRED · production backend is not configured'}
              {offline ? ' · Offline' : ''}
            </div>
            {c.error && (
              <div role="alert" className="error">
                <span>{c.error}</span>
                <button onClick={() => void c.load()}>Retry load</button>
                <button
                  aria-label="Dismiss error"
                  onClick={() => c.setError('')}
                >
                  ×
                </button>
              </div>
            )}
            <Suspense
              fallback={
                <div className="skeleton" role="status">
                  Opening research…
                </div>
              }
            >
              {/* Recovery holds its one-time session in memory and needs no community
                  data; never unmount it while a sign-in reloads that data. */}
              {c.loading && location.pathname !== '/account/recovery' ? (
                <div className="skeleton" role="status">
                  Loading research…
                </div>
              ) : (
                content
              )}
            </Suspense>
          </main>
          {base !== '/trust' && <RightRail c={c} base={base} />}
        </div>
      </div>
      <MobileBottomNavigation base={base} onCreate={create} />
      {c.message && (
        <div className="toast" role="status">
          {c.message}
          <button aria-label="Dismiss message" onClick={() => c.setMessage('')}>
            ×
          </button>
        </div>
      )}
      {compose && (
        <Suspense fallback={<p role="status">Opening composer…</p>}>
          <Composer
            c={c}
            initialKind={compose}
            onClose={() => setCompose(null)}
          />
        </Suspense>
      )}
      {auth && <Auth c={c} onClose={() => setAuth(false)} />}
      {menu && (
        <Dialog title="Your community" onClose={() => setMenu(false)}>
          <Navigation base={base} c={c} onSelect={() => setMenu(false)} />
          <div className="menu-links">
            <Link to="/profile" onClick={() => setMenu(false)}>
              Your profile
            </Link>
            <Link to="/settings" onClick={() => setMenu(false)}>
              Settings
            </Link>
            {!c.user?.suspended &&
              c.data.roles.some((r) => r.user_id === c.userId) && (
                <Link to="/trust" onClick={() => setMenu(false)}>
                  Trust & review
                </Link>
              )}
            <Link to="/policies" onClick={() => setMenu(false)}>
              Privacy & community rules
            </Link>
            <button
              onClick={() => {
                setMenu(false)
                setAuth(true)
              }}
            >
              Account & eligibility
            </button>
            <button
              aria-label="Keyboard shortcuts"
              onClick={() => {
                setMenu(false)
                setHelp(true)
              }}
            >
              Keyboard shortcuts
            </button>
          </div>
        </Dialog>
      )}
      {help && (
        <Dialog title="Keyboard & navigation" onClose={() => setHelp(false)}>
          <p>
            <kbd>/</kbd> Search · <kbd>C</kbd> Compose · <kbd>?</kbd> Shortcuts.
            Shortcuts pause while typing.
          </p>
          <p>
            Browse with the sidebar or mobile bottom navigation. Every page
            scrolls vertically. Use Tab to move between controls, Enter to
            activate, and Escape to close a dialog.
          </p>
        </Dialog>
      )}
    </div>
  )
}
function Landing({ onJoin }: { onJoin: () => void }) {
  return (
    <>
      <span className="eyebrow">Biomedical engineering, together</span>
      <h1>
        Good science
        <br />
        rarely happens alone<span className="signal">.</span>
      </h1>
      <p className="lead">
        A research workbench for technical questions, honest project logs,
        papers with provenance and the people who help you move forward.
      </p>
      <div className="actions">
        <button className="primary" onClick={onJoin}>
          Join the community
        </button>
        <button onClick={onJoin}>Sign in</button>
        <Link to="/feed">Explore research</Link>
      </div>
      <div className="editorial-grid">
        <article>
          <span className="figure-label">01 / Get unstuck</span>
          <h2>Questions worth solving.</h2>
          <p>
            Describe methods, share what you tried, and close the loop with an
            accepted answer.
          </p>
          <Link to="/questions">Explore questions →</Link>
        </article>
        <article>
          <span className="figure-label">02 / Show the process</span>
          <h2>Work in progress.</h2>
          <p>
            Milestones, blockers and lessons belong in a project’s evidence
            trail.
          </p>
          <Link to="/projects">Open projects →</Link>
        </article>
        <article>
          <span className="figure-label">03 / Read together</span>
          <h2>Beyond the abstract.</h2>
          <p>
            Find sourced metadata and distinguish scientific claims from
            community interpretation.
          </p>
          <Link to="/journal">Open journal club →</Link>
        </article>
      </div>
      <h2>Across the biomedical engineering bench.</h2>
      <p>
        Explore biomedical imaging, bioinstrumentation, biosignal processing,
        biomechanics, biomaterials, tissue engineering, rehabilitation
        engineering, medical devices, computational biology and AI, clinical
        engineering, and regulatory translation.
      </p>
      <h2>Eligibility is a process, not a badge.</h2>
      <p>
        For biomedical engineering undergraduate, postgraduate and doctoral
        pathways, including current students and result-awaiting applicants.
        Ambiguous and combined programs receive manual review. Phone access and
        academic eligibility are separate. Marks are optional and private; no
        grade threshold or institutional endorsement.
      </p>
      <Link to="/policies">
        Read privacy, eligibility and community standards before joining →
      </Link>
    </>
  )
}
