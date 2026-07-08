import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Slow-drifting energy motes for atmosphere + depth. Additive, bloom-lit. */
export default function Motes({ count = 700 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 12
      const th = Math.random() * Math.PI * 2
      a[i * 3] = Math.cos(th) * r
      a[i * 3 + 1] = Math.random() * 8
      a[i * 3 + 2] = Math.sin(th) * r
    }
    return a
  }, [count])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        sizeAttenuation
        color="#9fc0ff"
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
