import * as THREE from 'three'

/**
 * Procedurally generate matcap textures (no external assets). A matcap bakes a
 * whole studio lighting setup into a sphere image — the look Bruno Simon and
 * most premium WebGL scenes use to feel "rendered" without real lights/shadows.
 *
 * Each is a soft sphere: a bright highlight up-left, the body tone through the
 * middle, a dark falloff at the edge, and a faint cool rim bounce bottom-right.
 */
function makeMatcap(
  highlight: string,
  body: string,
  edge: string,
  rim = 'rgba(126,159,218,0.5)',
): THREE.CanvasTexture {
  const size = 256
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!

  // base falloff
  ctx.fillStyle = edge
  ctx.fillRect(0, 0, size, size)

  const g = ctx.createRadialGradient(96, 84, 8, 128, 128, 150)
  g.addColorStop(0, highlight)
  g.addColorStop(0.35, body)
  g.addColorStop(1, edge)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(128, 128, 128, 0, Math.PI * 2)
  ctx.fill()

  // cool rim bounce, lower-right
  const r = ctx.createRadialGradient(176, 188, 4, 168, 180, 110)
  r.addColorStop(0, rim)
  r.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = r
  ctx.beginPath()
  ctx.arc(128, 128, 128, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

let _cache: Record<string, THREE.CanvasTexture> | null = null

export function getMatcaps() {
  if (_cache) return _cache
  _cache = {
    // white/light shell
    shellLight: makeMatcap('#ffffff', '#cdd6e6', '#3a4660'),
    // mid steel structural
    shellDark: makeMatcap('#c3cfe6', '#8a99ba', '#26304a'),
    // metal joints
    joint: makeMatcap('#eaf0ff', '#9aa6c4', '#2a3450'),
    // steel-blue accent
    accent: makeMatcap('#cfe0ff', '#5573b8', '#1c2c52'),
  }
  return _cache
}
