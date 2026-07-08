import { useRef } from 'react'
import { gsap, prefersReducedMotion, isMobile } from '../lib/motion'
import type { Project } from '../data/projects'

type Props = { project: Project }

/**
 * Project card with a cursor-following 3D tilt, an accent border-glow, and a
 * media preview that lifts on hover. Tilt is disabled on touch / reduced motion.
 */
export default function ProjectCard({ project }: Props) {
  const card = useRef<HTMLAnchorElement>(null)
  const glow = useRef<HTMLDivElement>(null)
  const disabled = prefersReducedMotion() || isMobile()

  const onMove = (e: React.MouseEvent) => {
    if (disabled || !card.current) return
    const r = card.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    gsap.to(card.current, {
      rotateY: (px - 0.5) * 7,
      rotateX: (0.5 - py) * 7,
      duration: 0.5,
      ease: 'power2.out',
      transformPerspective: 900,
    })
    if (glow.current) {
      glow.current.style.background = `radial-gradient(420px circle at ${px * 100}% ${py * 100}%, rgba(126,159,218,0.16), transparent 55%)`
    }
  }

  const onLeave = () => {
    if (!card.current) return
    gsap.to(card.current, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' })
    if (glow.current) glow.current.style.background = 'transparent'
  }

  return (
    <a
      href={project.links[0]?.href ?? '#'}
      target={project.links[0] ? '_blank' : undefined}
      rel="noreferrer"
      data-interactive
      className="group block [transform-style:preserve-3d]"
      ref={card}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="panel-interactive relative h-full overflow-hidden p-px">
        <div ref={glow} className="pointer-events-none absolute inset-0 z-10 transition-[background] duration-300" />

        {/* media */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-t-lg border-b border-hair bg-deep">
          {project.media?.type === 'video' ? (
            <video
              className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              src={project.media.src}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : project.media ? (
            <img
              className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
              src={project.media.src}
              alt={project.title}
              loading="lazy"
            />
          ) : null}
          <span className="absolute left-3 top-3 rounded bg-base/70 px-2 py-1 font-sans text-[0.65rem] uppercase tracking-[0.15em] text-accent backdrop-blur-sm">
            {project.tag}
          </span>
        </div>

        {/* body */}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="font-display text-lg font-bold text-ink">{project.title}</h3>
            <span className="h-px flex-1 bg-hair" />
            <span className="text-accent transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-muted">{project.blurb}</p>
          <div className="flex flex-wrap gap-1.5">
            {project.stack.map((s) => (
              <span
                key={s}
                className="rounded border border-hair px-2 py-0.5 font-sans text-[0.65rem] text-muted"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </a>
  )
}
