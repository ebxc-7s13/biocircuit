import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import AmbientField from '../src/components/AmbientField'
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
it('pauses on visibility changes and releases its document listener on unmount', () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const remove = vi.spyOn(document, 'removeEventListener')
  vi.stubGlobal('matchMedia', () => ({ matches: false }))
  const { container, unmount } = render(<AmbientField paused />)
  expect(
    container.querySelector('.lab-field')?.getAttribute('aria-hidden'),
  ).toBe('true')
  hidden.mockReturnValue(true)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(
    container.querySelector('.lab-field')?.getAttribute('data-hidden'),
  ).toBe('true')
  expect(document.documentElement.dataset.visibility).toBe('hidden')
  hidden.mockReturnValue(false)
  document.dispatchEvent(new Event('visibilitychange'))
  expect(document.documentElement.dataset.visibility).toBe('visible')
  unmount()
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  expect(document.documentElement.dataset.visibility).toBeUndefined()
})
it('coalesces pointer input and cancels the pending frame when motion is paused', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  let callback: FrameRequestCallback | undefined
  const frame = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((fn) => {
      callback = fn
      return 23
    })
  const cancel = vi
    .spyOn(window, 'cancelAnimationFrame')
    .mockImplementation(() => {})
  const { container, rerender } = render(<AmbientField paused={false} />)
  window.dispatchEvent(
    new MouseEvent('pointermove', { clientX: 100, clientY: 140 }),
  )
  window.dispatchEvent(
    new MouseEvent('pointermove', { clientX: 240, clientY: 280 }),
  )
  expect(frame).toHaveBeenCalledTimes(1)
  callback?.(1)
  expect(
    (container.querySelector('.pointer-light') as HTMLElement).style.transform,
  ).toBe('translate3d(240px,280px,0)')
  window.dispatchEvent(
    new MouseEvent('pointermove', { clientX: 300, clientY: 350 }),
  )
  rerender(<AmbientField paused />)
  expect(cancel).toHaveBeenCalledWith(23)
  const calls = frame.mock.calls.length
  window.dispatchEvent(
    new MouseEvent('pointermove', { clientX: 900, clientY: 900 }),
  )
  expect(frame).toHaveBeenCalledTimes(calls)
})
