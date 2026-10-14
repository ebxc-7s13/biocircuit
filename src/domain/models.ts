export const topics = [
  'Biomedical imaging',
  'Bioinstrumentation',
  'Biosignal processing',
  'Biomechanics',
  'Biomaterials',
  'Tissue engineering',
  'Rehabilitation engineering',
  'Medical devices',
  'Computational biology / AI',
  'Clinical engineering',
  'Regulatory translation',
] as const
export type Kind =
  'discussion' | 'question' | 'project_update' | 'paper_discussion' | 'resource'
export type Membership =
  | 'not_submitted'
  | 'pending'
  | 'needs_evidence'
  | 'approved'
  | 'rejected'
  | 'appeal'
  | 'expired'
export interface Profile {
  id: string
  name: string
  handle: string
  institution: string
  degree: string
  bio: string
  interests: string[]
  methods: string
  equipment: string
  available: boolean
  visibility: 'public' | 'members' | 'private'
  membership: Membership
  suspended: boolean
  phone_verified: boolean
}
export interface Post {
  log_type?: string
  reaction_count?: number
  reply_count?: number
  recommendation_score?: number
  recommendation_reason?: string
  id: string
  author_id: string
  kind: Kind
  title: string
  body: string
  tags: string[]
  created_at: string
  visibility: 'public' | 'members' | 'private'
  state: 'published' | 'removed'
  project_id: string | null
  paper_id: string | null
  source_url: string
  methods: string
  tried: string
  resolution: string
  accepted_answer_id: string | null
}
export interface Comment {
  helpful_count?: number
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
}
export interface Project {
  id: string
  owner_id: string
  title: string
  problem: string
  stage: string
  methods: string
  equipment: string
  needs: string
  tags: string[]
  visibility: 'public' | 'private'
  source_url: string
  license: string
  governance: string
  archived: boolean
  created_at: string
}
export interface ProjectMember {
  project_id: string
  user_id: string
  role: string
}
export interface Collaboration {
  id: string
  project_id: string
  sender_id: string
  message: string
  expertise: string
  availability: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}
export interface Paper {
  id: string
  doi: string
  pmid: string
  title: string
  authors: string[]
  venue: string
  published: string
  source: string
  source_url: string
  retrieved_at: string
  abstract_available: boolean
  correction: string
}
export interface Application {
  id: string
  user_id: string
  institution: string
  degree: string
  discipline: string
  result_status: string
  year: number
  private_marks: string
  status: Membership
  reason: string
  created_at: string
}
export interface Notification {
  event_key?: string
  id: string
  user_id: string
  category: string
  text: string
  path: string
  read: boolean
  created_at: string
}
export interface Report {
  id: string
  reporter_id: string
  post_id: string
  reason: string
  status: string
  created_at: string
}
export interface Contribution {
  id: string
  user_id: string
  source_id: string
  kind: string
  points: number
  valid: boolean
}
export interface Audit {
  id: string
  actor_id: string
  action: string
  target_id: string
  reason: string
  created_at: string
}
export interface Preferences {
  categories?: string[]
  user_id: string
  muted: string[]
  interests: string[]
  in_app: boolean
  email: boolean
  digest: string
  language: string
}
export interface Snapshot {
  paper_reports: {
    id: string
    user_id: string
    paper_id: string
    reason: string
    status: string
    review_reason: string
  }[]
  appeals: {
    id: string
    user_id: string
    post_id: string
    reason: string
    status: string
    review_reason: string
  }[]
  own_removed: { id: string; title: string; reason: string }[]
  paper_saves: { user_id: string; paper_id: string }[]
  contribution_total?: number
  milestones: { post_id: string; user_id: string }[]
  subscriptions: { user_id: string; post_id: string }[]
  versions: {
    id: string
    post_id: string
    editor_id: string
    title: string
    body: string
    created_at: string
  }[]
  taxonomy: string[]
  point_rules: { kind: string; points: number }[]
  profiles: Profile[]
  posts: Post[]
  comments: Comment[]
  projects: Project[]
  project_members: ProjectMember[]
  collaborations: Collaboration[]
  papers: Paper[]
  applications: Application[]
  notifications: Notification[]
  reports: Report[]
  contributions: Contribution[]
  audit: Audit[]
  preferences: Preferences[]
  reactions: { user_id: string; post_id: string }[]
  bookmarks: { user_id: string; post_id: string }[]
  follows: { user_id: string; target_id: string }[]
  blocks: { user_id: string; target_id: string }[]
  helpful: { user_id: string; comment_id: string }[]
  roles: { user_id: string; role: string }[]
}
export interface Action {
  type: string
  data: Record<string, unknown>
  request_id: string
}
export const emptySnapshot = (): Snapshot => ({
  paper_reports: [],
  appeals: [],
  own_removed: [],
  paper_saves: [],
  milestones: [],
  subscriptions: [],
  versions: [],
  taxonomy: [...topics],
  point_rules: [{ kind: 'accepted_answer', points: 20 }],
  profiles: [],
  posts: [],
  comments: [],
  projects: [],
  project_members: [],
  collaborations: [],
  papers: [],
  applications: [],
  notifications: [],
  reports: [],
  contributions: [],
  audit: [],
  preferences: [],
  reactions: [],
  bookmarks: [],
  follows: [],
  blocks: [],
  helpful: [],
  roles: [],
})
