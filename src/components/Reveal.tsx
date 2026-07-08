import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '../lib/motion'

type Props = {
  children: ReactNode
  className?: string
  /** Animate direct children with a stagger instead of the wrapper itself. */
  stagger?: boolean
  /** Seconds of delay before the reveal begins. */
  delay?: number
  /** Rise distance in px. */
  y?: number
}

/**
 * Scroll-reveal wrapper: fades + rises into place as it enters the viewport.
 * Subtle by design (0.6s, power3.out, 24px). Under reduced motion it renders
 * everything static. Uses useGSAP for automatic cleanup.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  y = 24,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !ref.current) return
      const targets = stagger
        ? (Array.from(ref.current.children) as HTMLElement[])
        : ref.current

      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.6,
        ease: 'power3.out',
        delay,
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 85%',
          once: true,
        },
      })
    },
    { scope: ref },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
