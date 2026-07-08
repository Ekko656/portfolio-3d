import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * The world outside the window: a calm rainy dawn. A backlit tree sways in the
 * wind, rain falls, mist drifts along a low treeline, and lightning occasionally
 * flashes. Everything is placed BEHIND the window opening (z < wall).
 *
 * `weather.flash` (0..1) is written every frame so the arm can startle on
 * lightning; `weather.wind` drives sway/rain angle.
 */
export const weather = { flash: 0, wind: 0 }

// deterministic RNG so the tree is stable across reloads
function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ---- dawn sky (canvas gradient, unlit — it's the light source) --------------
function makeSkyTexture() {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 512
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  // gradient tuned so the warm first-light band lands in the window sightline
  g.addColorStop(0.0, '#0e1424') // overcast top
  g.addColorStop(0.45, '#2a3550')
  g.addColorStop(0.64, '#6b6a86') // mauve cloud
  g.addColorStop(0.71, '#c78f78') // warming
  g.addColorStop(0.76, '#f3cc9d') // bright first light (glow band)
  g.addColorStop(0.82, '#c48a6e') // below the glow
  g.addColorStop(0.9, '#4a3f38')
  g.addColorStop(1.0, '#14160f') // dark ground haze
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 512)
  // soft horizontal cloud banding (denser up high, thinning toward the glow)
  ctx.globalAlpha = 0.14
  ctx.fillStyle = '#1a2033'
  for (let i = 0; i < 7; i++) {
    const y = 30 + i * 30 + Math.sin(i) * 8
    ctx.fillRect(0, y, 64, 8 + (i % 3) * 4)
  }
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Sky() {
  const tex = useMemo(makeSkyTexture, [])
  return (
    <mesh position={[-3, 6, -13]}>
      <planeGeometry args={[70, 24]} />
      <meshBasicMaterial map={tex} toneMapped={false} fog={false} />
    </mesh>
  )
}

// ---- soft radial sprite for mist -------------------------------------------
function makeSoftTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  g.addColorStop(0, 'rgba(200,205,220,0.9)')
  g.addColorStop(1, 'rgba(200,205,220,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// ---- backlit tree (procedural recursive branches) ---------------------------
type Branch = { pos: [number, number, number]; quat: [number, number, number, number]; len: number; rad: number }
type Leaf = { pos: [number, number, number]; scale: number }

function generateTree(seed: number) {
  const rnd = mulberry32(seed)
  const branches: Branch[] = []
  const leaves: Leaf[] = []
  const up = new THREE.Vector3(0, 1, 0)
  const q = new THREE.Quaternion()

  function grow(start: THREE.Vector3, dir: THREE.Vector3, len: number, rad: number, depth: number) {
    const end = start.clone().addScaledVector(dir, len)
    const mid = start.clone().add(end).multiplyScalar(0.5)
    q.setFromUnitVectors(up, dir.clone().normalize())
    branches.push({ pos: [mid.x, mid.y, mid.z], quat: [q.x, q.y, q.z, q.w], len, rad })
    if (depth >= 5 || rad < 0.025) {
      leaves.push({ pos: [end.x, end.y, end.z], scale: 0.5 + rnd() * 0.7 })
      return
    }
    const n = depth < 3 ? 3 : 2
    for (let i = 0; i < n; i++) {
      const child = dir.clone()
      // spread outward + upward bias
      const spread = 0.5 + rnd() * 0.5
      const az = rnd() * Math.PI * 2
      const perp = new THREE.Vector3(Math.cos(az), 0, Math.sin(az))
      child.addScaledVector(perp, spread).add(new THREE.Vector3(0, 0.35, 0)).normalize()
      grow(end, child, len * (0.7 + rnd() * 0.08), rad * 0.66, depth + 1)
    }
  }
  grow(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 1, 0).normalize(), 2.6, 0.26, 0)
  return { branches, leaves }
}

function Tree() {
  const group = useRef<THREE.Group>(null)
  const { branches, leaves } = useMemo(() => generateTree(7), [])
  const soft = useMemo(makeSoftTexture, [])
  const barkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b0d10', roughness: 0.95, metalness: 0 }),
    [],
  )
  const leafMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0c130e', roughness: 1, metalness: 0 }),
    [],
  )

  useFrame(({ clock }) => {
    if (group.current) {
      const t = clock.elapsedTime
      // gentle wind sway
      group.current.rotation.z = Math.sin(t * 0.6) * 0.02 + weather.wind * 0.03
      group.current.rotation.x = Math.sin(t * 0.4 + 1) * 0.012
    }
  })

  return (
    <group ref={group} position={[-4.3, -1.6, -6.5]} scale={1.5}>
      {branches.map((b, i) => (
        <mesh key={i} position={b.pos} quaternion={b.quat} material={barkMat}>
          <cylinderGeometry args={[b.rad * 0.7, b.rad, b.len, 6]} />
        </mesh>
      ))}
      {/* dark foliage masses (backlit → read as silhouette) */}
      {leaves.map((l, i) => (
        <mesh key={i} position={l.pos} material={leafMat} scale={l.scale * 1.5}>
          <icosahedronGeometry args={[0.55, 1]} />
        </mesh>
      ))}
      {/* soft canopy haze billboards to blur the silhouette edge */}
      {leaves.map((l, i) => (
        <sprite key={`s${i}`} position={[l.pos[0], l.pos[1], l.pos[2] - 0.2]} scale={[1.9, 1.9, 1]}>
          <spriteMaterial map={soft} color={'#161c26'} opacity={0.22} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

// ---- rain -------------------------------------------------------------------
function Rain() {
  const ref = useRef<THREE.LineSegments>(null)
  const COUNT = 700
  const area = { x: 26, y: 20, z: 10 }
  const origin = new THREE.Vector3(-4, 5, -8)

  const { geom, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 6)
    const speeds = new Float32Array(COUNT)
    const rnd = mulberry32(21)
    for (let i = 0; i < COUNT; i++) {
      const x = (rnd() - 0.5) * area.x
      const y = (rnd() - 0.5) * area.y
      const z = (rnd() - 0.5) * area.z
      const len = 0.25 + rnd() * 0.35
      positions.set([x, y, z, x + 0.05, y + len, z], i * 6)
      speeds[i] = 8 + rnd() * 6
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geom, speeds }
  }, [])

  useFrame((_, delta) => {
    const pos = geom.getAttribute('position') as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const wind = 0.15 + weather.wind * 0.2
    for (let i = 0; i < COUNT; i++) {
      const o = i * 6
      const dy = speeds[i] * delta
      arr[o + 1] -= dy
      arr[o + 4] -= dy
      arr[o] += wind * delta * speeds[i] * 0.15
      arr[o + 3] += wind * delta * speeds[i] * 0.15
      if (arr[o + 1] < -area.y / 2) {
        arr[o + 1] += area.y
        arr[o + 4] += area.y
      }
    }
    pos.needsUpdate = true
  })

  return (
    <lineSegments ref={ref} geometry={geom} position={origin.toArray()}>
      <lineBasicMaterial color={'#9fb4c8'} transparent opacity={0.28} fog={false} />
    </lineSegments>
  )
}

// ---- low treeline mist + ground --------------------------------------------
function GroundMist() {
  const soft = useMemo(makeSoftTexture, [])
  const refs = useRef<THREE.Sprite[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    refs.current.forEach((s, i) => {
      if (s) s.position.x = -6 + i * 3 + Math.sin(t * 0.15 + i) * 1.5
    })
  })
  return (
    <group position={[-4, -0.9, -9]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <sprite
          key={i}
          ref={(el) => el && (refs.current[i] = el)}
          position={[-6 + i * 3, 0, 0]}
          scale={[8, 3, 1]}
        >
          <spriteMaterial map={soft} color={'#3a4356'} opacity={0.35} transparent depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

// ---- lightning --------------------------------------------------------------
function Lightning() {
  const light = useRef<THREE.PointLight>(null)
  const next = useRef(6 + Math.random() * 10)
  const timer = useRef(0)
  const flash = useRef(0)

  useFrame((_, delta) => {
    timer.current += delta
    if (timer.current > next.current) {
      timer.current = 0
      next.current = 10 + Math.random() * 16
      flash.current = 1 // strike
    }
    // decay with a double-blink feel
    flash.current = Math.max(0, flash.current - delta * 3.2)
    const f = flash.current * (0.6 + 0.4 * Math.sin(flash.current * 40))
    weather.flash = f
    if (light.current) light.current.intensity = f * 40
  })

  return <pointLight ref={light} position={[-6, 6, -9]} color={'#cdd8ff'} intensity={0} distance={40} decay={1.5} />
}

export default function Outdoors() {
  useFrame(({ clock }) => {
    weather.wind = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 0.3)
  })
  return (
    <group>
      <Sky />
      {/* outdoor ground / wet earth */}
      <mesh position={[-4, -1.4, -9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color={'#12160f'} roughness={1} metalness={0} />
      </mesh>
      <Tree />
      <GroundMist />
      <Rain />
      <Lightning />
    </group>
  )
}
