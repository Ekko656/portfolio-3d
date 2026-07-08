import { useRef, type ReactNode } from 'react'
import { gsap, prefersReducedMotion, isMobile } from '../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  /** How far the element eases toward the cursor (fraction of offset). */
  strength?: number
}

/**
 * Wraps a single interactive element and eases it toward the cursor on hover,
 * snapping back on leave. No-op on touch / reduced motion.
 */
export default function Magnetic({ children, className, strength = 0.35 }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const disabled = prefersReducedMotion() || isMobile()

  const onMove = (e: React.MouseEvent) => {
    if (disabled || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - (r.left + r.width / 2)) * strength
    const y = (e.clientY - (r.top + r.height / 2)) * strength
    gsap.to(ref.current, { x, y, duration: 0.4, ease: 'power3.out' })
  }

  const onLeave = () => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
  }

  return (
    <span
      ref={ref}
      className={`inline-block ${className ?? ''}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </span>
  )
}
