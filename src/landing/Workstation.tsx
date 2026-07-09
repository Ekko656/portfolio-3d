import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { armState, JOINT_RANGE } from './armState'

/**
 * The bench workstation, seated a little behind the robot: one modern monitor
 * showing the arm's LIVE joint telemetry, a keyboard + mouse, a small dock the
 * robot + monitor plug into, and the loose data plug (laying accessibly on the
 * desk) that the arm will grab and seat into the dock to boot the experience.
 */

const BODY = '#16181c'
const BODY_LT = '#23262c'
const RUBBER = '#0d0d0f'

// ---- telemetry screen (canvas, driven by the real arm) ----------------------
const JN = ['Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll', 'Jaw'] as const

function makeScreenTexture() {
  const c = document.createElement('canvas')
  c.width = 640
  c.height = 384
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return { ctx: c.getContext('2d')!, tex }
}

function drawTelemetry(ctx: CanvasRenderingContext2D, t: number, hist: number[]) {
  const W = 640
  const H = 384
  ctx.fillStyle = '#070b10'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(60,120,120,0.07)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.fillStyle = '#3fd6c4'
  ctx.font = 'bold 24px monospace'
  ctx.fillText('SO-ARM101', 20, 40)
  ctx.fillStyle = '#6a8a90'
  ctx.font = '16px monospace'
  ctx.fillText('// LIVE TELEMETRY', 185, 39)
  if (Math.sin(t * 4) > 0) { ctx.fillStyle = '#ff5a52'; ctx.beginPath(); ctx.arc(W - 30, 32, 7, 0, Math.PI * 2); ctx.fill() }
  ctx.strokeStyle = 'rgba(63,214,196,0.25)'
  ctx.beginPath(); ctx.moveTo(20, 54); ctx.lineTo(W - 20, 54); ctx.stroke()
  const bx = 20; let by = 82; const bw = 380
  JN.forEach((n) => {
    const [lo, hi] = JOINT_RANGE[n]
    const v = (armState as unknown as Record<string, number>)[n] ?? 0
    const norm = Math.min(1, Math.max(0, (v - lo) / (hi - lo)))
    ctx.fillStyle = '#4a606a'; ctx.font = '15px monospace'
    ctx.fillText(n.toUpperCase(), bx, by - 4)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(bx, by, bw, 9)
    ctx.fillStyle = norm > 0.85 || norm < 0.15 ? '#ffb454' : '#3fd6c4'
    ctx.fillRect(bx, by, bw * norm, 9)
    ctx.fillStyle = '#6a8a90'; ctx.fillText(v.toFixed(2), bx + bw + 12, by + 9)
    by += 36
  })
  ctx.strokeStyle = '#3fd6c4'; ctx.lineWidth = 1.6; ctx.beginPath()
  const wy = 320
  hist.forEach((h, i) => { const x = 20 + (i / (hist.length - 1)) * (W - 40); const y = wy - h * 48; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
  ctx.stroke()
  ctx.fillStyle = '#33474d'; ctx.font = '14px monospace'
  ctx.fillText('0x' + (Math.floor(t * 1000) % 0xffff).toString(16).padStart(4, '0') + '   torque nominal   calib ok', 20, H - 16)
  if (Math.sin(t * 3) > 0) { ctx.fillStyle = '#3fd6c4'; ctx.fillRect(430, H - 28, 9, 14) }
}

function Monitor({ position }: { position: [number, number, number] }) {
  const scr = useMemo(makeScreenTexture, [])
  const hist = useRef<number[]>(new Array(72).fill(0))
  const frame = useRef(0)
  useFrame(({ clock }) => {
    frame.current++
    if (frame.current % 2) return
    hist.current.push(((armState as unknown as Record<string, number>).Rotation ?? 0) / 1.9)
    if (hist.current.length > 72) hist.current.shift()
    drawTelemetry(scr.ctx, clock.elapsedTime, hist.current)
    scr.tex.needsUpdate = true
  })
  return (
    <group position={position}>
      {/* flat base + slim neck (modern) */}
      <RoundedBox args={[0.62, 0.03, 0.32]} radius={0.015} smoothness={3} position={[0, 0.015, 0.02]} castShadow>
        <meshStandardMaterial color={BODY_LT} metalness={0.6} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.34, -0.04]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.09, 0.66, 0.035]} />
        <meshStandardMaterial color={BODY_LT} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* thin-bezel panel */}
      <RoundedBox args={[1.74, 1.0, 0.045]} radius={0.02} smoothness={3} position={[0, 0.86, 0]} castShadow>
        <meshStandardMaterial color={BODY} metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0.87, 0.026]}>
        <planeGeometry args={[1.66, 0.92]} />
        <meshBasicMaterial map={scr.tex} toneMapped={false} />
      </mesh>
      {/* chin logo + power LED */}
      <mesh position={[0.74, 0.4, 0.03]}>
        <boxGeometry args={[0.028, 0.018, 0.02]} />
        <meshStandardMaterial color={'#7fffd0'} emissive={'#3fd6c4'} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* screen glow spill */}
      <pointLight position={[0, 0.87, 0.4]} intensity={0.5} distance={2.4} decay={2} color={'#2fd0c0'} />
    </group>
  )
}

function Keyboard({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const keys = useMemo(() => {
    const arr: [number, number][] = []
    for (let r = 0; r < 5; r++) for (let cc = 0; cc < 17; cc++) arr.push([cc, r])
    return arr
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    if (!ref.current) return
    keys.forEach(([cx, r], i) => {
      dummy.position.set(-0.48 + cx * 0.06, 0.035, -0.12 + r * 0.06)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [keys, dummy])
  return (
    <group position={position}>
      <RoundedBox args={[1.12, 0.04, 0.4]} radius={0.02} smoothness={3} castShadow>
        <meshStandardMaterial color={'#191b1f'} metalness={0.4} roughness={0.6} />
      </RoundedBox>
      <instancedMesh ref={ref} args={[undefined as never, undefined as never, keys.length]} castShadow>
        <boxGeometry args={[0.05, 0.022, 0.05]} />
        <meshStandardMaterial color={'#2b2e35'} metalness={0.3} roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

function Mouse({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.09, 16, 12]} />
      <meshStandardMaterial color={'#1a1c20'} metalness={0.3} roughness={0.55} />
    </mesh>
  )
}

/** A small desk dock the robot + monitor plug into (has an empty port). */
function Dock({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.5, 0.12, 0.28]} radius={0.02} smoothness={3} castShadow>
        <meshStandardMaterial color={'#202227'} metalness={0.55} roughness={0.45} />
      </RoundedBox>
      {/* row of ports; the middle one is empty (target for the loose plug) */}
      {[-0.14, -0.05, 0.04, 0.13].map((x, i) => (
        <mesh key={x} position={[x, 0.02, 0.145]}>
          <boxGeometry args={[0.05, 0.035, 0.02]} />
          <meshStandardMaterial color={i === 2 ? '#c9a24a' : '#0b0c0e'} metalness={0.6} roughness={0.4} emissive={i === 2 ? '#3a2a08' : '#000'} emissiveIntensity={i === 2 ? 0.5 : 0} />
        </mesh>
      ))}
      {/* status LED */}
      <mesh position={[0.2, 0.065, 0]}>
        <boxGeometry args={[0.02, 0.015, 0.015]} />
        <meshStandardMaterial color={'#8fff9f'} emissive={'#2fbf4a'} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

/** The loose data plug the arm grabs — a braided cable + a chunky connector. */
function LoosePlug({ position }: { position: [number, number, number] }) {
  const geom = useMemo(() => {
    const pts = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.7, 0.02, -0.15),
      new THREE.Vector3(-0.4, 0.03, 0.05),
      new THREE.Vector3(-0.12, 0.04, -0.08),
      new THREE.Vector3(0.05, 0.05, 0.02),
    ])
    return new THREE.TubeGeometry(pts, 30, 0.02, 8)
  }, [])
  return (
    <group position={position}>
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color={RUBBER} metalness={0.2} roughness={0.85} />
      </mesh>
      {/* the connector head (what seats into the dock) */}
      <group position={[0.1, 0.05, 0.02]} rotation={[0, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.13, 0.06, 0.06]} />
          <meshStandardMaterial color={'#2a2c30'} metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0.09, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.035, 0.03]} />
          <meshStandardMaterial color={'#c9a24a'} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

export default function Workstation() {
  // relative to the bench top; the arm base is near x=0, z=-0.15
  return (
    <group>
      <Monitor position={[-0.25, 0, -1.75]} />
      <Keyboard position={[0.15, 0, 0.72]} />
      <Mouse position={[0.95, 0, 0.72]} />
      <Dock position={[1.7, 0, -0.35]} />
      <LoosePlug position={[1.05, 0, 0.05]} />
    </group>
  )
}
