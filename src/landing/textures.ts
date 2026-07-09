import * as THREE from 'three'

/**
 * Procedural canvas textures so the workshop surfaces read as real materials
 * (concrete, plywood, pegboard) without shipping any external image assets.
 */

function canvas(size = 512) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return { c, ctx: c.getContext('2d')! }
}

function finish(c: HTMLCanvasElement, repeat: [number, number]) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 4
  return t
}

/** Poured concrete: mottled base, speckle aggregate, faint cracks + stains. */
export function concreteTexture(repeat: [number, number] = [6, 6]) {
  const { c, ctx } = canvas(512)
  ctx.fillStyle = '#26231d'
  ctx.fillRect(0, 0, 512, 512)
  // mottling
  for (let i = 0; i < 1400; i++) {
    const r = 6 + Math.random() * 34
    const g = 24 + Math.floor(Math.random() * 18)
    ctx.fillStyle = `rgba(${g + 6},${g + 3},${g},${0.05 + Math.random() * 0.06})`
    ctx.beginPath()
    ctx.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2)
    ctx.fill()
  }
  // fine aggregate speckle
  for (let i = 0; i < 5000; i++) {
    const v = Math.random()
    ctx.fillStyle = v > 0.5 ? 'rgba(60,56,48,0.5)' : 'rgba(10,9,7,0.5)'
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5)
  }
  // cracks
  ctx.strokeStyle = 'rgba(8,7,6,0.55)'
  for (let i = 0; i < 5; i++) {
    ctx.lineWidth = 0.6 + Math.random()
    ctx.beginPath()
    let x = Math.random() * 512
    let y = Math.random() * 512
    ctx.moveTo(x, y)
    const steps = 8 + Math.floor(Math.random() * 10)
    for (let s = 0; s < steps; s++) {
      x += (Math.random() - 0.5) * 90
      y += (Math.random() - 0.5) * 90
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  // oil stains
  for (let i = 0; i < 4; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 30 + Math.random() * 70
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(6,5,4,0.35)')
    g.addColorStop(1, 'rgba(6,5,4,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return finish(c, repeat)
}

/** Plywood sheeting: horizontal grain streaks + occasional knots. */
export function plywoodTexture(repeat: [number, number] = [3, 2]) {
  const { c, ctx } = canvas(512)
  ctx.fillStyle = '#3a2e1f'
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 2) {
    const shade = 30 + Math.floor(Math.sin(y * 0.08) * 8 + Math.random() * 14)
    ctx.strokeStyle = `rgba(${shade + 26},${shade + 16},${shade},0.5)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y + Math.sin(y * 0.3) * 1.5)
    for (let x = 0; x <= 512; x += 16) ctx.lineTo(x, y + Math.sin((x + y) * 0.02) * 2)
    ctx.stroke()
  }
  // knots
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    for (let r = 10; r > 0; r -= 2) {
      ctx.strokeStyle = `rgba(20,14,8,${0.1 + (10 - r) * 0.03})`
      ctx.beginPath()
      ctx.ellipse(x, y, r, r * 0.6, Math.random(), 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  return finish(c, repeat)
}

/** Pegboard: tan board with a regular grid of dark holes. */
export function pegboardTexture(repeat: [number, number] = [4, 2]) {
  const { c, ctx } = canvas(512)
  ctx.fillStyle = '#5a4a31'
  ctx.fillRect(0, 0, 512, 512)
  // subtle board grain
  for (let i = 0; i < 800; i++) {
    ctx.fillStyle = `rgba(${60 + Math.random() * 30},${48 + Math.random() * 24},${30},0.12)`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 1)
  }
  const step = 32
  for (let x = step / 2; x < 512; x += step) {
    for (let y = step / 2; y < 512; y += step) {
      ctx.fillStyle = '#171208'
      ctx.beginPath()
      ctx.arc(x, y, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(90,74,49,0.6)' // slight bevel highlight
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(x, y - 0.6, 5, Math.PI, Math.PI * 2)
      ctx.stroke()
    }
  }
  return finish(c, repeat)
}
