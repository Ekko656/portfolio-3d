import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ignition } from '../ignition'

/**
 * Animated effects on the dais: two counter-rotating scanner arcs and a
 * breathing pulse on the containment ring — constant, subtle motion at the
 * base of the hero. Flares hard while the ignition surge runs.
 */
export default function Scanner() {
  const arcA = useRef<THREE.Group>(null)
  const arcB = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const surging = ignition.phase === 'surge'
    const speed = surging ? 4.5 : 1
    if (arcA.current) arcA.current.rotation.y += delta * 0.5 * speed
    if (arcB.current) arcB.current.rotation.y -= delta * 0.32 * speed
    if (pulse.current)
      pulse.current.emissiveIntensity = surging
        ? 4.5 + Math.sin(t * 12) * 1.5
        : 1.4 + Math.sin(t * 1.6) * 0.7
  })

  return (
    <group position={[0, 0.26, 0]}>
      {/* breathing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.45, 1.5, 80]} />
        <meshStandardMaterial
          ref={pulse}
          color="#0c1424"
          emissive="#4f8bff"
          emissiveIntensity={1.4}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* scanner arcs */}
      <group ref={arcA}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[1.62, 1.7, 64, 1, 0, Math.PI * 0.45]} />
          <meshBasicMaterial color="#39c6ff" transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <group ref={arcB}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.024, 0]}>
          <ringGeometry args={[1.86, 1.9, 64, 1, 0, Math.PI * 0.8]} />
          <meshBasicMaterial color="#4f8bff" transparent opacity={0.3} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
