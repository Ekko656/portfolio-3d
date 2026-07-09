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
  ctx.fillStyle = '#8c7f66' // warm sealed-concrete mid-tone (reads as a material)
  ctx.fillRect(0, 0, 512, 512)
  // mottling
  for (let i = 0; i < 1400; i++) {
    const r = 6 + Math.random() * 34
    const g = 96 + Math.floor(Math.random() * 40)
    ctx.fillStyle = `rgba(${g + 6},${g},${g - 14},${0.08 + Math.random() * 0.08})`
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
  ctx.fillStyle = '#a8874f' // OSB / plywood tan (reads as a material)
  ctx.fillRect(0, 0, 512, 512)
  for (let y = 0; y < 512; y += 2) {
    const shade = 110 + Math.floor(Math.sin(y * 0.08) * 14 + Math.random() * 24)
    ctx.strokeStyle = `rgba(${shade + 20},${shade},${shade - 40},0.4)`
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

/** Worn workbench wood top: planks with grain, scuffs and stains. */
export function workbenchTexture(repeat: [number, number] = [2, 1]) {
  const { c, ctx } = canvas(512)
  ctx.fillStyle = '#8a6338'
  ctx.fillRect(0, 0, 512, 512)
  // planks
  const planks = 5
  for (let p = 0; p < planks; p++) {
    const y0 = (p / planks) * 512
    const base = 120 + Math.floor(Math.random() * 34)
    ctx.fillStyle = `rgb(${base + 24},${base - 6},${base - 44})`
    ctx.fillRect(0, y0, 512, 512 / planks - 2)
    // grain streaks
    for (let i = 0; i < 60; i++) {
      const yy = y0 + Math.random() * (512 / planks)
      ctx.strokeStyle = `rgba(${20 + Math.random() * 20},${12 + Math.random() * 12},6,0.18)`
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(0, yy)
      for (let x = 0; x <= 512; x += 24) ctx.lineTo(x, yy + Math.sin(x * 0.05 + p) * 2)
      ctx.stroke()
    }
    // plank seam
    ctx.strokeStyle = 'rgba(10,6,3,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, y0)
    ctx.lineTo(512, y0)
    ctx.stroke()
  }
  // scuffs, stains, tool marks
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const r = 4 + Math.random() * 22
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(10,6,3,${0.1 + Math.random() * 0.15})`)
    g.addColorStop(1, 'rgba(10,6,3,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return finish(c, repeat)
}

/** Corrugated / joisted ceiling boards, warm dark. */
export function ceilingTexture(repeat: [number, number] = [8, 6]) {
  const { c, ctx } = canvas(256)
  ctx.fillStyle = '#4a3826' // warm wood boards
  ctx.fillRect(0, 0, 256, 256)
  for (let x = 0; x < 256; x += 32) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(x, 0, 3, 256)
    ctx.fillStyle = 'rgba(120,96,62,0.18)'
    ctx.fillRect(x + 4, 0, 2, 256)
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
