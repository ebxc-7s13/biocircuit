import { useEffect, useRef } from 'react'

/** Decorative CSS field. Input listeners exist only while motion is enabled. */
export default function AmbientField({ paused }: { paused: boolean }) {
  const field = useRef<HTMLDivElement>(null)
  const light = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const element = field.current
    if (!element) return
    const visibility = () => {
      element.dataset.hidden = String(document.hidden)
      document.documentElement.dataset.visibility = document.hidden
        ? 'hidden'
        : 'visible'
    }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      delete document.documentElement.dataset.visibility
    }
  }, [])
  useEffect(() => {
    const fine = window.matchMedia(
      '(hover: hover) and (pointer: fine) and (min-width: 768px)',
    )
    let frame = 0
    let x = 0,
      y = 0
    const move = (e: PointerEvent) => {
      if (paused || document.hidden || !fine.matches) return
      x = e.clientX
      y = e.clientY
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          if (light.current)
            light.current.style.transform =
              'translate3d(' + x + 'px,' + y + 'px,0)'
        })
    }
    if (!paused) window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [paused])
  return (
    <div ref={field} className="lab-field" aria-hidden="true">
      <i />
      <i />
      <i />
      <span className="ambient-grid" />
      <span className="ambient-grain" />
      <span className="pointer-light" ref={light} />
      <svg viewBox="0 0 1200 800">
        <path d="M0 520C250 200 350 720 600 380S900 550 1200 170" />
        <circle cx="600" cy="380" r="68" />
        <path d="M0 540C250 220 350 740 600 400S900 570 1200 190" />
      </svg>
    </div>
  )
}
