import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { armState, JOINT_RANGE } from './armState'

/**
 * The bench workstation: two monitors + keyboard. The left monitor is powered
 * on and shows the arm's LIVE joint telemetry; the right one starts dark
 * ("unplugged") — the arm will later plug its cable in to boot it and dive into
 * the editorial site.
 */

const BODY = '#181a1f'
const BODY_LT = '#24262c'

// ---- telemetry screen (canvas, driven by the real arm) ----------------------
const JN = ['Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll', 'Jaw'] as const

function makeScreenTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 320
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return { c, ctx: c.getContext('2d')!, tex }
}

function drawTelemetry(ctx: CanvasRenderingContext2D, t: number, hist: number[]) {
  const W = 512
  const H = 320
  ctx.fillStyle = '#06090e'
  ctx.fillRect(0, 0, W, H)
  // faint grid
  ctx.strokeStyle = 'rgba(60,120,120,0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 24) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }
  for (let y = 0; y < H; y += 24) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }
  // header
  ctx.fillStyle = '#3fd6c4'
  ctx.font = 'bold 20px monospace'
  ctx.fillText('SO-ARM101', 16, 34)
  ctx.fillStyle = '#6a8a90'
  ctx.font = '14px monospace'
  ctx.fillText('// LIVE TELEMETRY', 150, 33)
  // blinking rec dot
  if (Math.sin(t * 4) > 0) {
    ctx.fillStyle = '#ff5a52'
    ctx.beginPath()
    ctx.arc(W - 24, 28, 6, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(63,214,196,0.25)'
  ctx.beginPath()
  ctx.moveTo(16, 46)
  ctx.lineTo(W - 16, 46)
  ctx.stroke()

  // six joint bars
  const bx = 16
  let by = 66
  const bw = 300
  JN.forEach((n) => {
    const [lo, hi] = JOINT_RANGE[n]
    const v = (armState as unknown as Record<string, number>)[n] ?? 0
    const norm = Math.min(1, Math.max(0, (v - lo) / (hi - lo)))
    ctx.fillStyle = '#48606a'
    ctx.font = '13px monospace'
    ctx.fillText(n.toUpperCase().slice(0, 10), bx, by - 3)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fillRect(bx, by, bw, 8)
    const warm = norm > 0.85 || norm < 0.15
    ctx.fillStyle = warm ? '#ffb454' : '#3fd6c4'
    ctx.fillRect(bx, by, bw * norm, 8)
    ctx.fillStyle = '#6a8a90'
    ctx.fillText(v.toFixed(2), bx + bw + 10, by + 8)
    by += 30
  })

  // waveform of Rotation history
  ctx.strokeStyle = '#3fd6c4'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  const wy = 250
  hist.forEach((h, i) => {
    const x = 16 + (i / (hist.length - 1)) * (W - 32)
    const y = wy - h * 42
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()
  // footer code line + cursor
  ctx.fillStyle = '#33474d'
  ctx.font = '12px monospace'
  ctx.fillText('0x' + (Math.floor(t * 1000) % 0xffff).toString(16).padStart(4, '0') + '  calib ok  torque nominal', 16, H - 14)
  if (Math.sin(t * 3) > 0) {
    ctx.fillStyle = '#3fd6c4'
    ctx.fillRect(340, H - 24, 8, 12)
  }
}

/** A single monitor. `mode`: 'telemetry' live screen, or 'off' dark. */
function Monitor({
  position,
  rotation = [0, 0, 0],
  mode,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  mode: 'telemetry' | 'off'
}) {
  const scr = useMemo(makeScreenTexture, [])
  const hist = useRef<number[]>(new Array(64).fill(0))
  const frame = useRef(0)

  useFrame(({ clock }) => {
    if (mode !== 'telemetry') return
    frame.current++
    if (frame.current % 2 !== 0) return
    hist.current.push(((armState as unknown as Record<string, number>).Rotation ?? 0) / 1.9)
    if (hist.current.length > 64) hist.current.shift()
    drawTelemetry(scr.ctx, clock.elapsedTime, hist.current)
    scr.tex.needsUpdate = true
  })

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* base + neck */}
      <RoundedBox args={[0.52, 0.05, 0.34]} radius={0.02} smoothness={3} position={[0, 0.025, 0]} castShadow>
        <meshStandardMaterial color={BODY_LT} metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.26, -0.02]} castShadow>
        <boxGeometry args={[0.07, 0.44, 0.06]} />
        <meshStandardMaterial color={BODY_LT} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* bezel */}
      <RoundedBox args={[1.18, 0.74, 0.055]} radius={0.02} smoothness={3} position={[0, 0.74, 0]} castShadow>
        <meshStandardMaterial color={BODY} metalness={0.4} roughness={0.55} />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0.75, 0.03]}>
        <planeGeometry args={[1.04, 0.62]} />
        {mode === 'telemetry' ? (
          <meshBasicMaterial map={scr.tex} toneMapped={false} />
        ) : (
          <meshStandardMaterial color={'#05070a'} metalness={0.2} roughness={0.15} emissive={'#0a1418'} emissiveIntensity={0.15} />
        )}
      </mesh>
      {/* power LED */}
      <mesh position={[0.5, 0.42, 0.04]}>
        <boxGeometry args={[0.03, 0.02, 0.02]} />
        <meshStandardMaterial
          color={mode === 'telemetry' ? '#7fffd0' : '#3a1010'}
          emissive={mode === 'telemetry' ? '#3fd6c4' : '#200'}
          emissiveIntensity={mode === 'telemetry' ? 3 : 0.4}
          toneMapped={false}
        />
      </mesh>
      {/* back vents */}
      {[-0.2, 0, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.74, -0.03]}>
          <boxGeometry args={[0.12, 0.5, 0.01]} />
          <meshStandardMaterial color={'#101216'} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/** Keyboard with instanced keycaps. */
function Keyboard({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const keys = useMemo(() => {
    const arr: [number, number][] = []
    for (let r = 0; r < 4; r++) for (let cc = 0; cc < 13; cc++) arr.push([cc, r])
    return arr
  }, [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => {
    if (!ref.current) return
    keys.forEach(([cx, r], i) => {
      dummy.position.set(-0.36 + cx * 0.06, 0.028, -0.09 + r * 0.06)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      ref.current!.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [keys, dummy])
  return (
    <group position={position}>
      <RoundedBox args={[0.86, 0.035, 0.32]} radius={0.015} smoothness={3} castShadow>
        <meshStandardMaterial color={'#1a1c20'} metalness={0.4} roughness={0.6} />
      </RoundedBox>
      <instancedMesh ref={ref} args={[undefined as never, undefined as never, keys.length]}>
        <boxGeometry args={[0.045, 0.02, 0.045]} />
        <meshStandardMaterial color={'#2a2d33'} metalness={0.3} roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

/** The loose cable the arm will plug into the dark monitor to boot it. */
function LooseCable({ position }: { position: [number, number, number] }) {
  const pts = useMemo(() => {
    const p = [
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0.18, 0.03, 0.12),
      new THREE.Vector3(0.42, 0.02, 0.05),
      new THREE.Vector3(0.6, 0.05, 0.2),
    ]
    return new THREE.CatmullRomCurve3(p)
  }, [])
  const geom = useMemo(() => new THREE.TubeGeometry(pts, 24, 0.018, 6), [pts])
  return (
    <group position={position}>
      <mesh geometry={geom} castShadow>
        <meshStandardMaterial color={'#101012'} metalness={0.2} roughness={0.8} />
      </mesh>
      {/* the plug connector at the end */}
      <mesh position={[0.6, 0.06, 0.2]} rotation={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[0.09, 0.05, 0.05]} />
        <meshStandardMaterial color={'#c9a24a'} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  )
}

export default function Workstation({ y }: { y: number }) {
  // seated on the left half of the bench, angled toward the camera/arm
  return (
    <group position={[-2.1, y, -0.5]} rotation={[0, 0.32, 0]}>
      <Monitor position={[-0.75, 0, 0]} mode="telemetry" />
      <Monitor position={[0.62, 0, 0.08]} rotation={[0, -0.25, 0]} mode="off" />
      <Keyboard position={[-0.1, 0, 0.85]} />
      <LooseCable position={[0.5, 0, 0.55]} />
    </group>
  )
}
