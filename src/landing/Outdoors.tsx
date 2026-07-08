import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * The world outside the window — a calm rainy dawn, styled like the layered
 * matte paintings in lofi "rainy ambience" videos: a low rolling meadow rising
 * away from the house, hazy hill bands receding into a muted dawn sky, a lone
 * tree far in the distance, wispy grass, soft rain, and occasional visible
 * lightning bolts that flash the sky.
 *
 * Everything out here uses unlit materials with hand-picked colors (fog=false)
 * so the interior lighting/fog never contaminates the landscape — aerial
 * perspective is painted in per layer, not simulated.
 *
 * `weather.flash` (0..1) is written every frame so the arm can startle on
 * lightning; `weather.wind` drives grass/rain drift.
 */
// Singleton on window so Vite HMR module duplication can never split state
// (a stale module instance once rendered the Sky while a fresh one wrote the
// flash — the two must always be the same object).
const w = window as unknown as { __weather?: { flash: number; wind: number } }
export const weather = (w.__weather ??= { flash: 0, wind: 0 })

// ---------------------------------------------------------------- utilities
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Terrain height for the meadow: a gentle rise with distance (so the ground is
 * actually visible through the window, not edge-on) plus low rolling swells.
 * Shared by the meadow mesh, the grass, and the tree so everything sits on the
 * same ground.
 */
function terrainH(x: number, z: number) {
  const rise = Math.min(2.1, Math.max(0, (-z - 8) * 0.085))
  const roll =
    0.3 * Math.sin(x * 0.18 + 1.3) + 0.25 * Math.sin(z * 0.3 + 2.1) + 0.2 * Math.sin((x - z) * 0.11)
  return -0.8 + rise + roll * Math.min(1, Math.max(0, (-z - 6) / 14))
}

// ---------------------------------------------------------------- sky
function makeSkyTexture() {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 512
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  // muted overcast dawn — heavy blue-grey, one soft warm breath at the skyline
  g.addColorStop(0.0, '#141a29')
  g.addColorStop(0.35, '#232c44')
  g.addColorStop(0.52, '#3c4360')
  g.addColorStop(0.59, '#655d75') // mauve cloud base
  g.addColorStop(0.62, '#a87f74') // warming
  g.addColorStop(0.65, '#ecb98e') // the glow band (sits just above the skyline)
  g.addColorStop(0.69, '#cf9166')
  g.addColorStop(0.74, '#6e5544')
  g.addColorStop(1.0, '#241c15')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 512)
  // soft dark cloud banding in the upper sky
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#10162a'
  for (let i = 0; i < 9; i++) {
    const y = 26 + i * 26 + Math.sin(i * 2.3) * 9
    const h = 6 + (i % 3) * 5
    ctx.beginPath()
    ctx.ellipse(64 + Math.sin(i * 1.7) * 40, y, 90, h, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Sky() {
  const tex = useMemo(makeSkyTexture, [])
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    // lightning blows the whole cloud deck out toward white
    if (mat.current) mat.current.color.setScalar(1 + weather.flash * 5)
  })
  return (
    <mesh position={[-24, 15, -55]}>
      <planeGeometry args={[240, 90]} />
      <meshBasicMaterial ref={mat} map={tex} toneMapped={false} fog={false} depthWrite={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- hill bands
/** A silhouette band of rolling hills drawn on canvas, alpha-cut. */
function makeHillTexture(color: string, seedA: number, seedB: number) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 256)
  for (let x = 0; x <= 1024; x += 8) {
    const u = x / 1024
    const y =
      256 * (0.32 + 0.1 * Math.sin(u * 5.1 + seedA) + 0.07 * Math.sin(u * 11.7 + seedB) + 0.04 * Math.sin(u * 23 + seedA * 2))
    ctx.lineTo(x, y)
  }
  ctx.lineTo(1024, 256)
  ctx.closePath()
  ctx.fill()
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function HillBand({
  color,
  z,
  centerY,
  width,
  height,
  seedA,
  seedB,
}: {
  color: string
  z: number
  centerY: number
  width: number
  height: number
  seedA: number
  seedB: number
}) {
  const tex = useMemo(() => makeHillTexture(color, seedA, seedB), [color, seedA, seedB])
  return (
    <mesh position={[-20, centerY, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent alphaTest={0.3} toneMapped={false} fog={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- meadow
/** Rolling foreground meadow, vertex-colored by height (unlit matte painting). */
function Meadow() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 46, 100, 46)
    g.rotateX(-Math.PI / 2)
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const colors = new Float32Array(pos.count * 3)
    const lo = new THREE.Color('#11150f')
    const hi = new THREE.Color('#232919')
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) - 12 // mesh is centered at x=-12 below
      const z = pos.getZ(i) - 25
      const h = terrainH(x, z)
      pos.setY(i, h)
      const t = Math.min(1, Math.max(0, (h + 0.8) / 2.6))
      tmp.copy(lo).lerp(hi, t)
      colors[i * 3] = tmp.r
      colors[i * 3 + 1] = tmp.g
      colors[i * 3 + 2] = tmp.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geom} position={[-12, 0, -25]}>
      <meshBasicMaterial vertexColors toneMapped={false} fog={false} />
    </mesh>
  )
}

// ---------------------------------------------------------------- distant tree
/**
 * A normal, fluffy tree far out on the ridge — short trunk, a couple of limb
 * stubs, and a rounded crown of overlapping soft masses. Near-still silhouette.
 */
function Tree() {
  const group = useRef<THREE.Group>(null)
  const trunkMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#151923', toneMapped: false, fog: false }),
    [],
  )
  const crownMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#1a2030', toneMapped: false, fog: false }),
    [],
  )
  // A canopy of heavily-overlapping ellipsoids arranged into a rounded, slightly
  // asymmetric crown — the union reads as one graceful silhouette, not broccoli.
  const canopy: { p: [number, number, number]; s: [number, number, number] }[] = [
    // broad base ring
    { p: [-1.0, 2.5, 0.2], s: [1.35, 1.05, 1.2] },
    { p: [1.0, 2.5, -0.2], s: [1.35, 1.05, 1.2] },
    { p: [0.1, 2.4, -0.95], s: [1.2, 1.0, 1.15] },
    { p: [-0.1, 2.45, 0.95], s: [1.2, 1.0, 1.15] },
    // full mid mass
    { p: [-0.45, 3.05, 0.1], s: [1.35, 1.3, 1.3] },
    { p: [0.6, 3.1, -0.05], s: [1.45, 1.35, 1.35] },
    { p: [0.05, 3.0, 0.55], s: [1.25, 1.2, 1.2] },
    // rounded top
    { p: [0.15, 3.7, 0.0], s: [1.05, 1.0, 1.05] },
    { p: [-0.45, 3.55, 0.2], s: [0.8, 0.85, 0.8] },
    { p: [0.35, 4.15, 0.05], s: [0.6, 0.72, 0.6] }, // graceful tapering tip
    // asymmetric outliers so the outline isn't a perfect dome
    { p: [1.55, 2.75, 0.25], s: [0.72, 0.62, 0.68] },
    { p: [-1.6, 2.8, -0.15], s: [0.66, 0.58, 0.64] },
  ]
  const baseY = useMemo(() => terrainH(-26, -30) - 0.15, [])

  useFrame(({ clock }) => {
    // a distant tree barely breathes
    if (group.current) group.current.rotation.z = Math.sin(clock.elapsedTime * 0.35) * 0.004
  })

  return (
    // off the window's centerline (was blocked by the central mullion) — now
    // seated in the left pane
    <group ref={group} position={[-26, baseY, -30]} scale={0.92}>
      {/* visible trunk with a gentle taper and two limb stubs into the crown */}
      <mesh position={[0, 1.05, 0]} material={trunkMat}>
        <cylinderGeometry args={[0.12, 0.24, 2.2, 7]} />
      </mesh>
      <mesh position={[0.4, 2.05, 0]} rotation={[0, 0, -0.65]} material={trunkMat}>
        <cylinderGeometry args={[0.05, 0.1, 1.0, 5]} />
      </mesh>
      <mesh position={[-0.35, 2.2, 0.1]} rotation={[0.15, 0, 0.6]} material={trunkMat}>
        <cylinderGeometry args={[0.05, 0.09, 0.9, 5]} />
      </mesh>
      {canopy.map((l, i) => (
        <mesh key={i} position={l.p} material={crownMat} scale={l.s}>
          <icosahedronGeometry args={[1, 3]} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- grass
/** Wispy instanced grass on the visible rise of the meadow. */
function Grass() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const COUNT = 700
  const data = useMemo(() => {
    const rnd = mulberry32(9)
    return Array.from({ length: COUNT }, () => {
      const x = -26 + rnd() * 22 // spread across the window's view cone
      const z = -12 - rnd() * 17
      return {
        x,
        z,
        y: terrainH(x, z),
        s: 0.45 + rnd() * 0.65,
        r: rnd() * Math.PI,
        phase: rnd() * 6.28,
        shade: rnd(),
      }
    })
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colA = useMemo(() => new THREE.Color('#161b14'), [])
  const colB = useMemo(() => new THREE.Color('#272d1e'), [])
  const tmp = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    if (!ref.current) return
    data.forEach((d, i) => {
      tmp.copy(colA).lerp(colB, d.shade)
      ref.current!.setColorAt(i, tmp)
    })
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [data, colA, colB, tmp])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    data.forEach((d, i) => {
      const bend = Math.sin(t * 1.2 + d.phase) * (0.06 + weather.wind * 0.08)
      dummy.position.set(d.x, d.y + d.s * 0.5, d.z)
      dummy.rotation.set(bend, d.r, bend * 0.7)
      dummy.scale.set(d.s * 0.6, d.s, d.s * 0.6)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined as never, undefined as never, COUNT]} frustumCulled={false}>
      <coneGeometry args={[0.028, 1, 3]} />
      <meshBasicMaterial toneMapped={false} fog={false} />
    </instancedMesh>
  )
}

// ---------------------------------------------------------------- flowers
/** A single daisy-like bloom: five splayed petals around a raised center. */
function makeFlowerGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const petal = new THREE.SphereGeometry(0.07, 6, 4)
    const s = new THREE.Matrix4().makeScale(0.72, 0.32, 1.75) // long, flat petal
    const rx = new THREE.Matrix4().makeRotationX(-0.5) // cup upward
    const ry = new THREE.Matrix4().makeRotationY(a)
    const m = new THREE.Matrix4().multiply(ry).multiply(rx).multiply(s)
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a))
    m.premultiply(new THREE.Matrix4().makeTranslation(dir.x * 0.1, 0.04, dir.z * 0.1))
    petal.applyMatrix4(m)
    parts.push(petal)
  }
  const center = new THREE.SphereGeometry(0.055, 8, 6)
  center.applyMatrix4(new THREE.Matrix4().makeTranslation(0, 0.06, 0))
  parts.push(center)
  return mergeGeometries(parts)!
}

/** Wildflowers with stems + real petals, placed so no two overlap. */
function Flowers() {
  const heads = useRef<THREE.InstancedMesh>(null)
  const stems = useRef<THREE.InstancedMesh>(null)
  const flowerGeo = useMemo(makeFlowerGeometry, [])

  const data = useMemo(() => {
    const rnd = mulberry32(4)
    const palette = ['#d8cfb4', '#c48f92', '#cbb271', '#a79ec2', '#cf9d6c']
    const MIN = 1.1 // no two blooms closer than this (world units)
    const placed: { x: number; z: number }[] = []
    const out: {
      x: number
      z: number
      y: number
      h: number
      phase: number
      color: THREE.Color
      tilt: number
    }[] = []
    let attempts = 0
    while (out.length < 85 && attempts < 6000) {
      attempts++
      const x = -25 + rnd() * 20
      const z = -12.5 - rnd() * 15
      if (placed.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < MIN * MIN)) continue
      placed.push({ x, z })
      out.push({
        x,
        z,
        y: terrainH(x, z),
        h: 0.32 + rnd() * 0.34,
        phase: rnd() * 6.28,
        color: new THREE.Color(palette[Math.floor(rnd() * palette.length)]),
        tilt: (rnd() - 0.5) * 0.5,
      })
    }
    return out
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    if (!heads.current) return
    data.forEach((d, i) => heads.current!.setColorAt(i, d.color))
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
  }, [data])

  useFrame(({ clock }) => {
    if (!heads.current || !stems.current) return
    const t = clock.elapsedTime
    data.forEach((d, i) => {
      const sway = Math.sin(t * 1.25 + d.phase) * (0.05 + weather.wind * 0.06)
      // stem: a bent line from the ground up
      dummy.position.set(d.x + sway * d.h * 0.5, d.y + d.h * 0.5, d.z)
      dummy.rotation.set(0, 0, sway + d.tilt * 0.3)
      dummy.scale.set(1, d.h, 1)
      dummy.updateMatrix()
      stems.current!.setMatrixAt(i, dummy.matrix)
      // bloom nodding on the stem tip
      dummy.position.set(d.x + sway * d.h, d.y + d.h, d.z)
      dummy.rotation.set(d.tilt, d.phase, sway * 1.4)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      heads.current!.setMatrixAt(i, dummy.matrix)
    })
    heads.current.instanceMatrix.needsUpdate = true
    stems.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={stems} args={[undefined as never, undefined as never, 85]} frustumCulled={false}>
        <cylinderGeometry args={[0.011, 0.016, 1, 4]} />
        <meshBasicMaterial color={'#28311e'} toneMapped={false} fog={false} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[flowerGeo, undefined as never, 85]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} fog={false} />
      </instancedMesh>
    </group>
  )
}

// ---------------------------------------------------------------- mist
function makeSoftTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(190,196,214,0.9)')
  g.addColorStop(1, 'rgba(190,196,214,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

/** Slow haze drifting along the skyline, melting the hills into the sky. */
function Mist() {
  const soft = useMemo(makeSoftTexture, [])
  const refs = useRef<(THREE.Sprite | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((s, i) => {
      if (s) s.position.x = -34 + i * 9 + Math.sin(t * 0.06 + i * 2.1) * 3
    })
  })
  return (
    <group>
      {[0, 1, 2, 3].map((i) => (
        <sprite
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[-34 + i * 9, 2.2, -32]}
          scale={[16, 3.2, 1]}
        >
          <spriteMaterial map={soft} color={'#454c62'} opacity={0.13} transparent depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------- rain
function Rain() {
  const COUNT = 1100
  const AREA = { x0: -36, x1: -2, y0: -3, y1: 19, z0: -34, z1: -6 }
  const { geom, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 6)
    const speeds = new Float32Array(COUNT)
    const rnd = mulberry32(21)
    for (let i = 0; i < COUNT; i++) {
      const x = AREA.x0 + rnd() * (AREA.x1 - AREA.x0)
      const y = AREA.y0 + rnd() * (AREA.y1 - AREA.y0)
      const z = AREA.z0 + rnd() * (AREA.z1 - AREA.z0)
      const len = 0.3 + rnd() * 0.4
      positions.set([x, y, z, x + 0.06, y + len, z], i * 6)
      speeds[i] = 9 + rnd() * 7
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geom, speeds }
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const drift = (0.15 + weather.wind * 0.2) * dt
    const ySpan = AREA.y1 - AREA.y0
    for (let i = 0; i < COUNT; i++) {
      const o = i * 6
      const dy = speeds[i] * dt
      arr[o + 1] -= dy
      arr[o + 4] -= dy
      arr[o] += drift * speeds[i] * 0.14
      arr[o + 3] += drift * speeds[i] * 0.14
      if (arr[o + 1] < AREA.y0) {
        arr[o + 1] += ySpan
        arr[o + 4] += ySpan
      }
      if (arr[o] > AREA.x1) {
        arr[o] -= AREA.x1 - AREA.x0
        arr[o + 3] -= AREA.x1 - AREA.x0
      }
    }
    pos.needsUpdate = true
  })

  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial color={'#a9bac9'} transparent opacity={0.22} fog={false} toneMapped={false} />
    </lineSegments>
  )
}

// ---------------------------------------------------------------- lightning
// bolt is a ribbon of camera-facing quads (GL lines are 1px and vanish)
const BOLT_MAX_VERTS = 40 * 6

/**
 * Visible cloud-to-ground lightning: on each strike a jagged tapering ribbon
 * bolt (with a short branch) is generated against the far sky, flickers for
 * ~0.75s, and drives `weather.flash` + a cold light + the sky blow-out.
 */
function Lightning() {
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  const glow = useRef<THREE.Sprite>(null)
  const st = useRef({ timer: 0, next: 4 + Math.random() * 4, life: 0, hold: false, top: [-36, 8.2] as [number, number] })
  const soft = useMemo(makeSoftTexture, [])

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BOLT_MAX_VERTS * 3), 3))
    g.setDrawRange(0, 0)
    return g
  }, [])

  const buildBolt = () => {
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const z = -48
    let vert = 0
    // emit one segment as a quad (2 tris) with world-space width
    const quad = (x1: number, y1: number, x2: number, y2: number, w: number) => {
      if (vert + 6 > BOLT_MAX_VERTS) return
      let dx = x2 - x1
      let dy = y2 - y1
      const len = Math.hypot(dx, dy) || 1
      const px = (-dy / len) * w * 0.5
      const py = (dx / len) * w * 0.5
      const o = vert * 3
      arr.set(
        [
          x1 - px, y1 - py, z, x2 - px, y2 - py, z, x2 + px, y2 + py, z,
          x1 - px, y1 - py, z, x2 + px, y2 + py, z, x1 + px, y1 + py, z,
        ],
        o,
      )
      vert += 6
    }
    // The window reveals sky roughly y 3.5–9.5 at this depth, so the whole
    // bolt lives inside that band: cloud base ~9.5 striking down to the ridge.
    const x0 = -41 + Math.random() * 9 // inside the window's sky cone at z=-48
    let x = x0
    let y = 9.5
    let w = 0.22
    st.current.top = [x0, 8.2]
    const branchAt = 3 + Math.floor(Math.random() * 3)
    let bx = 0
    let by = 0
    let bw = 0.1
    for (let i = 0; i < 12; i++) {
      const nx = x + (Math.random() - 0.5) * 1.4
      const ny = y - (0.45 + Math.random() * 0.3)
      quad(x, y, nx, ny, w)
      if (i === branchAt) {
        bx = nx
        by = ny
        bw = w * 0.55
      }
      x = nx
      y = ny
      w *= 0.92 // taper toward the ground
      if (y < 3.4) break
    }
    // short branch forking away
    if (bx !== 0) {
      let px2 = bx
      let py2 = by
      const dir = Math.random() > 0.5 ? 1 : -1
      for (let i = 0; i < 4; i++) {
        const nx = px2 + dir * (0.4 + Math.random() * 0.5)
        const ny = py2 - (0.4 + Math.random() * 0.35)
        quad(px2, py2, nx, ny, bw)
        px2 = nx
        py2 = ny
        bw *= 0.85
      }
    }
    pos.needsUpdate = true
    geom.setDrawRange(0, vert)
  }

  useEffect(() => {
    // debug hook: window.__strike() fires a bolt now; __strike(true) holds it lit
    ;(window as unknown as Record<string, unknown>).__strike = (hold?: boolean) => {
      st.current.next = 0
      st.current.hold = !!hold
    }
  }, [])

  useFrame((_, delta) => {
    // clamp: backgrounded tabs deliver huge deltas that would kill the flash
    // inside the very frame it fires
    const dt = Math.min(delta, 0.05)
    const s = st.current
    s.timer += dt
    if (s.timer > s.next) {
      s.timer = 0
      s.next = 8 + Math.random() * 13
      s.life = 0.75
      buildBolt()
    }
    // debug hold: pin the bolt at full brightness for screenshots
    if (s.hold) s.life = Math.max(s.life, 0.7)
    if (s.life > 0) {
      s.life = Math.max(0, s.life - dt)
      const u = 1 - s.life / 0.75
      // sharp attack, double-pulse decay
      const env = u < 0.06 ? u / 0.06 : Math.exp(-(u - 0.06) * 5)
      const pulse = 0.75 + 0.25 * Math.sin(u * 55)
      const f = env * pulse
      weather.flash = f
      if (matRef.current) matRef.current.opacity = Math.min(1, f * 2.2)
      if (light.current) light.current.intensity = f * 60
      if (glow.current) {
        glow.current.position.set(s.top[0], s.top[1], -48.5)
        ;(glow.current.material as THREE.SpriteMaterial).opacity = f * 0.7
      }
    } else {
      weather.flash = 0
      if (matRef.current) matRef.current.opacity = 0
      if (light.current) light.current.intensity = 0
      if (glow.current) (glow.current.material as THREE.SpriteMaterial).opacity = 0
    }
  })

  return (
    <group>
      <mesh geometry={geom} frustumCulled={false}>
        <meshBasicMaterial
          ref={matRef}
          color={'#eef3ff'}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          fog={false}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* cloud glow where the bolt originates */}
      <sprite ref={glow} position={[-36, 8, -48.5]} scale={[18, 9, 1]}>
        <spriteMaterial
          map={soft}
          color={'#dbe4ff'}
          opacity={0}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          fog={false}
        />
      </sprite>
      <pointLight ref={light} position={[-28, 12, -40]} color={'#cfd9ff'} intensity={0} distance={70} decay={1.4} />
    </group>
  )
}

// ---------------------------------------------------------------- scene
export default function Outdoors() {
  useFrame(({ clock }) => {
    weather.wind = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 0.3)
  })
  return (
    <group>
      <Sky />
      <HillBand color={'#3d4458'} z={-44} centerY={1.2} width={170} height={10} seedA={1.7} seedB={4.2} />
      <HillBand color={'#262b38'} z={-34} centerY={0.6} width={130} height={8} seedA={3.1} seedB={7.9} />
      <Meadow />
      <Tree />
      <Grass />
      <Flowers />
      <Mist />
      <Rain />
      <Lightning />
    </group>
  )
}
