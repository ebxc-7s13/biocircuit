import { matchesSearch } from '../domain/search'
import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Community } from '../data/useCommunity'
import { topics } from '../domain/models'
import { profileSchema, phoneSchema } from '../domain/validation'
import { isDemo, resetDemo, signOut, supabase } from '../data/gateway'
import Feed from './Feed'
import Avatar from './Avatar'
import { ProfileAvatar } from '../components/SocialShell'
import { PaperMetadataCard } from '../components/PaperMetadataCard'
import type { Paper } from '../domain/models'
const Composer = lazy(() => import('./Composer'))
export default function Account({
  c,
  kind,
  query,
  theme,
  setTheme,
  paused,
  setPaused,
}: {
  c: Community
  kind: string
  query: string
  theme: string
  setTheme: (v: string) => void
  paused: boolean
  setPaused: (v: boolean) => void
}) {
  const [savedType, setSavedType] = useState('Posts')
  const [savedPaper, setSavedPaper] = useState<Paper | null>(null)
  const [appealReason, setAppealReason] = useState('')
  const [edit, setEdit] = useState(false)
  const [available, setAvailable] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [changing, setChanging] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const u = c.user
  const pref = c.data.preferences.find((p) => p.user_id === c.userId)
  const total =
    c.data.contribution_total ??
    c.data.contributions
      .filter((x) => x.user_id === c.userId && x.valid)
      .reduce((v, x) => v + x.points, 0)
  const exportData = async () => {
    try {
      let personal: unknown
      if (isDemo)
        personal = {
          profile: u,
          applications: c.data.applications.filter(
            (x) => x.user_id === c.userId,
          ),
          posts: c.data.posts.filter((x) => x.author_id === c.userId),
          comments: c.data.comments.filter((x) => x.author_id === c.userId),
          notifications: c.data.notifications.filter(
            (x) => x.user_id === c.userId,
          ),
          preferences: pref,
          projects: c.data.projects.filter((x) => x.owner_id === c.userId),
          collaborations: c.data.collaborations.filter(
            (x) => x.sender_id === c.userId,
          ),
        }
      else {
        if (!supabase) throw Error('Backend missing')
        const { data, error } = await supabase.rpc('export_personal_data')
        if (error) throw Error('Data export failed')
        personal = data
      }
      const blob = new Blob([JSON.stringify(personal, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'biocircuit-personal-export.json'
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      c.setMessage(
        isDemo
          ? 'Exported synthetic local data'
          : 'Personal data export downloaded',
      )
    } catch (e) {
      c.setError(e instanceof Error ? e.message : 'Export failed')
    }
  }
  if (kind === 'saved') {
    const papers = c.data.papers.filter((p) =>
      c.data.paper_saves.some(
        (s) => s.user_id === c.userId && s.paper_id === p.id,
      ),
    )
    return (
      <>
        <header className="section-heading">
          <span className="eyebrow">Keep the useful things close</span>
          <h1>
            Your saved research<span className="signal">.</span>
          </h1>
          <p>Conversations to return to. Papers to read more closely.</p>
        </header>
        <div className="mode-tabs" role="group" aria-label="Saved content">
          <button
            aria-pressed={savedType === 'Posts'}
            onClick={() => setSavedType('Posts')}
          >
            Posts
          </button>
          <button
            aria-pressed={savedType === 'Papers'}
            onClick={() => setSavedType('Papers')}
          >
            Papers
          </button>
        </div>
        {savedType === 'Posts' ? (
          <Feed c={c} query={query} saved />
        ) : papers.length ? (
          papers.map((p) => (
            <PaperMetadataCard
              key={p.id}
              p={p}
              c={c}
              onDiscuss={setSavedPaper}
            />
          ))
        ) : (
          <div className="empty">
            <h2>Your reading list starts here.</h2>
            <p>No scholarly records saved yet.</p>
            <Link to="/journal">Discover a paper →</Link>
          </div>
        )}
        {savedPaper && (
          <Suspense fallback={<p role="status">Opening paper discussion…</p>}>
            <Composer
              c={c}
              initialKind="paper_discussion"
              paperId={savedPaper.id}
              onClose={() => setSavedPaper(null)}
            />
          </Suspense>
        )}
        <Link to="/explore">Explore more research →</Link>
      </>
    )
  }

  if (kind === 'policies') return <Policies />
  if (kind === 'notifications')
    return (
      <>
        <span className="eyebrow">Your research circle</span>
        <h1>
          Notifications<span className="signal">.</span>
        </h1>
        <button
          disabled={c.busy}
          onClick={() => void c.action('read_notifications', {})}
        >
          Mark all as read
        </button>
        {c.data.notifications
          .filter((n) => n.user_id === c.userId)
          .map((n) => (
            <article
              className={n.read ? 'notification' : 'notification unread'}
              key={n.id}
            >
              <span className="figure-label">
                {n.category} · {n.read ? 'Read' : 'Unread'}
              </span>
              <p>{n.text}</p>
              <Link to={n.path}>Open related workspace →</Link>
              <small>{new Date(n.created_at).toLocaleString()}</small>
            </article>
          ))}
        {c.data.own_removed.length > 0 && (
          <section>
            <h2>Moderation decisions & appeals</h2>
            <label>
              Appeal reason
              <textarea
                minLength={5}
                maxLength={1000}
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
              />
            </label>
            {c.data.own_removed
              .filter((p) =>
                c.data.posts.some(
                  (post) => post.id === p.id && post.author_id === c.userId,
                ),
              )
              .map((p) => (
                <article key={p.id}>
                  <h3>{p.title}</h3>
                  <p>{p.reason}</p>
                  {c.data.appeals.some((a) => a.post_id === p.id) ? (
                    c.data.appeals
                      .filter((a) => a.post_id === p.id)
                      .map((a) => (
                        <p key={a.id}>
                          {a.status} · {a.review_reason}
                        </p>
                      ))
                  ) : (
                    <button
                      disabled={c.busy || appealReason.length < 5}
                      onClick={() =>
                        void c.action('appeal_content', {
                          post_id: p.id,
                          reason: appealReason,
                        })
                      }
                    >
                      Request moderation appeal
                    </button>
                  )}
                </article>
              ))}
          </section>
        )}
        {!c.data.notifications.some((n) => n.user_id === c.userId) && (
          <div className="empty">
            No notifications. Only actual recorded events appear here.
          </div>
        )}
      </>
    )
  if (kind === 'collaborators') {
    const list = c.data.profiles.filter(
      (p) =>
        p.membership === 'approved' &&
        !p.suspended &&
        (p.id === c.userId ||
          p.visibility === 'public' ||
          (p.visibility === 'members' && c.user?.membership === 'approved')) &&
        (!available || p.available) &&
        !c.data.blocks.some(
          (b) =>
            (b.user_id === c.userId && b.target_id === p.id) ||
            (b.target_id === c.userId && b.user_id === p.id),
        ) &&
        matchesSearch(
          [p.name, p.methods, p.equipment, p.institution, ...p.interests].join(
            ' ',
          ),
          query,
          p.id,
          c.searchResults
            ? { query: c.searchResults.query, ids: c.searchResults.profiles }
            : undefined,
        ),
    )
    return (
      <>
        <span className="eyebrow">Tools, methods, complementary expertise</span>
        <h1>
          Find your people<span className="signal">.</span>
        </h1>
        <label className="check">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => setAvailable(e.target.checked)}
          />
          Available for collaboration
        </label>
        {query.length >= 2 && c.searchHasMore && (
          <button
            onClick={() =>
              void c.search(query, new AbortController().signal, true)
            }
          >
            More search results
          </button>
        )}
        {!isDemo && query.length < 2 && c.discoveryHasMore.profiles && (
          <button disabled={c.busy} onClick={() => void c.discover('profiles')}>
            Browse more members
          </button>
        )}
        <p className="muted">
          Search methods, equipment and research interests using the contextual
          search.
        </p>
        {list.map((p) => (
          <article className="member" key={p.id}>
            <div className="member-heading">
              <ProfileAvatar name={p.name} id={p.id} />
              <span className="status">
                {isDemo ? 'Demo participant' : 'Eligibility reviewed'}
              </span>
            </div>
            <h2>
              <Link to={'/member/' + p.id}>{p.name}</Link>
            </h2>
            <p>
              @{p.handle} · {p.institution}
            </p>
            <p>{p.bio}</p>
            <p>
              <b>Methods:</b> {p.methods || 'Not specified'}
            </p>
            <p>
              <b>Equipment:</b> {p.equipment || 'Not specified'}
            </p>
            <div className="tags">
              {p.interests.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <span className="status">
              {p.available ? 'Open to collaboration' : 'Unavailable'}
            </span>
            <Link to="/projects">
              Connect through a project collaboration request →
            </Link>
          </article>
        ))}
        {!list.length && (
          <div className="empty">No matching eligible profiles.</div>
        )}
      </>
    )
  }
  if (!u)
    return (
      <>
        <h1>Your workspace</h1>
        <p>
          Sign in from the account control to create a profile. During the
          public preview, Continue with GitHub grants member access.
        </p>
      </>
    )
  if (kind === 'settings')
    return (
      <>
        <h1>
          Make it yours<span className="signal">.</span>
        </h1>
        <div className="settings-grid">
          <section>
            <h2>Reading & motion</h2>
            <label>
              Theme
              <select
                aria-label="Theme"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
              />
              Pause the living background
            </label>
            <p>
              System reduced-motion settings also disable nonessential movement.
            </p>
          </section>
          <section>
            <h2>Notifications & interests</h2>
            <label className="check">
              <input
                type="checkbox"
                checked={pref?.in_app ?? true}
                onChange={(e) =>
                  void c.action('preferences', {
                    ...pref,
                    interests: pref?.interests ?? u.interests,
                    muted: pref?.muted ?? [],
                    in_app: e.target.checked,
                    email: pref?.email ?? false,
                    digest: pref?.digest ?? 'none',
                  })
                }
              />
              In-app notifications
            </label>
            <label className="check">
              <input type="checkbox" checked={false} disabled />
              Email notifications (delivery provider not configured)
            </label>
            <label>
              Digest
              <select disabled value="none">
                <option value="none">None · email delivery unavailable</option>
              </select>
            </label>
            <Link to="/profile">Edit research interests in your profile</Link>
            <fieldset>
              <legend>In-app notification categories</legend>
              {[
                'reply',
                'accepted',
                'collaboration',
                'membership',
                'mention',
                'topic',
                'moderation',
              ].map((category) => (
                <label className="check" key={category}>
                  <input
                    type="checkbox"
                    checked={(
                      pref?.categories ?? [
                        'reply',
                        'accepted',
                        'collaboration',
                        'membership',
                        'mention',
                        'topic',
                        'moderation',
                      ]
                    ).includes(category)}
                    onChange={() =>
                      void c.action('notification_preferences', {
                        categories: (
                          pref?.categories ?? [
                            'reply',
                            'accepted',
                            'collaboration',
                            'membership',
                            'mention',
                            'topic',
                            'moderation',
                          ]
                        ).includes(category)
                          ? (
                              pref?.categories ?? [
                                'reply',
                                'accepted',
                                'collaboration',
                                'membership',
                                'mention',
                                'topic',
                                'moderation',
                              ]
                            ).filter((x) => x !== category)
                          : (pref?.categories ?? []).concat(category),
                      })
                    }
                  />
                  {category}
                </label>
              ))}
            </fieldset>
            <h3>Muted topics</h3>
            {pref?.muted.map((t) => (
              <div className="list-row" key={t}>
                {t}
                <button
                  onClick={() =>
                    void c.action('preferences', {
                      ...pref,
                      muted: pref.muted.filter((x) => x !== t),
                    })
                  }
                >
                  Unmute
                </button>
              </div>
            ))}
          </section>
          <section>
            <h2>Blocked participants</h2>
            {c.data.blocks
              .filter((b) => b.user_id === c.userId)
              .map((b) => (
                <div className="list-row" key={b.target_id}>
                  {c.data.profiles.find((p) => p.id === b.target_id)?.name ??
                    'Blocked participant'}
                  <button
                    onClick={() =>
                      void c.action('block', { target_id: b.target_id })
                    }
                  >
                    Unblock
                  </button>
                </div>
              ))}
          </section>
          <section>
            <h2>Account & local data</h2>
            <p>
              Academic state: {u.membership}
              {u.suspended ? ' · Suspended' : ''}. Phone:{' '}
              {u.phone_verified ? 'verified' : 'not verified'}.
            </p>
            <div className="actions">
              <button onClick={() => void exportData()}>
                Export personal data
              </button>
              <button
                onClick={() => {
                  try {
                    for (const key of Object.keys(localStorage))
                      if (
                        key.startsWith('biocircuit-draft-') ||
                        key.startsWith('biocircuit-onboarding-')
                      )
                        localStorage.removeItem(key)
                    c.setMessage('Local drafts cleared')
                  } catch {
                    c.setError('Local storage unavailable')
                  }
                }}
              >
                Clear local drafts
              </button>
              <button
                disabled={isDemo}
                title={
                  isDemo
                    ? 'Demo has no authenticated session; use Reset synthetic demo'
                    : undefined
                }
                onClick={async () => {
                  try {
                    await signOut()
                    await c.load()
                    c.setMessage(
                      isDemo
                        ? 'Demo identity stays synthetic; use reset to clear demo state'
                        : 'Signed out',
                    )
                  } catch (e) {
                    c.setError(
                      e instanceof Error ? e.message : 'Sign out failed',
                    )
                  }
                }}
              >
                Sign out
              </button>
            </div>
            {isDemo ? (
              <button
                onClick={() => {
                  if (confirm('Clear all synthetic demo changes?')) {
                    resetDemo()
                    void c.load()
                  }
                }}
              >
                Reset synthetic demo
              </button>
            ) : (
              <>
                <h3>Change and reverify phone</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const p = phoneSchema.safeParse(phone)
                    if (!p.success) {
                      c.setError(p.error.issues[0].message)
                      return
                    }
                    if (!supabase) return
                    setAuthBusy(true)
                    const { error } = await supabase.auth.updateUser({
                      phone: p.data,
                    })
                    setAuthBusy(false)
                    if (error)
                      c.setError(
                        'Phone change unavailable. Please wait and retry.',
                      )
                    else setChanging(true)
                  }}
                >
                  <label>
                    New international phone number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </label>
                  <button disabled={authBusy || changing}>
                    Request phone change
                  </button>
                </form>
                {changing && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setAuthBusy(true)
                      const r = await supabase?.auth.verifyOtp({
                        phone,
                        token: otp,
                        type: 'phone_change',
                      })
                      setAuthBusy(false)
                      if (r?.error)
                        c.setError('Invalid or expired verification code')
                      else {
                        setChanging(false)
                        setOtp('')
                        await c.load()
                      }
                    }}
                  >
                    <label>
                      Verification code
                      <input
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) =>
                          setOtp(e.target.value.replace(/\D/g, ''))
                        }
                      />
                    </label>
                    <button disabled={authBusy || otp.length !== 6}>
                      Confirm phone change
                    </button>
                  </form>
                )}
                <p>
                  Sign out of all sessions using the managed auth provider.
                  Current device lists are not exposed by this client.
                </p>
                <button
                  onClick={async () => {
                    const r = await supabase?.auth.signOut({ scope: 'global' })
                    if (r?.error) c.setError('Session revocation failed')
                    else await c.load()
                  }}
                >
                  Revoke all sessions
                </button>
                <h3>Delete account</h3>
                <p>
                  Deletion removes your private application, preferences,
                  storage and auth identity. Transfer owned projects first.
                  Contributions are removed; moderation audit uses a
                  deidentified actor reference.
                </p>
                <label>
                  Type DELETE to confirm
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                  />
                </label>
                <button
                  disabled={deleteText !== 'DELETE' || c.busy}
                  onClick={async () => {
                    const r = await supabase?.functions.invoke(
                      'account-delete',
                      { body: { confirm: 'DELETE' } },
                    )
                    if (r?.error)
                      c.setError(
                        'Deletion failed. Transfer owned projects and retry.',
                      )
                    else {
                      await signOut()
                      await c.load()
                    }
                  }}
                >
                  Permanently delete account
                </button>
              </>
            )}
          </section>
        </div>
      </>
    )
  return (
    <>
      <div className="profile-header">
        <ProfileAvatar large name={u.name} id={u.id} />
        <div>
          <span className="eyebrow">Your research identity</span>
          <h1>
            {u.name}
            <span className="signal">.</span>
          </h1>
        </div>
      </div>
      <p className="lead">
        {u.bio ||
          'Describe the methods, questions and tools that matter to your work.'}
      </p>
      <p>
        @{u.handle} · {u.institution} · {u.degree}
      </p>
      <div className="actions">
        <span className="status">
          Academic: {u.membership}
          {isDemo ? ' · synthetic fixture' : ''}
        </span>
        <span className="status">
          Phone: {u.phone_verified ? 'verified' : 'not verified'}
        </span>
        <button onClick={() => setEdit(!edit)}>
          {edit ? 'Cancel editing' : 'Edit profile & interests'}
        </button>
      </div>
      <Avatar c={c} />
      {edit && <ProfileForm key={u.id} c={c} onDone={() => setEdit(false)} />}
      <div className="editorial-grid">
        <section>
          <h2>Methods & tools</h2>
          <p>{u.methods || 'No methods added'}</p>
          <p>{u.equipment || 'No equipment listed'}</p>
        </section>
        <section>
          <h2>Useful contributions</h2>
          <p className="big-number">{total}</p>
          <p>
            Derived from valid contribution events. No points for posting
            frequency, self votes or grades.
          </p>
          {c.data.contributions
            .filter((x) => x.user_id === u.id && x.valid)
            .map((x) => (
              <p key={x.id}>
                {x.kind.replaceAll('_', ' ')} · {x.points}
              </p>
            ))}
        </section>
        <section>
          <h2>Research interests</h2>
          <div className="tags">
            {u.interests.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <p>
            {u.available
              ? 'Available for collaboration'
              : 'Not seeking collaborations'}
          </p>
          <p>Profile visibility: {u.visibility}</p>
        </section>
      </div>
      <h2>Selected projects</h2>
      {c.data.projects
        .filter(
          (p) =>
            p.owner_id === u.id ||
            c.data.project_members.some(
              (m) => m.project_id === p.id && m.user_id === u.id,
            ),
        )
        .map((p) => (
          <p key={p.id}>
            <Link to={'/project/' + p.id}>{p.title}</Link>
          </p>
        ))}
      <Link to="/settings">
        Privacy, export, blocking and account controls →
      </Link>
    </>
  )
}
function ProfileForm({ c, onDone }: { c: Community; onDone: () => void }) {
  const [f, setF] = useState({ ...c.user!, handle: c.user?.handle ?? '' })
  const [error, setError] = useState('')
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        const p = profileSchema.safeParse(f)
        if (!p.success) {
          setError(p.error.issues.map((x) => x.message).join('; '))
          return
        }
        if (await c.action('profile', p.data)) onDone()
      }}
    >
      {(
        [
          'name',
          'handle',
          'institution',
          'degree',
          'bio',
          'methods',
          'equipment',
        ] as const
      ).map((k) => (
        <label key={k}>
          {k[0].toUpperCase() + k.slice(1)}
          <input
            value={f[k]}
            maxLength={k === 'bio' ? 1200 : 1000}
            onChange={(e) => setF((v) => ({ ...v, [k]: e.target.value }))}
          />
        </label>
      ))}
      <fieldset>
        <legend>Research interests</legend>
        {topics.map((t) => (
          <label className="check" key={t}>
            <input
              type="checkbox"
              checked={f.interests.includes(t)}
              onChange={() =>
                setF((v) => ({
                  ...v,
                  interests: v.interests.includes(t)
                    ? v.interests.filter((x) => x !== t)
                    : v.interests.concat(t),
                }))
              }
            />
            {t}
          </label>
        ))}
      </fieldset>
      <label className="check">
        <input
          type="checkbox"
          checked={f.available}
          onChange={(e) => setF((v) => ({ ...v, available: e.target.checked }))}
        />
        Open to collaboration
      </label>
      <label>
        Profile visibility
        <select
          aria-label="Visibility"
          value={f.visibility}
          onChange={(e) =>
            setF((v) => ({
              ...v,
              visibility: e.target.value as typeof v.visibility,
            }))
          }
        >
          <option value="public">Public</option>
          <option value="members">Members</option>
          <option value="private">Private</option>
        </select>
      </label>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="primary" disabled={c.busy}>
        Save public-safe profile
      </button>
    </form>
  )
}
function Policies() {
  return (
    <>
      <h1>
        Trust, with clear limits<span className="signal">.</span>
      </h1>
      <h2>Community standards</h2>
      <p>
        Be constructive. Cite sources, credit collaborators, disclose
        limitations and distinguish preliminary results from peer-reviewed
        conclusions. Do not share identifiable patient data, patient images,
        clinical records, unauthorized datasets, malware, harassment, fraud or
        material you cannot license. This is a professional community, not a
        clinical care system or certified compliance service.
      </p>
      <h2>Eligibility</h2>
      <p>
        Public preview: signing in with GitHub approves membership
        automatically, without academic review, so membership does not prove any
        qualification. Rejected, appealed and suspended accounts are never
        changed by this rule. The review process below remains for accounts that
        apply without GitHub.
      </p>
      <p>
        Biomedical engineering undergraduate, postgraduate and doctoral degree
        pathways, current students and result-awaiting applicants are eligible
        for manual review. Combined and ambiguous degrees are reviewed
        individually. Phone verification proves number control; academic
        approval reflects a reviewer decision. Institutions do not endorse this
        platform. Rejected or expired applicants can request an appeal.
      </p>
      <h2>Privacy & retention</h2>
      <p>
        Public-safe profile fields are separate from private academic
        applications. Exact marks are optional, never public or a ranking
        signal. Academic details are available only to the applicant and
        authorized reviewers. No evidence documents are collected while secure
        uploads are disabled. Do not enter real sensitive data in demo mode.
      </p>
      <p>
        Optional private marks are cleared 90 days after a decision by the
        configured retention job. Minimal eligibility metadata remains until
        account deletion to support membership and appeals. Operational audit
        records use minimal identifiers and a 365-day retention target.
        Retention jobs must be configured before launch. Export and deletion are
        available in account settings; transfer project ownership before
        deletion. Public content is removed on account deletion. No private data
        is sent to AI services.
      </p>
      <h2>Reports & appeals</h2>
      <p>
        Use Report on contributions for safety, source corrections, takedowns or
        IP concerns. Authorized moderators record reasons and actions. Academic
        reviewers have no automatic access to unrelated private content. Block
        and mute controls affect discovery and interaction. Membership appeals
        appear in the trust queue.
      </p>
      <h2>Service and cost transparency</h2>
      <p>
        SMS delivery depends on a configured provider and may incur charges.
        Database, storage and scholarly sources have usage limits. Verify
        current privacy and SMS rules in the operating region, including India,
        and arrange legal review before launch. No claim of institutional
        integration or independent security certification is made.
      </p>
      <Link to="/settings">Open account controls →</Link>
    </>
  )
}
