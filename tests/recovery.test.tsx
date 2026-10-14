import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import Recovery from '../src/features/Recovery'
const auth = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  setSession: vi.fn(),
}))
vi.mock('../src/data/gateway', () => ({
  isDemo: false,
  getClient: async () => ({ auth }),
}))
afterEach(cleanup)
const session = (id = 'test-owner', sid = 'unit-recovery-session') => ({
  access_token: `unit.${btoa(JSON.stringify({ session_id: sid }))}.fixture`,
  user: { id },
})
beforeEach(() => {
  vi.resetAllMocks()
  auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
  auth.getSession.mockResolvedValue({
    error: null,
    data: { session: session() },
  })
})
const request = async () => {
  render(<Recovery />)
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'recovery@example.test' },
  })
  auth.resetPasswordForEmail.mockResolvedValue({ error: null })
  fireEvent.click(
    screen.getByRole('button', { name: 'Request recovery email' }),
  )
  await screen.findByLabelText('Recovery code')
}
it('rejects malformed addresses before Auth and does not expose a password editor to an existing session', () => {
  render(<Recovery />)
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'invalid' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Request recovery email' }),
  )
  expect(screen.getByRole('alert').textContent).toContain('valid email')
  expect(auth.resetPasswordForEmail).not.toHaveBeenCalled()
  expect(screen.queryByLabelText('New password')).toBeNull()
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('requests managed recovery without claiming delivery or revealing account existence; invalid OTP cannot update a password', async () => {
  await request()
  expect(auth.resetPasswordForEmail).toHaveBeenCalledWith(
    'recovery@example.test',
    { redirectTo: window.location.origin + '/account/recovery' },
  )
  expect(screen.getByRole('status').textContent).toContain(
    'does not confirm account existence or email delivery',
  )
  auth.verifyOtp.mockResolvedValue({ error: { code: 'otp_expired' }, data: {} })
  fireEvent.change(screen.getByLabelText('Recovery code'), {
    target: { value: '12345678' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify recovery code' }))
  await screen.findByRole('alert')
  expect(auth.verifyOtp).toHaveBeenCalledWith({
    email: 'recovery@example.test',
    token: '12345678',
    type: 'recovery',
  })
  expect(auth.updateUser).not.toHaveBeenCalled()
  expect(screen.queryByLabelText('New password')).toBeNull()
})
it('requires a matching managed identity and password confirmation; signs out only after successful password update', async () => {
  await request()
  auth.verifyOtp.mockResolvedValue({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.change(screen.getByLabelText('Recovery code'), {
    target: { value: '12345678' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify recovery code' }))
  await screen.findByLabelText('New password')
  fireEvent.change(screen.getByLabelText('New password'), {
    target: { value: 'Unit fixture passphrase' },
  })
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'different value' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  expect(auth.updateUser).not.toHaveBeenCalled()
  fireEvent.change(screen.getByLabelText('Confirm new password'), {
    target: { value: 'Unit fixture passphrase' },
  })
  auth.updateUser.mockResolvedValue({ error: null })
  auth.signOut.mockResolvedValue({ error: null })
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  await waitFor(() =>
    expect(auth.updateUser).toHaveBeenCalledWith({
      password: 'Unit fixture passphrase',
    }),
  )
  await waitFor(() => expect(auth.signOut).toHaveBeenCalledTimes(1))
  expect(screen.queryByLabelText('New password')).toBeNull()
})
it('fails closed if identity changes after recovery verification; does not leak raw server errors', async () => {
  await request()
  auth.verifyOtp.mockResolvedValue({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  auth.getUser
    .mockResolvedValueOnce({
      error: null,
      data: { user: { id: 'test-owner' } },
    })
    .mockResolvedValue({ error: null, data: { user: { id: 'other-session' } } })
  fireEvent.change(screen.getByLabelText('Recovery code'), {
    target: { value: '12345678' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify recovery code' }))
  await screen.findByLabelText('New password')
  for (const label of ['New password', 'Confirm new password'])
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'Unit fixture passphrase' },
    })
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  await screen.findByRole('alert')
  expect(auth.updateUser).not.toHaveBeenCalled()
})

it('handles a hash link only after explicit continuation and a managed matching session', async () => {
  const hash = 'a'.repeat(56)
  render(<Recovery callback={{ tokenHash: hash, invalid: false }} />)
  expect(auth.verifyOtp).not.toHaveBeenCalled()
  expect(screen.queryByLabelText('New password')).toBeNull()
  auth.verifyOtp.mockResolvedValue({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await screen.findByLabelText('New password')
  expect(auth.verifyOtp).toHaveBeenCalledWith({
    token_hash: hash,
    type: 'recovery',
  })
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('never accepts a normal password session disguised as a default recovery fragment', async () => {
  const accessToken =
    'unit.' +
    btoa(
      JSON.stringify({
        session_id: 'unit-session',
        amr: [{ method: 'password' }],
      }),
    ) +
    '.fixture'
  render(
    <Recovery
      callback={{
        tokenHash: null,
        invalid: false,
        fragment: { accessToken, refreshToken: 'unit-refresh-fixture' },
      }}
    />,
  )
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await screen.findByRole('alert')
  expect(auth.setSession).not.toHaveBeenCalled()
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('requires hosted verification and recovery AMR before accepting default sender links', async () => {
  const managedSession = {
    ...session(),
    access_token:
      'unit.' +
      btoa(
        JSON.stringify({
          session_id: 'unit-recovery-session',
          amr: [{ method: 'recovery' }],
        }),
      ) +
      '.fixture',
  }
  render(
    <Recovery
      callback={{
        tokenHash: null,
        invalid: false,
        fragment: {
          accessToken: managedSession.access_token,
          refreshToken: 'unit-refresh-fixture',
        },
      }}
    />,
  )
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  auth.setSession.mockResolvedValue({
    error: null,
    data: { session: managedSession, user: { id: 'test-owner' } },
  })
  auth.getSession.mockResolvedValue({
    error: null,
    data: { session: managedSession },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await screen.findByLabelText('New password')
  expect(auth.getUser).toHaveBeenCalledWith(managedSession.access_token)
  expect(auth.setSession).toHaveBeenCalledTimes(1)
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('accepts a real hosted email-link session (amr otp after recovery_sent_at) and opens the editor', async () => {
  const issued = Math.floor(Date.now() / 1000) - 5
  const managedSession = {
    ...session(),
    access_token:
      'unit.' +
      btoa(
        JSON.stringify({
          session_id: 'unit-otp-session',
          amr: [{ method: 'otp', timestamp: issued }],
        }),
      ) +
      '.fixture',
  }
  render(
    <Recovery
      callback={{
        tokenHash: null,
        invalid: false,
        fragment: {
          accessToken: managedSession.access_token,
          refreshToken: 'unit-refresh-fixture',
        },
      }}
    />,
  )
  auth.getUser.mockResolvedValue({
    error: null,
    data: {
      user: {
        id: 'test-owner',
        recovery_sent_at: new Date((issued - 120) * 1000).toISOString(),
      },
    },
  })
  auth.setSession.mockResolvedValue({
    error: null,
    data: { session: managedSession, user: { id: 'test-owner' } },
  })
  auth.getSession.mockResolvedValue({
    error: null,
    data: { session: managedSession },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await screen.findByLabelText('New password')
  expect(auth.setSession).toHaveBeenCalledTimes(1)
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it.each(['link', 'code'])(
  'keeps the recovery editor when the client announces SIGNED_IN for the adopted session (%s)',
  async (path) => {
    // Hosted supabase-js emits SIGNED_IN after setSession/verifyOtp, before the
    // page has finished its own identity checks. That must not reset recovery.
    const issued = Math.floor(Date.now() / 1000) - 5
    const adopted = {
      ...session(),
      access_token:
        'unit.' +
        btoa(
          JSON.stringify({
            session_id: 'unit-recovery-session',
            amr: [{ method: 'otp', timestamp: issued }],
          }),
        ) +
        '.fixture',
    }
    const emit = () =>
      setTimeout(() =>
        auth.onAuthStateChange.mock.calls.at(-1)![0]('SIGNED_IN', adopted),
      )
    const result = () => {
      emit()
      return Promise.resolve({
        error: null,
        data: { session: adopted, user: { id: 'test-owner' } },
      })
    }
    auth.setSession.mockImplementation(result)
    auth.verifyOtp.mockImplementation(result)
    auth.getSession.mockResolvedValue({
      error: null,
      data: { session: adopted },
    })
    // Identity checks resolve after the event has been delivered.
    auth.getUser.mockImplementation(
      () =>
        new Promise((done) =>
          setTimeout(
            () =>
              done({
                error: null,
                data: {
                  user: {
                    id: 'test-owner',
                    recovery_sent_at: new Date(
                      (issued - 60) * 1000,
                    ).toISOString(),
                  },
                },
              }),
            20,
          ),
        ),
    )
    if (path === 'link') {
      render(
        <Recovery
          callback={{
            tokenHash: null,
            invalid: false,
            fragment: {
              accessToken: adopted.access_token,
              refreshToken: 'unit-refresh-fixture',
            },
          }}
        />,
      )
      await waitFor(() => expect(auth.onAuthStateChange).toHaveBeenCalled())
      fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
    } else {
      auth.resetPasswordForEmail.mockResolvedValue({ error: null })
      await request()
      fireEvent.change(screen.getByLabelText('Recovery code'), {
        target: { value: '12345678' },
      })
      fireEvent.click(
        screen.getByRole('button', { name: 'Verify recovery code' }),
      )
    }
    await screen.findByLabelText('New password')
    expect(screen.queryByRole('alert')).toBeNull()
    // A different account signing in afterwards still clears the editor.
    auth.onAuthStateChange.mock.calls.at(-1)![0](
      'SIGNED_IN',
      session('other-user', 'other-session'),
    )
    await waitFor(() =>
      expect(screen.queryByLabelText('New password')).toBeNull(),
    )
    expect(auth.updateUser).not.toHaveBeenCalled()
  },
)
it('refuses an otp session when the verified user has no recorded recovery email', async () => {
  const accessToken =
    'unit.' +
    btoa(
      JSON.stringify({
        session_id: 'unit-otp-session',
        amr: [{ method: 'otp', timestamp: Math.floor(Date.now() / 1000) }],
      }),
    ) +
    '.fixture'
  render(
    <Recovery
      callback={{
        tokenHash: null,
        invalid: false,
        fragment: { accessToken, refreshToken: 'unit-refresh-fixture' },
      }}
    />,
  )
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await screen.findByRole('alert')
  expect(auth.setSession).not.toHaveBeenCalled()
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it.each([
  null,
  { code: 'email_address_not_authorized', message: 'Private upstream text' },
])(
  'presents identical generic delivery wording despite provider outcome: %j',
  async (error) => {
    render(<Recovery />)
    auth.resetPasswordForEmail.mockResolvedValue({ error })
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'recovery@example.test' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Request recovery email' }),
    )
    await screen.findByLabelText('Recovery code')
    expect(screen.getByRole('status').textContent).toContain(
      'does not confirm account existence or email delivery',
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.queryByText('Private upstream text')).toBeNull()
  },
)
it('blocks duplicate in-flight requests and preserves a bounded resend cooldown after cancellation', async () => {
  let resolve!: (value: { error: null }) => void
  auth.resetPasswordForEmail.mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  render(<Recovery />)
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'recovery@example.test' },
  })
  const form = screen
    .getByRole('button', { name: 'Request recovery email' })
    .closest('form')!
  fireEvent.submit(form)
  fireEvent.submit(form)
  await waitFor(() =>
    expect(auth.resetPasswordForEmail).toHaveBeenCalledTimes(1),
  )
  resolve({ error: null })
  await screen.findByLabelText('Recovery code')
  fireEvent.click(screen.getByRole('button', { name: 'Cancel recovery' }))
  expect(screen.getByRole('status').textContent).toContain(
    'No password was changed',
  )
  expect(
    screen
      .getByRole('button', { name: /Request again in/ })
      .hasAttribute('disabled'),
  ).toBe(true)
  expect(auth.updateUser).not.toHaveBeenCalled()
})
it('rejects a new session for the same user and clears the password editor on signout', async () => {
  await request()
  auth.verifyOtp.mockResolvedValue({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.change(screen.getByLabelText('Recovery code'), {
    target: { value: '12345678' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify recovery code' }))
  await screen.findByLabelText('New password')
  for (const label of ['New password', 'Confirm new password'])
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'Unit fixture passphrase' },
    })
  auth.getSession.mockResolvedValue({
    error: null,
    data: { session: session('test-owner', 'different-session') },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  await screen.findByRole('alert')
  expect(auth.updateUser).not.toHaveBeenCalled()
  auth.onAuthStateChange.mock.calls.at(-1)![0]('SIGNED_OUT', null)
  await waitFor(() =>
    expect(screen.queryByLabelText('New password')).toBeNull(),
  )
})
it('accepts a previously delivered code without resending or claiming verification', async () => {
  render(<Recovery />)
  fireEvent.click(screen.getByRole('button', { name: 'I already have a code' }))
  expect(screen.getByRole('alert').textContent).toContain('valid email')
  fireEvent.change(screen.getByLabelText('Email address'), {
    target: { value: 'recovery@example.test' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'I already have a code' }))
  await screen.findByLabelText('Recovery code')
  expect(screen.getByRole('status').textContent).toContain(
    'No new email was requested',
  )
  expect(auth.resetPasswordForEmail).not.toHaveBeenCalled()
  expect(auth.verifyOtp).not.toHaveBeenCalled()
  expect(auth.updateUser).not.toHaveBeenCalled()
  expect(screen.queryByLabelText('New password')).toBeNull()
})
it('preserves a verified recovery editor for same-session refocus and token renewal', async () => {
  await request()
  auth.verifyOtp.mockResolvedValue({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  auth.getUser.mockResolvedValue({
    error: null,
    data: { user: { id: 'test-owner' } },
  })
  fireEvent.change(screen.getByLabelText('Recovery code'), {
    target: { value: '12345678' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Verify recovery code' }))
  await screen.findByLabelText('New password')
  auth.onAuthStateChange.mock.calls.at(-1)![0]('SIGNED_IN', session())
  auth.onAuthStateChange.mock.calls.at(-1)![0]('TOKEN_REFRESHED', session())
  expect(screen.getByLabelText('New password')).toBeTruthy()
  for (const label of ['New password', 'Confirm new password'])
    fireEvent.change(screen.getByLabelText(label), {
      target: { value: 'Unit fixture passphrase' },
    })
  auth.updateUser.mockResolvedValue({ error: null })
  auth.signOut.mockResolvedValue({ error: null })
  fireEvent.click(screen.getByRole('button', { name: 'Update password' }))
  await waitFor(() => expect(auth.updateUser).toHaveBeenCalledTimes(1))
})
it('does not finish late verification after component unmount', async () => {
  let resolve!: (value: unknown) => void
  auth.verifyOtp.mockReturnValue(
    new Promise((done) => {
      resolve = done
    }),
  )
  const view = render(
    <Recovery callback={{ tokenHash: 'a'.repeat(56), invalid: false }} />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Continue recovery' }))
  await waitFor(() => expect(auth.verifyOtp).toHaveBeenCalledTimes(1))
  view.unmount()
  resolve({
    error: null,
    data: { session: session(), user: { id: 'test-owner' } },
  })
  await Promise.resolve()
  await Promise.resolve()
  expect(auth.getUser).not.toHaveBeenCalled()
  expect(auth.updateUser).not.toHaveBeenCalled()
})
