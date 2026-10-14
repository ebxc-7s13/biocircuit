import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Community } from '../data/useCommunity'
import { visiblePost } from '../domain/ranking'
import type { Profile } from '../domain/models'
import { ProfileAvatar } from '../components/SocialShell'
import { isDemo, supabase } from '../data/gateway'
export default function Member({ c, id }: { c: Community; id: string }) {
  const [section, setSection] = useState('Contributions')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const load = async () => {
      try {
        let p: Profile | null = null
        if (isDemo)
          p =
            c.data.profiles.find(
              (p) =>
                p.id === id &&
                (p.id === c.userId ||
                  (p.membership === 'approved' &&
                    !p.suspended &&
                    p.visibility === 'public') ||
                  (p.visibility === 'members' &&
                    c.user?.membership === 'approved')) &&
                !c.data.blocks.some(
                  (b) =>
                    (b.user_id === c.userId && b.target_id === p.id) ||
                    (b.target_id === c.userId && b.user_id === p.id),
                ),
            ) ?? null
        else if (supabase && /^[0-9a-f-]{36}$/i.test(id)) {
          const r = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          if (r.error) throw Error('Profile unavailable')
          p = r.data
        }
        if (active) setProfile(p)
      } catch {
        if (active) setError('Profile could not be loaded')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [id, c.data.profiles, c.data.blocks, c.userId, c.user?.membership])
  if (loading)
    return (
      <p className="skeleton" role="status">
        Loading research profile…
      </p>
    )
  if (!profile)
    return (
      <>
        <h1>Profile unavailable</h1>
        <p>{error || 'This profile may be private, restricted or removed.'}</p>
        <Link to="/collaborators">Explore collaborators</Link>
      </>
    )
  return (
    <>
      <div className="profile-header">
        <ProfileAvatar large name={profile.name} id={profile.id} />
        <div>
          <span className="eyebrow">
            Research identity /{' '}
            {isDemo
              ? 'Synthetic participant'
              : 'Academic: ' + profile.membership}
          </span>
          <h1>
            {profile.name}
            <span className="signal">.</span>
          </h1>
        </div>
      </div>
      <p>
        @{profile.handle} · {profile.institution} · {profile.degree}
      </p>
      <p className="lead">{profile.bio}</p>
      <h2>Methods & equipment</h2>
      <p>{profile.methods || 'Not listed'}</p>
      <p>{profile.equipment || 'Not listed'}</p>
      <div className="tags">
        {profile.interests.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <p>
        {profile.available
          ? 'Open to collaboration'
          : 'Not seeking collaborations'}
      </p>
      {id !== c.userId && (
        <div className="actions">
          <button
            disabled={c.busy}
            onClick={() => void c.action('follow', { target_id: id })}
          >
            {c.data.follows.some(
              (f) => f.user_id === c.userId && f.target_id === id,
            )
              ? 'Unfollow'
              : 'Follow researcher'}
          </button>
          <button
            disabled={c.busy}
            onClick={() => void c.action('block', { target_id: id })}
          >
            Block researcher
          </button>
        </div>
      )}
      <div className="mode-tabs" role="group" aria-label="Profile sections">
        {['Contributions', 'Questions', 'Projects'].map((t) => (
          <button
            key={t}
            aria-pressed={section === t}
            onClick={() => setSection(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {section === 'Projects' && (
        <>
          <h2>Projects in loaded discovery</h2>
          {c.data.projects
            .filter(
              (p) =>
                p.owner_id === id &&
                (p.visibility === 'public' ||
                  p.owner_id === c.userId ||
                  c.data.project_members.some(
                    (m) => m.project_id === p.id && m.user_id === c.userId,
                  )),
            )
            .map((p) => (
              <p key={p.id}>
                <Link to={'/project/' + p.id}>{p.title}</Link>
              </p>
            ))}
        </>
      )}
      {section !== 'Projects' && (
        <>
          <h2>
            {section === 'Questions'
              ? 'Questions in loaded research'
              : 'Recent contributions in loaded research'}
          </h2>
          {c.data.posts
            .filter(
              (p) =>
                p.author_id === id &&
                visiblePost(p, c.user, c.data) &&
                (section !== 'Questions' || p.kind === 'question'),
            )
            .map((p) => (
              <p key={p.id}>
                <Link to={'/post/' + p.id}>{p.title}</Link>
              </p>
            ))}
        </>
      )}
      <Link to="/projects">
        Connect through a project collaboration request →
      </Link>
    </>
  )
}
