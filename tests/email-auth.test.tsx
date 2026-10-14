import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import EmailAuth from '../src/features/EmailAuth'
import {
  emailSchema,
  loginPasswordSchema,
  registrationPasswordSchema,
} from '../src/domain/validation'
const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
}))
vi.mock('../src/data/gateway', () => ({
  isDemo: false,
  getClient: async () => ({ auth }),
}))
afterEach(cleanup)
beforeEach(() => vi.resetAllMocks())
const renderForm = () => {
  const load = vi.fn().mockResolvedValue(undefined)
  render(
    <EmailAuth
      onAuthenticated={load}
      captchaReady={true}
      captchaToken=""
      onChallengeUsed={vi.fn()}
    />,
  )
  return load
}
const fill = () => {
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'fixture@example.test' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'Unit fixture password only' },
  })
}
it('validates email and registration passwords without trimming passwords or rejecting legacy login lengths', () => {
  expect(emailSchema.safeParse('bad-email').success).toBe(false)
  expect(emailSchema.parse(' fixture@example.test ')).toBe(
    'fixture@example.test',
  )
  expect(registrationPasswordSchema.safeParse('short').success).toBe(false)
  expect(registrationPasswordSchema.parse('  long passphrase  ')).toBe(
    '  long passphrase  ',
  )
  expect(loginPasswordSchema.safeParse('old-password').success).toBe(true)
})
it('shows validation before making an Auth request and toggles password visibility accessibly', () => {
  renderForm()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }))
  expect(screen.getByRole('alert').textContent).toContain('valid email')
  expect(auth.signInWithPassword).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
  expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text')
  fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
  expect(screen.getByLabelText('Password').getAttribute('type')).toBe(
    'password',
  )
})
it('registers through managed Auth, loads a real returned session and never supplies phone or academic flags', async () => {
  auth.signUp.mockResolvedValue({
    data: { session: { fixture: true } },
    error: null,
  })
  const load = renderForm()
  fireEvent.click(
    screen.getByRole('button', { name: 'New here? Create an account' }),
  )
  fill()
  fireEvent.click(
    screen.getByRole('button', { name: 'Create account', exact: true }),
  )
  await waitFor(() => expect(load).toHaveBeenCalledOnce())
  expect(Object.keys(auth.signUp.mock.calls[0][0])).toEqual([
    'email',
    'password',
  ])
  expect(screen.getByRole('status').textContent).toContain(
    'Phone and academic eligibility remain separate',
  )
  expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe('')
})
it('reports confirmation instead of inventing a session when signup returns no session', async () => {
  auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
  const load = renderForm()
  fireEvent.click(
    screen.getByRole('button', { name: 'New here? Create an account' }),
  )
  fill()
  fireEvent.click(
    screen.getByRole('button', { name: 'Create account', exact: true }),
  )
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain(
      'No signed-in session',
    ),
  )
  expect(load).not.toHaveBeenCalled()
})
it('keeps duplicate signup and invalid credentials generic, and supports switching back to login', async () => {
  auth.signUp.mockResolvedValue({
    error: { code: 'user_already_exists', message: 'private backend content' },
  })
  auth.signInWithPassword.mockResolvedValue({
    error: { code: 'invalid_credentials' },
  })
  const load = renderForm()
  fireEvent.click(
    screen.getByRole('button', { name: 'New here? Create an account' }),
  )
  fill()
  fireEvent.click(
    screen.getByRole('button', { name: 'Create account', exact: true }),
  )
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain(
      'If you already registered',
    ),
  )
  expect(screen.getByRole('alert').textContent).not.toContain('private backend')
  fireEvent.click(
    screen.getByRole('button', { name: 'Already registered? Sign in' }),
  )
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }))
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('Sign-in failed'),
  )
  expect(load).not.toHaveBeenCalled()
})
it('fails closed when a configured CAPTCHA has not completed', () => {
  render(
    <EmailAuth
      onAuthenticated={vi.fn()}
      captchaReady={false}
      captchaToken=""
      onChallengeUsed={vi.fn()}
    />,
  )
  expect(
    (
      screen.getByRole('button', {
        name: 'Sign in with email',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true)
  expect(auth.signInWithPassword).not.toHaveBeenCalled()
})
it('handles transport failure without logging private error details or leaving the form busy', async () => {
  auth.signInWithPassword.mockRejectedValue(Error('sensitive network payload'))
  renderForm()
  fill()
  fireEvent.click(screen.getByRole('button', { name: 'Sign in with email' }))
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain(
      'Check your connection',
    ),
  )
  expect(
    (
      screen.getByRole('button', {
        name: 'Sign in with email',
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(false)
})
