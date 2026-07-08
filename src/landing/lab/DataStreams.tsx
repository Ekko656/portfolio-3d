import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const EDGE = 16
const INNER = EDGE - 0.62 // just proud of the wall face

type Lane = {
  from: [number, number, number]
  to: [number, number, number]
  speed: number
  color: string
  pulses: number
}

// The room's nervous system: pulses run along the storey seams of the walls.
const LANES: Lane[] = [
  { from: [-14, 3.1, -INNER], to: [14, 3.1, -INNER], speed: 0.09, color: '#39c6ff', pulses: 3 },
  { from: [14, 6.12, -INNER], to: [-14, 6.12, -INNER], speed: 0.06, color: '#8f6bff', pulses: 2 },
  { from: [-INNER, 3.1, 12], to: [-INNER, 3.1, -12], speed: 0.07, color: '#8f6bff', pulses: 3 },
  { from: [-INNER, 6.12, -12], to: [-INNER, 6.12, 12], speed: 0.05, color: '#39c6ff', pulses: 2 },
  { from: [INNER, 3.1, -12], to: [INNER, 3.1, 12], speed: 0.08, color: '#39c6ff', pulses: 3 },
  { from: [INNER, 9.15, 12], to: [INNER, 9.15, -12], speed: 0.05, color: '#8f6bff', pulses: 2 },
]

/** Light pulses that travel the wall seams — subtle, constant circulation. */
export default function DataStreams() {
  const refs = useRef<THREE.Mesh[]>([])

  const items = useMemo(() => {
    const out: { lane: Lane; phase: number; key: string }[] = []
    LANES.forEach((lane, li) => {
      for (let p = 0; p < lane.pulses; p++) {
        out.push({ lane, phase: p / lane.pulses + li * 0.13, key: `${li}-${p}` })
      }
    })
    return out
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    items.forEach((it, i) => {
      const m = refs.current[i]
      if (!m) return
      const k = (t * it.lane.speed + it.phase) % 1
      m.position.set(
        it.lane.from[0] + (it.lane.to[0] - it.lane.from[0]) * k,
        it.lane.from[1] + (it.lane.to[1] - it.lane.from[1]) * k,
        it.lane.from[2] + (it.lane.to[2] - it.lane.from[2]) * k,
      )
      // fade in/out at the ends of the run
      const fade = Math.min(k, 1 - k) * 10
      ;(m.material as THREE.MeshBasicMaterial).opacity = Math.min(0.85, Math.max(0, fade))
    })
  })

  return (
    <group>
      {items.map((it, i) => {
        const alongX = Math.abs(it.lane.to[0] - it.lane.from[0]) > 0.1
        return (
          <mesh key={it.key} ref={(m) => m && (refs.current[i] = m)}>
            <boxGeometry args={alongX ? [0.7, 0.05, 0.03] : [0.03, 0.05, 0.7]} />
            <meshBasicMaterial
              color={it.lane.color}
              transparent
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}
