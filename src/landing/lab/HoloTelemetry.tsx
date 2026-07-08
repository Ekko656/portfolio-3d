import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { armState, JOINT_RANGE } from '../armState'

const W = 512
const H = 320
const JOINTS = ['Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll', 'Jaw']

/**
 * A floating holographic telemetry panel, drawn to a canvas texture every few
 * frames. The bars mirror the SO-101's *live* joint values (armState), so the
 * environment visibly responds to the hero — the signature "alive" detail.
 */
export default function HoloTelemetry({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  title = 'SO-101 · LIVE TELEMETRY',
  accent = '#39c6ff',
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  title?: string
  accent?: string
}) {
  const group = useRef<THREE.Group>(null)
  const history = useRef<number[]>([])
  const frame = useRef(0)

  const { canvas, ctx, tex, rgb, dark, light } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    const c = new THREE.Color(accent)
    const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`
    const dark = `#${c.clone().multiplyScalar(0.62).getHexString()}`
    const light = `#${c.clone().lerp(new THREE.Color('#ffffff'), 0.55).getHexString()}`
    return { canvas, ctx, tex, rgb, dark, light }
  }, [accent])

  useFrame(({ clock }) => {
    // gentle float
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.8 + position[0]) * 0.06
    }
    // redraw at ~30fps
    frame.current++
    if (frame.current % 2) return

    const t = armState.t
    ctx.clearRect(0, 0, W, H)

    // panel bg + frame
    ctx.fillStyle = 'rgba(6, 16, 28, 0.55)'
    ctx.fillRect(0, 0, W, H)
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, W - 2, H - 2)
    ctx.fillStyle = `rgba(${rgb}, 0.14)`
    ctx.fillRect(0, 0, W, 34)

    // title + blinking status dot
    ctx.fillStyle = light
    ctx.font = '600 17px "JetBrains Mono", monospace'
    ctx.fillText(title, 14, 23)
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#48e58b' : 'rgba(72,229,139,0.25)'
    ctx.beginPath()
    ctx.arc(W - 22, 17, 5, 0, Math.PI * 2)
    ctx.fill()

    // joint bars (live)
    const bx = 14
    const bw = W - 160
    JOINTS.forEach((name, i) => {
      const y = 58 + i * 30
      const [lo, hi] = JOINT_RANGE[name]
      const v = armState[name as keyof typeof armState] as number
      const n = THREE.MathUtils.clamp((v - lo) / (hi - lo), 0, 1)

      ctx.fillStyle = `rgba(${rgb}, 0.8)`
      ctx.font = '12px "JetBrains Mono", monospace'
      ctx.fillText(name.replace('_', ' ').toUpperCase(), bx, y - 6)

      ctx.fillStyle = `rgba(${rgb}, 0.15)`
      ctx.fillRect(bx, y, bw, 8)
      const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0)
      grad.addColorStop(0, dark)
      grad.addColorStop(1, `rgb(${rgb})`)
      ctx.fillStyle = grad
      ctx.fillRect(bx, y, bw * n, 8)
      // value readout
      ctx.fillStyle = '#cfeaff'
      ctx.fillText(v.toFixed(2).padStart(5, ' '), bx + bw + 12, y + 8)
    })

    // waveform of base rotation
    history.current.push(armState.Rotation)
    if (history.current.length > 90) history.current.shift()
    ctx.strokeStyle = `rgba(${rgb}, 0.9)`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    history.current.forEach((v, i) => {
      const x = W - 132 + (i / 90) * 118
      const y = 96 - v * 22
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
    ctx.strokeStyle = `rgba(${rgb}, 0.25)`
    ctx.strokeRect(W - 132, 52, 118, 88)

    // scan line
    const sy = (t * 40) % H
    ctx.fillStyle = `rgba(${rgb}, 0.08)`
    ctx.fillRect(0, sy, W, 14)

    tex.needsUpdate = true
    void canvas
  })

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <planeGeometry args={[2.4, 1.5]} />
        <meshBasicMaterial
          map={tex}
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>
      {/* soft glow behind the panel */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[2.55, 1.65]} />
        <meshBasicMaterial color="#0a2a44" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}
