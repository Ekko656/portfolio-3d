import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

/**
 * Ambient "signal field": a low-density grid of nodes drifting on a 2D canvas,
 * brightening and linking into short constellations near the cursor. Very low
 * opacity, cyan-steel tint — texture behind the hero, never a focal point.
 * Pauses when off-screen; static (no RAF) under reduced motion.
 */
export default function SignalField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = prefersReducedMotion()
    const SPACING = 46
    const mouse = { x: -9999, y: -9999 }
    let w = 0
    let h = 0
    let dpr = 1
    let nodes: { x: number; y: number; bx: number; by: number; ph: number }[] = []

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = rect.width
      h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      nodes = []
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = SPACING / 2; x < w; x += SPACING) {
          nodes.push({ x, y, bx: x, by: y, ph: Math.random() * Math.PI * 2 })
        }
      }
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    let raf = 0
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h)
      const time = t * 0.001
      const R = 150

      for (const n of nodes) {
        // gentle organic drift
        if (!reduce) {
          n.x = n.bx + Math.sin(time * 0.5 + n.ph) * 3
          n.y = n.by + Math.cos(time * 0.4 + n.ph) * 3
        }
        const dx = n.x - mouse.x
        const dy = n.y - mouse.y
        const d = Math.hypot(dx, dy)
        const prox = Math.max(0, 1 - d / R)

        const alpha = 0.1 + prox * 0.65
        const size = 0.9 + prox * 1.6
        ctx.beginPath()
        ctx.arc(n.x, n.y, size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(170, 192, 239, ${alpha})`
        ctx.fill()

        // link to the cursor when close — short constellation lines
        if (prox > 0.18) {
          ctx.beginPath()
          ctx.moveTo(n.x, n.y)
          ctx.lineTo(mouse.x, mouse.y)
          ctx.strokeStyle = `rgba(126, 159, 218, ${prox * 0.28})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
      raf = requestAnimationFrame(draw)
    }

    build()
    if (reduce) {
      draw(0)
      cancelAnimationFrame(raf)
    } else {
      window.addEventListener('pointermove', onMove)
      raf = requestAnimationFrame(draw)
    }
    window.addEventListener('resize', build)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', build)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
