import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

// Register GSAP plugins exactly once at module load.
gsap.registerPlugin(ScrollTrigger, useGSAP)

export { gsap, ScrollTrigger }

/** True when the user has asked the OS to minimize motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Coarse pointer / small viewport ⇒ treat as mobile for perf fallbacks. */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(max-width: 767px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  )
}
