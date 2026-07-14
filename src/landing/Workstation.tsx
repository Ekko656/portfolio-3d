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

function Monitor({ position, rotation = [0, 0, 0], mode }: { position: [number, number, number]; rotation?: [number, number, number]; mode: 'telemetry' | 'off' }) {
  const scr = useMemo(makeScreenTexture, [])
  const hist = useRef<number[]>(new Array(72).fill(0))
  const frame = useRef(0)
  useFrame(({ clock }) => {
    if (mode !== 'telemetry') return
    frame.current++
    if (frame.current % 2) return
    hist.current.push(((armState as unknown as Record<string, number>).Rotation ?? 0) / 1.9)
    if (hist.current.length > 72) hist.current.shift()
    drawTelemetry(scr.ctx, clock.elapsedTime, hist.current)
    scr.tex.needsUpdate = true
  })
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* flat base + slim neck (modern) */}
      <RoundedBox args={[0.62, 0.03, 0.32]} radius={0.015} smoothness={3} position={[0, 0.015, 0.02]} castShadow>
        <meshStandardMaterial color={BODY_LT} metalness={0.6} roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.34, -0.04]} rotation={[0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.09, 0.66, 0.035]} />
        <meshStandardMaterial color={BODY_LT} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* thin-bezel panel */}
      <RoundedBox args={[1.5, 0.88, 0.045]} radius={0.02} smoothness={3} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial color={BODY} metalness={0.5} roughness={0.5} />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0.79, 0.026]}>
        <planeGeometry args={[1.42, 0.8]} />
        {mode === 'telemetry' ? (
          <meshBasicMaterial map={scr.tex} toneMapped={false} />
        ) : (
          <meshStandardMaterial color={'#05070a'} metalness={0.2} roughness={0.12} emissive={'#0a1418'} emissiveIntensity={0.12} />
        )}
      </mesh>
      {/* power LED */}
      <mesh position={[0.64, 0.36, 0.03]}>
        <boxGeometry args={[0.028, 0.018, 0.02]} />
        <meshStandardMaterial
          color={mode === 'telemetry' ? '#7fffd0' : '#401515'}
          emissive={mode === 'telemetry' ? '#3fd6c4' : '#200'}
          emissiveIntensity={mode === 'telemetry' ? 3 : 0.4}
          toneMapped={false}
        />
      </mesh>
      {/* video/power cable exits the bottom-back of the panel (routed to the
          dock by BenchClutter, so it actually connects to something) */}
      <mesh position={[0.12, 0.4, -0.03]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.12, 8]} />
        <meshStandardMaterial color={'#0d0d0f'} roughness={0.9} />
      </mesh>
      {mode === 'telemetry' && <pointLight position={[0, 0.79, 0.4]} intensity={0.5} distance={2.2} decay={2} color={'#2fd0c0'} />}
    </group>
  )
}

function Keyboard({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const keys = useMemo(() => {
    const arr: { x: number; z: number; w: number }[] = []
    // 6 tidy rows; bottom row has a wide spacebar
    for (let r = 0; r < 5; r++) {
      for (let cc = 0; cc < 19; cc++) arr.push({ x: -0.54 + cc * 0.06, z: -0.15 + r * 0.058, w: 0.048 })
    }
    arr.push({ x: 0, z: 0.19, w: 0.34 }) // spacebar
    return arr
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    if (!ref.current) return
    keys.forEach((k, i) => {
      dummy.position.set(k.x, 0.03, k.z)
      dummy.scale.set(k.w / 0.048, 1, 1)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [keys, dummy])
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <RoundedBox args={[1.24, 0.035, 0.44]} radius={0.02} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color={'#16181c'} metalness={0.35} roughness={0.55} />
      </RoundedBox>
      <instancedMesh ref={ref} args={[undefined as never, undefined as never, keys.length]} castShadow>
        <boxGeometry args={[0.048, 0.02, 0.048]} />
        <meshStandardMaterial color={'#2d3037'} metalness={0.25} roughness={0.65} />
      </instancedMesh>
    </group>
  )
}

function Mouse({ position }: { position: [number, number, number] }) {
  const SHELL = <meshStandardMaterial color={'#191b21'} metalness={0.22} roughness={0.48} />
  return (
    <group position={position}>
      {/* main shell — a bigger, tapered gaming-mouse body resting on the desk */}
      <mesh position={[0, 0.045, 0]} scale={[1, 0.5, 1.6]} castShadow receiveShadow>
        <sphereGeometry args={[0.1, 24, 16]} />
        {SHELL}
      </mesh>
      {/* left + right click buttons, split by a centre groove */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.03, 0.078, 0.07]} scale={[1, 0.45, 1.15]} castShadow>
          <sphereGeometry args={[0.052, 18, 12]} />
          <meshStandardMaterial color={'#14161a'} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, 0.088, 0.09]}>
        <boxGeometry args={[0.006, 0.02, 0.14]} />
        <meshStandardMaterial color={'#0a0a0c'} roughness={0.6} />
      </mesh>
      {/* scroll wheel (rubber tread + teal glow) */}
      <mesh position={[0, 0.096, 0.075]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.016, 14]} />
        <meshStandardMaterial color={'#0a0a0c'} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.1, 0.075]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.0165, 0.0165, 0.006, 14]} />
        <meshStandardMaterial color={'#2fd0c0'} emissive={'#1a8078'} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      {/* DPI button behind the wheel */}
      <mesh position={[0, 0.093, 0.02]} castShadow>
        <boxGeometry args={[0.016, 0.008, 0.014]} />
        <meshStandardMaterial color={'#2a2c31'} roughness={0.5} />
      </mesh>
      {/* two thumb buttons on the left flank */}
      {[0.1, 0.14].map((z) => (
        <mesh key={z} position={[-0.093, 0.04, z]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.014, 0.014, 0.03]} />
          <meshStandardMaterial color={'#26282e'} roughness={0.5} />
        </mesh>
      ))}
      {/* RGB accent strip low around the shell */}
      <mesh position={[0, 0.02, 0]} scale={[1, 0.16, 1.62]}>
        <sphereGeometry args={[0.101, 24, 8]} />
        <meshStandardMaterial color={'#2fd0c0'} emissive={'#1f8f86'} emissiveIntensity={0.7} toneMapped={false} transparent opacity={0.55} />
      </mesh>
    </group>
  )
}

/** The data plug the arm seats into the dark monitor to boot it — a neat,
 *  short routed cable ending in a connector, laying accessibly on the desk. */
function Connector({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const geom = useMemo(() => {
    const pts = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.55, 0.02, 0),
      new THREE.Vector3(-0.28, 0.025, 0.02),
      new THREE.Vector3(-0.05, 0.03, 0),
      new THREE.Vector3(0.12, 0.035, 0.01),
    ])
    return new THREE.TubeGeometry(pts, 24, 0.02, 8)
  }, [])
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color={RUBBER} metalness={0.2} roughness={0.85} />
      </mesh>
      {/* USB-C-style connector head */}
      <group position={[0.16, 0.035, 0.01]}>
        <RoundedBox args={[0.11, 0.05, 0.05]} radius={0.015} smoothness={2} castShadow>
          <meshStandardMaterial color={'#26282d'} metalness={0.5} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0.08, 0, 0]} castShadow>
          <boxGeometry args={[0.05, 0.022, 0.03]} />
          <meshStandardMaterial color={'#c9ccd2'} metalness={0.9} roughness={0.25} />
        </mesh>
      </group>
    </group>
  )
}

export default function Workstation() {
  // A normal dual-monitor setup: two screens side by side at the same depth
  // with a slight inward toe-in, sat to the LEFT so the robot never blocks them.
  // Keyboard + mouse in front; the connector lays within the arm's reach.
  return (
    <group>
      <Monitor position={[-3.05, 0, -0.5]} rotation={[0, 0.16, 0]} mode="telemetry" />
      <Monitor position={[-1.45, 0, -0.5]} rotation={[0, -0.16, 0]} mode="off" />
      <Keyboard position={[-2.15, 0, 0.6]} rotation={[0, 0.05, 0]} />
      <Mouse position={[-1.1, 0, 0.7]} />
      {/* the off-monitor's loose cable + the dock are built in BenchClutter so
          the whole cable run stays consistent in one place */}
    </group>
  )
}
