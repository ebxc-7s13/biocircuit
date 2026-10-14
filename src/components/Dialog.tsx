import { useEffect, useRef, useId } from 'react'
import type { ReactNode } from 'react'
export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const previous = useRef(document.activeElement as HTMLElement | null)
  const titleId = useId()
  useEffect(() => {
    const el = ref.current
    el?.showModal()
    const invoker = previous.current
    return () => {
      el?.close()
      queueMicrotask(() => {
        if (invoker?.isConnected && !document.querySelector('dialog[open]'))
          invoker.focus()
      })
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect()
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose()
        }
      }}
    >
      <header className="dialog-head">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}
