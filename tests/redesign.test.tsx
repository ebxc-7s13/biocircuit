import { afterEach, beforeAll, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Explore from '../src/features/Explore'
import Trust from '../src/features/Trust'
import { PaperMetadataCard } from '../src/components/PaperMetadataCard'
import type { Paper } from '../src/domain/models'
import { demoSeed, demoUserId } from '../src/data/demo'
import type { Community } from '../src/data/useCommunity'
vi.mock('../src/data/gateway', () => ({ isDemo: true, supabase: null }))
afterEach(cleanup)
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})
function community() {
  const data = demoSeed()
  return {
    data,
    user: data.profiles[0],
    userId: demoUserId,
    busy: false,
    loading: false,
    error: '',
    searchResults: null,
    searchHasMore: false,
    setError: vi.fn(),
    action: vi.fn().mockResolvedValue(true),
  } as unknown as Community
}
it('Explore excludes pending/private/blocked profiles, muted contributions and restricted projects', () => {
  const c = community()
  c.data.profiles[1].membership = 'pending'
  c.data.profiles[2].visibility = 'private'
  c.data.preferences = [
    {
      user_id: demoUserId,
      muted: ['Biosignal processing'],
      interests: [],
      in_app: true,
      email: false,
      digest: 'none',
      language: 'en',
    },
  ]
  c.data.projects[0].visibility = 'private'
  render(
    <MemoryRouter>
      <Explore c={c} query="" setQuery={vi.fn()} />
    </MemoryRouter>,
  )
  expect(
    screen.queryByRole('link', { name: 'Demo optical engineer' }),
  ).toBeNull()
  expect(
    screen.queryByRole('link', { name: 'Demo biosignal scholar' }),
  ).toBeNull()
  expect(
    screen.queryByRole('link', {
      name: 'Patient-level validation with small cohorts',
    }),
  ).toBeNull()
  expect(
    screen.queryByRole('link', { name: 'Modular fluorescence microscope' }),
  ).toBeNull()
  expect(
    screen.getByRole('link', {
      name: 'Which tests changed your hydrogel design?',
    }),
  ).toBeDefined()
  cleanup()
  c.data.profiles[1].membership = 'approved'
  c.data.profiles[2].visibility = 'public'
  c.data.blocks = [{ user_id: demoUserId, target_id: c.data.profiles[1].id }]
  render(
    <MemoryRouter>
      <Explore c={c} query="" setQuery={vi.fn()} />
    </MemoryRouter>,
  )
  expect(
    screen.queryByRole('link', { name: 'Demo optical engineer' }),
  ).toBeNull()
  expect(
    screen.queryByRole('link', { name: 'Demo biosignal scholar' }),
  ).toBeNull()
})
it('Explore respects authoritative search IDs and renders a useful empty category', () => {
  const c = community()
  c.searchResults = {
    query: 'microscope',
    posts: [],
    profiles: [],
    projects: [],
    papers: [],
  }
  render(
    <MemoryRouter>
      <Explore c={c} query="microscope" setQuery={vi.fn()} />
    </MemoryRouter>,
  )
  expect(
    screen.queryByRole('link', { name: 'Modular fluorescence microscope' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Papers', exact: true }))
  expect(
    screen.getByRole('link', { name: 'Search scholarly sources →' }),
  ).toBeDefined()
})
it('Trust exposes only authorized queues; academic filter preserves confirmation and cancellation', async () => {
  const c = community()
  c.data.roles = [{ user_id: demoUserId, role: 'reviewer' }]
  c.data.applications = [
    {
      id: 'review-1',
      user_id: c.data.profiles[1].id,
      degree: 'PG',
      discipline: 'Biomedical Engineering',
      institution: 'Example University',
      year: 2026,
      result_status: 'completed',
      private_marks: '',
      status: 'pending',
      reason: '',
      created_at: '2026-10-10T00:00:00Z',
    },
  ]
  render(<Trust c={c} />)
  expect(screen.queryByRole('option', { name: 'Administration' })).toBeNull()
  expect(screen.queryByRole('option', { name: 'Content & appeals' })).toBeNull()
  fireEvent.change(screen.getByLabelText('Review queue'), {
    target: { value: 'academic' },
  })
  expect(
    screen.getByRole('heading', { name: 'Academic review & appeals' }),
  ).toBeDefined()
  fireEvent.change(
    screen.getByLabelText('Decision reason (minimum 5 characters)'),
    { target: { value: 'Degree details reviewed' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'approved', exact: true }))
  expect(
    screen.getByRole('dialog', { name: 'Confirm review decision' }),
  ).toBeDefined()
  expect(c.action).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel', exact: true }))
  expect(c.action).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'approved', exact: true }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Confirm & record decision' }),
  )
  await waitFor(() =>
    expect(c.action).toHaveBeenCalledWith('review', {
      application_id: 'review-1',
      status: 'approved',
      reason: 'Degree details reviewed',
    }),
  )
})
it('Suspended reviewers receive the existing denied state', () => {
  const c = community()
  c.user!.suspended = true
  c.data.roles = [{ user_id: demoUserId, role: 'admin' }]
  render(<Trust c={c} />)
  expect(screen.getByRole('alert').textContent).toContain('Access denied')
  expect(screen.queryByLabelText('Review queue')).toBeNull()
})

it('Paper card preserves provenance, routes save/unsave, and discusses the exact record', () => {
  const c = community()
  const p: Paper = {
    id: 'fixture-paper',
    title: 'Synthetic metadata fixture — not a real paper',
    authors: ['Test fixture'],
    venue: 'Fixture venue',
    published: '2026-01-01',
    doi: '',
    pmid: '',
    source: 'Fixture provider',
    source_url: 'https://example.org/fixture',
    retrieved_at: '2026-10-10T00:00:00Z',
    abstract_available: false,
    correction: '',
  }
  const discuss = vi.fn()
  render(<PaperMetadataCard c={c} p={p} onDiscuss={discuss} />)
  expect(
    screen.getByText('Fixture provider · Bibliographic metadata'),
  ).toBeDefined()
  expect(
    screen.getByRole('link', { name: 'Canonical record' }).getAttribute('href'),
  ).toBe(p.source_url)
  fireEvent.click(screen.getByRole('button', { name: 'Save scholarly record' }))
  expect(c.action).toHaveBeenCalledWith('paper', { paper: p, paper_id: p.id })
  fireEvent.click(
    screen.getByRole('button', { name: 'Create journal discussion' }),
  )
  expect(discuss).toHaveBeenCalledWith(p)
  cleanup()
  c.data.paper_saves = [{ user_id: demoUserId, paper_id: p.id }]
  render(<PaperMetadataCard c={c} p={p} />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Unsave scholarly record' }),
  )
  expect(c.action).toHaveBeenCalledWith('unsave_paper', {
    paper: p,
    paper_id: p.id,
  })
})
it('Paper card refuses unsafe canonical links and disables restricted-user actions', () => {
  const c = community()
  c.user!.suspended = true
  const p: Paper = {
    id: 'fixture',
    title: 'Unsafe URL fixture',
    authors: [],
    venue: '',
    published: '',
    doi: '',
    pmid: '',
    source: 'Fixture',
    source_url: 'javascript:alert(1)',
    retrieved_at: '2026-10-10T00:00:00Z',
    abstract_available: false,
    correction: '',
  }
  render(<PaperMetadataCard c={c} p={p} onDiscuss={vi.fn()} />)
  expect(screen.queryByRole('link')).toBeNull()
  expect(
    (
      screen.getByRole('button', {
        name: 'Save scholarly record',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true)
  expect(
    (
      screen.getByRole('button', {
        name: 'Create journal discussion',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true)
})
