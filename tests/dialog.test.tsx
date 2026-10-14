import { it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog } from '../src/components/Dialog'
it('labels a native modal and closes through its visible alternative', () => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '')
  })
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  })
  const close = vi.fn()
  render(
    <Dialog title="Review application" onClose={close}>
      <p>Private review</p>
    </Dialog>,
  )
  expect(
    screen.getByRole('dialog', { name: 'Review application' }),
  ).toBeDefined()
  fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }))
  expect(close).toHaveBeenCalledOnce()
})
