import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function Optics() {
  return (
    <svg className="preview-optics" viewBox="0 0 160 88" role="presentation">
      <path d="M0 44H160M80 0V88M10 8H150V80H10Z" />
      <circle cx="80" cy="44" r="32" />
      <circle cx="80" cy="44" r="23" />
      <circle cx="80" cy="44" r="9" />
      <path d="M12 18L148 70M12 70L148 18M48 8L112 80M48 80L112 8" />
      <circle cx="80" cy="44" r="3" className="optics-core" />
    </svg>
  )
}
/** Original illustrative preview; does not fetch or expose private project images. */
export default function ProjectPreview({
  id,
  title,
  stage,
}: {
  id: string
  title: string
  stage: string
}) {
  const link = useRef<HTMLAnchorElement>(null)
  const group = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const element = link.current,
      part = group.current
    if (!element || !part) return
    const measure = () => {
      const width = part.getBoundingClientRect().width
      element.style.setProperty('--marquee-distance', width + 'px')
      element.style.setProperty('--marquee-duration', width / 90 + 's')
    }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(part)
    const visible = new IntersectionObserver(([entry]) => {
      element.dataset.visible = String(entry.isIntersecting)
    })
    visible.observe(element)
    return () => {
      resize.disconnect()
      visible.disconnect()
    }
  }, [])
  return (
    <Link
      ref={link}
      className="project-preview"
      to={'/project/' + id}
      aria-label={'Preview project: ' + title}
    >
      <span className="preview-rest" aria-hidden="true">
        <span>
          <small>PROJECT PREVIEW / ILLUSTRATIVE OPTICS</small>
          <strong>{title}</strong>
        </span>
        <span className="preview-arrow">↗</span>
      </span>
      <span className="preview-band" aria-hidden="true">
        <span className="preview-track">
          <span className="preview-marquee">
            {[0, 1].map((i) => (
              <span
                className="preview-part"
                ref={i === 0 ? group : undefined}
                key={i}
              >
                <strong>{title}</strong>
                <Optics />
                <span className="preview-stage">
                  {stage}
                  <span>View workspace ↗</span>
                </span>
                <Optics />
              </span>
            ))}
          </span>
        </span>
      </span>
    </Link>
  )
}
