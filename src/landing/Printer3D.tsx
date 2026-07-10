import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * A coherent, detailed desktop 3D printer (Ender-3 bed-slinger) built + verified
 * in R3F: aluminium-extrusion frame (base square + two back posts + top bar),
 * a heated bed with a half-printed part, an X-gantry with a carriage + finned
 * hotend + nozzle, a filament spool on a holder, and an LCD with a knob.
 * Local origin sits at the base; +Y up, front = +Z.
 */

const ALU = <meshStandardMaterial color={'#3a3d42'} metalness={0.8} roughness={0.4} />
const BLK = <meshStandardMaterial color={'#101114'} metalness={0.3} roughness={0.55} />
const STEEL = <meshStandardMaterial color={'#5a5d63'} metalness={0.9} roughness={0.28} />

const W = 1.35, D = 1.3, Hp = 1.5
const hw = W / 2, hd = D / 2
const yBase = 0.12
const yTop = yBase + Hp
const zBack = -hd + 0.12
const gz = 0.78 // gantry height (printing position)
const FIL = '#c9482f'

/** an extrusion bar */
function Bar({ args, position, rot }: { args: [number, number, number]; position: [number, number, number]; rot?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rot as unknown as THREE.Euler} castShadow>
      <boxGeometry args={args} />
      {ALU}
    </mesh>
  )
}

export default function Printer3D({ position, rotation = [0, 0, 0], scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const head = useRef<THREE.Group>(null)
  const fan = useRef<THREE.Group>(null)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    // the print head glides slowly side-to-side + tiny layer bob, like it's printing
    if (head.current) {
      head.current.position.x = 0.1 + Math.sin(t * 0.8) * 0.28
      head.current.position.y = gz + Math.sin(t * 0.8) * 0.005
    }
    if (fan.current) fan.current.rotation.z += dt * 12
  })
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler} scale={scale}>
      {/* base square frame */}
      <Bar args={[W, 0.1, 0.1]} position={[0, yBase, hd]} />
      <Bar args={[W, 0.1, 0.1]} position={[0, yBase, -hd]} />
      <Bar args={[0.1, 0.1, D]} position={[hw, yBase, 0]} />
      <Bar args={[0.1, 0.1, D]} position={[-hw, yBase, 0]} />
      {/* control box below the base + LCD on the front */}
      <RoundedBox args={[W - 0.05, 0.28, D - 0.1]} radius={0.02} position={[0, -0.06, 0]} castShadow receiveShadow>{BLK}</RoundedBox>
      {[[-hw + 0.1, hd - 0.1], [hw - 0.1, hd - 0.1], [-hw + 0.1, -hd + 0.1], [hw - 0.1, -hd + 0.1]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.24, z]}><cylinderGeometry args={[0.05, 0.05, 0.06, 10]} />{BLK}</mesh>
      ))}
      {/* LCD + knob */}
      <group position={[hw - 0.35, 0.0, hd + 0.02]} rotation={[-0.25, 0, 0]}>
        <RoundedBox args={[0.42, 0.16, 0.05]} radius={0.015} castShadow>{BLK}</RoundedBox>
        <mesh position={[-0.05, 0, 0.03]}><planeGeometry args={[0.26, 0.1]} /><meshStandardMaterial color={'#0a2a14'} emissive={'#2f9f4a'} emissiveIntensity={0.9} toneMapped={false} /></mesh>
        <mesh position={[0.15, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />{STEEL}</mesh>
      </group>

      {/* two back posts + top bar */}
      <Bar args={[0.1, Hp, 0.1]} position={[hw, (yBase + yTop) / 2, zBack]} />
      <Bar args={[0.1, Hp, 0.1]} position={[-hw, (yBase + yTop) / 2, zBack]} />
      <Bar args={[W + 0.1, 0.1, 0.1]} position={[0, yTop, zBack]} />
      {/* corner gussets */}
      {[-hw, hw].map((x) => (
        <mesh key={x} position={[x, yTop - 0.12, zBack]} castShadow><boxGeometry args={[0.2, 0.2, 0.2]} />{BLK}</mesh>
      ))}
      {/* Z lead screws */}
      {[-hw, hw].map((x) => (
        <mesh key={x} position={[x - Math.sign(x) * 0.13, (yBase + yTop) / 2, zBack]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, Hp - 0.2, 8]} />
          <meshStandardMaterial color={'#b58a3a'} metalness={1} roughness={0.35} />
        </mesh>
      ))}

      {/* heated bed + build surface + a half-printed part */}
      <mesh position={[0, yBase + 0.13, 0.06]} castShadow receiveShadow><boxGeometry args={[0.95, 0.05, 0.95]} /><meshStandardMaterial color={'#12161c'} metalness={0.3} roughness={0.45} /></mesh>
      <mesh position={[0, yBase + 0.17, 0.06]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.88, 0.88]} /><meshStandardMaterial color={'#1a2632'} metalness={0.2} roughness={0.18} /></mesh>
      <mesh position={[0.12, yBase + 0.28, 0.02]} castShadow><cylinderGeometry args={[0.11, 0.12, 0.2, 6]} /><meshStandardMaterial color={FIL} roughness={0.6} /></mesh>

      {/* X gantry beam (static) */}
      <Bar args={[W + 0.1, 0.08, 0.1]} position={[0, gz, zBack + 0.14]} />
      {/* the print head — glides side to side (animated), carries the hotend + a spinning fan */}
      <group ref={head} position={[0.1, gz, 0]}>
        <RoundedBox args={[0.26, 0.3, 0.16]} radius={0.02} position={[0, 0, zBack + 0.28]} castShadow>{BLK}</RoundedBox>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, -0.2 - i * 0.04, zBack + 0.4]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 14]} />{STEEL}
          </mesh>
        ))}
        <mesh position={[0, -0.42, zBack + 0.4]} castShadow><boxGeometry args={[0.12, 0.1, 0.09]} /><meshStandardMaterial color={'#8a7a5a'} metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, -0.52, zBack + 0.4]} castShadow><cylinderGeometry args={[0.03, 0.012, 0.08, 10]} /><meshStandardMaterial color={'#b58a3a'} metalness={0.9} roughness={0.3} /></mesh>
        {/* spinning part-cooling fan */}
        <group position={[0.18, -0.2, zBack + 0.42]}>
          <RoundedBox args={[0.16, 0.16, 0.05]} radius={0.02} castShadow>{BLK}</RoundedBox>
          <group ref={fan} position={[0, 0, 0.03]}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} rotation={[0.3, 0, (i / 5) * Math.PI * 2]}>
                <boxGeometry args={[0.1, 0.015, 0.03]} />
                <meshStandardMaterial color={'#2a2c30'} metalness={0.2} roughness={0.6} />
              </mesh>
            ))}
          </group>
        </group>
      </group>

      {/* spool holder arm + filament spool */}
      <Bar args={[0.08, 0.08, 0.6]} position={[0.3, yTop + 0.05, zBack - 0.28]} />
      <group position={[0.3, yTop + 0.05, zBack - 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow><cylinderGeometry args={[0.42, 0.42, 0.12, 28]} /><meshStandardMaterial color={FIL} roughness={0.55} /></mesh>
        <mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.44, 0.44, 0.02, 28]} /><meshStandardMaterial color={'#e8e4dc'} transparent opacity={0.85} roughness={0.5} /></mesh>
        <mesh position={[0, -0.07, 0]}><cylinderGeometry args={[0.44, 0.44, 0.02, 28]} /><meshStandardMaterial color={'#e8e4dc'} transparent opacity={0.85} roughness={0.5} /></mesh>
        <mesh><cylinderGeometry args={[0.12, 0.12, 0.16, 16]} />{BLK}</mesh>
      </group>
    </group>
  )
}
