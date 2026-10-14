import { emptySnapshot } from '../domain/models'
import type {
  Snapshot,
  Profile,
  Action,
  Post,
  Project,
  Application,
  Paper,
} from '../domain/models'
import { visiblePost } from '../domain/ranking'
import {
  applicationSchema,
  postSchema,
  profileSchema,
  projectSchema,
} from '../domain/validation'
export const demoUserId = '10000000-0000-4000-8000-000000000001'
export function demoSeed(): Snapshot {
  const s = emptySnapshot()
  const names = [
    'Demo researcher',
    'Demo optical engineer',
    'Demo biosignal scholar',
  ]
  s.profiles = names.map((name, i) => ({
    id: '10000000-0000-4000-8000-00000000000' + (i + 1),
    name,
    handle: 'demo_' + (i + 1),
    institution: 'Illustrative Institute',
    degree: 'Biomedical Engineering',
    bio: 'Synthetic profile for local workflow evaluation.',
    interests: [i === 1 ? 'Biomedical imaging' : 'Biosignal processing'],
    methods:
      i === 1
        ? 'Fluorescence microscopy, optical alignment'
        : 'EEG, Python, grouped validation',
    equipment: i === 1 ? 'Optical bench' : 'Signal generator',
    available: true,
    visibility: 'public',
    membership: 'approved',
    suspended: false,
    phone_verified: false,
  }))
  const titles = [
    'Patient-level validation with small cohorts',
    'Open build log: a modular fluorescence microscope',
    'Show your EEG failure cases',
    'Which tests changed your hydrogel design?',
  ]
  const bodies = [
    'Image-level random splitting gives encouraging metrics, but repeated images may leak across folds. What grouped validation and uncertainty measures have you tried?',
    'The next milestone is repeatability across sessions. Share optical path alignment, LED driver measurements and filter choices, including the limitations.',
    'Motion artifacts and electrode shifts expose useful failure modes. Share one reproducible experiment that changed how you interpreted a model.',
    'Comparing swelling ratio, compressive modulus and degradation profiles. Which characterization result changed a design decision?',
  ]
  s.posts = titles.map((title, i) => ({
    id: '20000000-0000-4000-8000-00000000000' + (i + 1),
    author_id: s.profiles[i % 3].id,
    kind: i === 1 ? 'project_update' : i === 2 ? 'discussion' : 'question',
    title,
    body: bodies[i],
    tags: [
      i === 1
        ? 'Biomedical imaging'
        : i === 3
          ? 'Biomaterials'
          : 'Biosignal processing',
    ],
    created_at: new Date(Date.UTC(2026, 9, 10, 8 - i)).toISOString(),
    visibility: 'public',
    state: 'published',
    project_id: i === 1 ? '30000000-0000-4000-8000-000000000001' : null,
    paper_id: null,
    source_url: '',
    methods: '',
    tried: '',
    resolution: '',
    accepted_answer_id: null,
  }))
  s.projects = [
    {
      id: '30000000-0000-4000-8000-000000000001',
      owner_id: s.profiles[1].id,
      title: 'Modular fluorescence microscope',
      problem:
        'A reproducible optical bench for affordable, nonclinical imaging experiments.',
      stage: 'Prototype',
      methods: 'Optical alignment and repeated calibration',
      equipment: 'LED driver, filters, camera',
      needs: 'Optics and embedded systems',
      tags: ['Biomedical imaging'],
      visibility: 'public',
      source_url: '',
      license: 'Undecided; request permission before reuse',
      governance: 'Synthetic samples only. No patient data.',
      archived: false,
      created_at: s.posts[1].created_at,
    },
  ]
  s.project_members = [
    { project_id: s.projects[0].id, user_id: s.profiles[1].id, role: 'Owner' },
  ]
  return s
}
const requireMember = (u: Profile) => {
  if (u.membership !== 'approved' || u.suspended)
    throw Error('Approved, active membership is required')
}
// Pure transition engine is used ONLY by labelled local demo and unit tests, never as production authorization.
export function demoAction(s: Snapshot, userId: string, a: Action): Snapshot {
  const n = structuredClone(s)
  const u = n.profiles.find((p) => p.id === userId)
  if (!u) throw Error('Sign in first')
  const d = a.data
  const id = a.request_id
  const now = new Date().toISOString()
  const str = (k: string) => String(d[k] ?? '')
  const post = n.posts.find((p) => p.id === str('post_id'))
  const project = n.projects.find((p) => p.id === str('project_id'))
  const role = (r: string) =>
    n.roles.some((x) => x.user_id === userId && x.role === r)
  const audit = (action: string, target: string, reason: string) =>
    n.audit.push({
      id,
      actor_id: userId,
      action,
      target_id: target,
      reason,
      created_at: now,
    })
  const notify = (
    target: string,
    text: string,
    path: string,
    category: string,
    event = id,
  ) => {
    if (
      target !== userId &&
      !n.notifications.some(
        (x) => x.event_key === event && x.user_id === target,
      ) &&
      n.preferences.find((x) => x.user_id === target)?.in_app !== false &&
      (n.preferences
        .find((x) => x.user_id === target)
        ?.categories?.includes(category) ??
        true)
    )
      n.notifications.push({
        id: id + ':' + target,
        event_key: event,
        user_id: target,
        category,
        text,
        path,
        read: false,
        created_at: now,
      })
  }
  if (a.type === 'profile') {
    const p = profileSchema.parse(d)
    if (n.profiles.some((x) => x.id !== userId && x.handle === p.handle))
      throw Error('Handle unavailable')
    Object.assign(u, p)
    return n
  }
  if (a.type === 'application') {
    const data = applicationSchema.parse(d)
    const prev = n.applications.find((x) => x.user_id === userId)
    if (prev?.status === 'approved' || prev?.status === 'pending')
      throw Error('Application is already under review or approved')
    const app: Application = {
      ...data,
      id: prev?.id ?? id,
      user_id: userId,
      status: 'pending',
      reason: '',
      created_at: now,
    }
    n.applications = n.applications
      .filter((x) => x.user_id !== userId)
      .concat(app)
    u.membership = 'pending'
    return n
  }
  if (a.type === 'appeal') {
    const app = n.applications.find((x) => x.user_id === userId)
    if (!app || !['rejected', 'expired'].includes(app.status))
      throw Error('No appealable decision')
    app.status = 'appeal'
    app.reason = str('reason').slice(0, 1000)
    u.membership = 'appeal'
    return n
  }
  if (a.type === 'review') {
    if (!role('reviewer') && !role('admin'))
      throw Error('Reviewer access required')
    const app = n.applications.find((x) => x.id === str('application_id'))
    if (!app || app.user_id === userId)
      throw Error('Cannot review this application')
    const status = str('status')
    if (
      !['approved', 'rejected', 'needs_evidence', 'expired'].includes(status) ||
      str('reason').length < 5
    )
      throw Error('Decision and reason required')
    app.status = status as Application['status']
    app.reason = str('reason')
    n.profiles.find((x) => x.id === app.user_id)!.membership = app.status
    audit('membership_' + status, app.id, app.reason)
    notify(
      app.user_id,
      'Membership decision: ' + status,
      '/profile',
      'membership',
    )
    return n
  }
  if (a.type === 'preferences') {
    n.preferences = n.preferences
      .filter((x) => x.user_id !== userId)
      .concat({
        user_id: userId,
        muted: Array.isArray(d.muted) ? (d.muted as string[]) : [],
        interests: Array.isArray(d.interests)
          ? (d.interests as string[])
          : u.interests,
        in_app: d.in_app !== false,
        email: d.email === true,
        digest: str('digest') || 'none',
        language: 'en',
      })
    return n
  }
  if (a.type === 'notification_preferences') {
    const pref = n.preferences.find((x) => x.user_id === userId)
    if (pref) pref.categories = d.categories as string[]
    else
      n.preferences.push({
        user_id: userId,
        muted: [],
        interests: u.interests,
        in_app: true,
        email: false,
        digest: 'none',
        language: 'en',
        categories: d.categories as string[],
      })
    return n
  }
  if (a.type === 'read_notifications') {
    n.notifications.forEach((x) => {
      if (x.user_id === userId) x.read = true
    })
    return n
  }
  if (a.type === 'appeal_content') {
    if (
      !post ||
      post.author_id !== userId ||
      post.state !== 'removed' ||
      str('reason').length < 5
    )
      throw Error('No appealable decision')
    if (!n.appeals.some((x) => x.post_id === post.id && x.user_id === userId))
      n.appeals.push({
        id,
        user_id: userId,
        post_id: post.id,
        reason: str('reason'),
        status: 'pending',
        review_reason: '',
      })
    return n
  }
  requireMember(u)
  if (post && !visiblePost(post, u, n) && a.type !== 'moderate')
    throw Error('Discussion unavailable')
  if (a.type === 'confirm_milestone') {
    if (
      !post ||
      post.log_type !== 'milestone' ||
      post.author_id === userId ||
      !n.project_members.some(
        (m) => m.project_id === post.project_id && m.user_id === userId,
      )
    )
      throw Error('Another project collaborator must confirm')
    if (
      !n.milestones.some((m) => m.post_id === post.id && m.user_id === userId)
    )
      n.milestones.push({ post_id: post.id, user_id: userId })
    return n
  }
  if (a.type === 'subscribe') {
    if (!post) throw Error('Discussion unavailable')
    n.subscriptions = toggle(n.subscriptions, {
      user_id: userId,
      post_id: post.id,
    })
    return n
  }
  if (a.type === 'edit_comment') {
    const cm = n.comments.find((x) => x.id === str('comment_id'))
    if (
      !cm ||
      cm.author_id !== userId ||
      str('body').length < 5 ||
      str('body').length > 6000
    )
      throw Error('Author and valid reply required')
    cm.body = str('body')
    return n
  }
  if (a.type === 'delete_project') {
    if (!project || project.owner_id !== userId || str('confirm') !== 'DELETE')
      throw Error('Owner confirmation required')
    n.projects = n.projects.filter((x) => x.id !== project.id)
    n.posts = n.posts.filter((x) => x.project_id !== project.id)
    n.project_members = n.project_members.filter(
      (x) => x.project_id !== project.id,
    )
    n.collaborations = n.collaborations.filter(
      (x) => x.project_id !== project.id,
    )
    return n
  }
  if (a.type === 'taxonomy') {
    if (!role('admin') || str('name').length < 1 || str('name').length > 60)
      throw Error('Administrator and valid topic required')
    n.taxonomy = [...new Set([...n.taxonomy, str('name')])]
    audit('taxonomy', str('name'), str('reason'))
    return n
  }
  if (a.type === 'point_rule') {
    if (
      !role('admin') ||
      typeof d.points !== 'number' ||
      d.points < 0 ||
      d.points > 100
    )
      throw Error('Administrator and bounded rule required')
    n.point_rules = [{ kind: 'accepted_answer', points: d.points }]
    audit('point_rule', 'accepted_answer', str('reason'))
    return n
  }

  if (a.type === 'post') {
    if (n.posts.some((x) => x.id === id)) return n
    const p = postSchema.parse(d)
    if (
      p.project_id &&
      !n.project_members.some(
        (x) => x.project_id === p.project_id && x.user_id === userId,
      )
    )
      throw Error('Project membership required')
    n.posts.unshift({
      ...p,
      id,
      author_id: userId,
      created_at: now,
      state: 'published',
      resolution: '',
      accepted_answer_id: null,
    } as Post)
    return n
  }
  if (a.type === 'edit_post') {
    if (!post || post.author_id !== userId)
      throw Error('Only the author can edit')
    n.versions.push({
      id,
      post_id: post.id,
      editor_id: userId,
      title: post.title,
      body: post.body,
      created_at: now,
    })
    Object.assign(post, postSchema.parse(d))
    return n
  }
  if (a.type === 'comment') {
    if (
      !post ||
      post.state !== 'published' ||
      (post.visibility === 'private' && post.author_id !== userId)
    )
      throw Error('Discussion unavailable')
    if (str('body').trim().length < 5 || str('body').length > 6000)
      throw Error('Reply must be 5–6000 characters')
    if (!n.comments.some((x) => x.id === id))
      n.comments.push({
        id,
        post_id: post.id,
        author_id: userId,
        body: str('body').trim(),
        created_at: now,
      })
    notify(
      post.author_id,
      'New reply: ' + post.title,
      '/post/' + post.id,
      'reply',
    )
    n.subscriptions
      .filter((x) => x.post_id === post.id && x.user_id !== post.author_id)
      .forEach((x) =>
        notify(
          x.user_id,
          'New reply to a subscribed discussion',
          '/post/' + post.id,
          'reply',
        ),
      )
    return n
  }
  if (a.type === 'delete_comment') {
    const c = n.comments.find((x) => x.id === str('comment_id'))
    if (!c || c.author_id !== userId) throw Error('Author access required')
    n.comments = n.comments.filter((x) => x.id !== c.id)
    if (post?.accepted_answer_id === c.id) post.accepted_answer_id = null
    n.contributions.forEach((x) => {
      if (x.source_id === c.id) x.valid = false
    })
    return n
  }
  if (a.type === 'accept') {
    const c = n.comments.find(
      (x) => x.id === str('comment_id') && x.post_id === post?.id,
    )
    if (
      !post ||
      post.kind !== 'question' ||
      !(post.author_id === userId || role('moderator') || role('admin')) ||
      !c ||
      c.author_id === userId ||
      c.author_id === post.author_id
    )
      throw Error('Only the asker can accept another member’s answer')
    n.contributions.forEach((x) => {
      if (x.source_id === post.accepted_answer_id) x.valid = false
    })
    post.accepted_answer_id = c.id
    const old = n.contributions.find(
      (x) => x.source_id === c.id && x.kind === 'accepted_answer',
    )
    if (old) old.valid = true
    else
      n.contributions.push({
        id,
        user_id: c.author_id,
        source_id: c.id,
        kind: 'accepted_answer',
        points: n.point_rules[0]?.points ?? 20,
        valid: true,
      })
    notify(
      c.author_id,
      'Your answer was accepted',
      '/post/' + post.id,
      'accepted',
      'accepted:' + c.id,
    )
    return n
  }
  if (a.type === 'resolve') {
    if (!post || post.author_id !== userId) throw Error('Author required')
    post.resolution = str('resolution').slice(0, 3000)
    if (!post.resolution) {
      n.contributions.forEach((x) => {
        if (x.source_id === post.accepted_answer_id) x.valid = false
      })
      post.accepted_answer_id = null
    }
    return n
  }
  if (['reaction', 'bookmark', 'follow', 'block', 'helpful'].includes(a.type)) {
    const target = str('target_id')
    if (a.type === 'reaction') {
      if (!post || post.author_id === userId)
        throw Error('Cannot react to your own post')
      n.reactions = toggle(n.reactions, { user_id: userId, post_id: post.id })
    }
    if (a.type === 'bookmark') {
      if (!post) throw Error('Post unavailable')
      n.bookmarks = toggle(n.bookmarks, { user_id: userId, post_id: post.id })
    }
    if (a.type === 'follow') {
      if (target === userId) throw Error('Cannot follow yourself')
      n.follows = toggle(n.follows, { user_id: userId, target_id: target })
    }
    if (a.type === 'block') {
      if (target === userId) throw Error('Cannot block yourself')
      n.blocks = toggle(n.blocks, { user_id: userId, target_id: target })
    }
    if (a.type === 'helpful') {
      const c = n.comments.find((x) => x.id === str('comment_id'))
      if (!c || c.author_id === userId) throw Error('Cannot vote on own answer')
      n.helpful = toggle(n.helpful, { user_id: userId, comment_id: c.id })
    }
    return n
  }
  if (a.type === 'report') {
    if (!post || str('reason').length < 5) throw Error('Report reason required')
    if (
      !n.reports.some(
        (x) =>
          x.reporter_id === userId &&
          x.post_id === post.id &&
          x.status === 'open',
      )
    )
      n.reports.push({
        id,
        reporter_id: userId,
        post_id: post.id,
        reason: str('reason').slice(0, 1000),
        status: 'open',
        created_at: now,
      })
    return n
  }
  if (a.type === 'delete_post') {
    if (!post || post.author_id !== userId) throw Error('Author required')
    post.state = 'removed'
    return n
  }
  if (a.type === 'moderate') {
    if (!role('moderator') && !role('admin'))
      throw Error('Moderator access required')
    if (str('reason').length < 5) throw Error('Reason required')
    if (post)
      post.state = str('state') === 'published' ? 'published' : 'removed'
    const r = n.reports.find((x) => x.id === str('report_id'))
    if (r) r.status = 'reviewed'
    audit('moderate', post?.id ?? '', str('reason'))
    if (post) {
      n.own_removed = n.own_removed.filter((x) => x.id !== post.id)
      if (post.state === 'removed')
        n.own_removed.push({
          id: post.id,
          title: post.title,
          reason: str('reason'),
        })
    }
    return n
  }
  if (a.type === 'suspend') {
    if (!role('admin')) throw Error('Admin access required')
    const target = n.profiles.find((x) => x.id === str('target_id'))
    if (!target || target.id === userId) throw Error('Invalid target')
    target.suspended = d.suspended === true
    audit('suspension', target.id, str('reason'))
    return n
  }
  if (a.type === 'project') {
    if (!n.projects.some((x) => x.id === id)) {
      n.projects.unshift({
        ...projectSchema.parse(d),
        id,
        owner_id: userId,
        archived: false,
        created_at: now,
      } as Project)
      n.project_members.push({ project_id: id, user_id: userId, role: 'Owner' })
    }
    return n
  }
  if (a.type === 'edit_project') {
    if (!project || project.owner_id !== userId)
      throw Error('Project owner required')
    Object.assign(project, projectSchema.parse(d))
    return n
  }
  if (a.type === 'archive_project') {
    if (!project || project.owner_id !== userId)
      throw Error('Project owner required')
    project.archived = !project.archived
    return n
  }
  if (a.type === 'remove_member') {
    if (!project || project.owner_id !== userId || str('target_id') === userId)
      throw Error('Owner access required')
    n.project_members = n.project_members.filter(
      (x) => !(x.project_id === project.id && x.user_id === str('target_id')),
    )
    return n
  }
  if (a.type === 'transfer_project') {
    if (
      !project ||
      project.owner_id !== userId ||
      !n.project_members.some(
        (x) => x.project_id === project.id && x.user_id === str('target_id'),
      )
    )
      throw Error('Transfer requires an existing collaborator')
    project.owner_id = str('target_id')
    return n
  }
  if (a.type === 'collaborate') {
    if (
      !project ||
      project.owner_id === userId ||
      project.archived ||
      str('message').length < 10
    )
      throw Error('Cannot request this collaboration')
    if (
      !n.collaborations.some(
        (x) =>
          x.project_id === project.id &&
          x.sender_id === userId &&
          x.status === 'pending',
      )
    )
      n.collaborations.push({
        id,
        project_id: project.id,
        sender_id: userId,
        message: str('message').slice(0, 2000),
        expertise: str('expertise').slice(0, 1000),
        availability: str('availability').slice(0, 200),
        status: 'pending',
        created_at: now,
      })
    notify(
      project.owner_id,
      'New collaboration request',
      '/project/' + project.id,
      'collaboration',
    )
    return n
  }
  if (a.type === 'decide_collaboration') {
    const c = n.collaborations.find((x) => x.id === str('collaboration_id'))
    if (!c || !project || project.owner_id !== userId)
      throw Error('Project owner required')
    c.status = d.accept === true ? 'accepted' : 'declined'
    if (
      c.status === 'accepted' &&
      !n.project_members.some(
        (x) => x.project_id === project.id && x.user_id === c.sender_id,
      )
    )
      n.project_members.push({
        project_id: project.id,
        user_id: c.sender_id,
        role: 'Collaborator',
      })
    notify(
      c.sender_id,
      'Collaboration ' + c.status,
      '/project/' + project.id,
      'collaboration',
    )
    return n
  }
  if (a.type === 'resolve_content_appeal') {
    if (!role('moderator') && !role('admin')) throw Error('Moderator required')
    const ap = n.appeals.find((x) => x.id === str('appeal_id'))
    if (!ap || str('reason').length < 5)
      throw Error('Decision and reason required')
    ap.status = d.accept ? 'accepted' : 'rejected'
    ap.review_reason = str('reason')
    if (d.accept) {
      const p = n.posts.find((x) => x.id === ap.post_id)
      if (p) p.state = 'published'
    }
    audit('moderate_appeal', ap.id, str('reason'))
    return n
  }
  if (a.type === 'paper_report') {
    if (
      !n.papers.some((p) => p.id === str('paper_id')) ||
      str('reason').length < 5
    )
      throw Error('Paper and reason required')
    if (
      !n.paper_reports.some(
        (r) =>
          r.user_id === userId &&
          r.paper_id === str('paper_id') &&
          r.status === 'open',
      )
    )
      n.paper_reports.push({
        id,
        user_id: userId,
        paper_id: str('paper_id'),
        reason: str('reason'),
        status: 'open',
        review_reason: '',
      })
    return n
  }
  if (a.type === 'review_paper_report') {
    if (!role('metadata_editor') && !role('moderator') && !role('admin'))
      throw Error('Source reviewer required')
    const r = n.paper_reports.find((x) => x.id === str('report_id'))
    if (!r || str('reason').length < 5)
      throw Error('Report and reason required')
    r.status = 'reviewed'
    r.review_reason = str('reason')
    audit('paper_report_review', r.id, str('reason'))
    return n
  }
  if (a.type === 'unsave_paper') {
    n.paper_saves = n.paper_saves.filter(
      (x) => !(x.user_id === userId && x.paper_id === str('paper_id')),
    )
    return n
  }
  if (a.type === 'paper') {
    const p = d.paper as Paper
    if (!p || !p.title || !p.source_url) throw Error('Sourced paper required')
    if (!n.papers.some((x) => x.id === p.id)) n.papers.push(p)
    if (!n.paper_saves.some((x) => x.user_id === userId && x.paper_id === p.id))
      n.paper_saves.push({ user_id: userId, paper_id: p.id })
    return n
  }
  throw Error('Unsupported action')
}
function toggle<T extends object>(items: T[], value: T) {
  const same = (x: T) => JSON.stringify(x) === JSON.stringify(value)
  return items.some(same) ? items.filter((x) => !same(x)) : items.concat(value)
}
