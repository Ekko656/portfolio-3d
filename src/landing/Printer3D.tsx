import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * A desktop FDM 3D printer (bed-slinger, Ender/Prusa style): aluminium
 * extrusion frame, heated print bed, X-gantry with a carriage + hotend, a
 * filament spool on a top holder, and a front LCD with a control knob.
 */

const EXTRUSION = '#33363c' // anodized aluminium extrusion
const BLACK = '#141518' // plastic parts
const BELT = '#0c0c0e'

function Extrusion({ len, pos, rot }: { len: number; pos: [number, number, number]; rot?: [number, number, number] }) {
  return (
    <mesh position={pos} rotation={rot as unknown as THREE.Euler} castShadow>
      <boxGeometry args={[0.09, len, 0.09]} />
      <meshStandardMaterial color={EXTRUSION} metalness={0.55} roughness={0.45} />
    </mesh>
  )
}

export default function Printer3D({ position, rotation = [0, 0, 0], scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const filamentColor = '#c9482f'
  const spoolGeo = useMemo(() => new THREE.CylinderGeometry(0.34, 0.34, 0.12, 28, 1, true), [])

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler} scale={scale}>
      {/* ---- base frame (two side rails + front/back) ---- */}
      <Extrusion len={1.1} pos={[-0.5, 0.05, 0]} rot={[Math.PI / 2, 0, 0]} />
      <Extrusion len={1.1} pos={[0.5, 0.05, 0]} rot={[Math.PI / 2, 0, 0]} />
      <Extrusion len={1.0} pos={[0, 0.05, 0.5]} rot={[0, 0, Math.PI / 2]} />
      <Extrusion len={1.0} pos={[0, 0.05, -0.5]} rot={[0, 0, Math.PI / 2]} />
      {/* control box under the base */}
      <RoundedBox args={[1.0, 0.12, 0.5]} radius={0.02} smoothness={2} position={[0, -0.04, 0]} castShadow>
        <meshStandardMaterial color={BLACK} metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {/* rubber feet */}
      {[[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.12, z]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.05, 10]} />
          <meshStandardMaterial color={'#0a0a0c'} roughness={0.9} />
        </mesh>
      ))}

      {/* ---- vertical posts + top bar ---- */}
      <Extrusion len={1.35} pos={[-0.5, 0.72, -0.42]} />
      <Extrusion len={1.35} pos={[0.5, 0.72, -0.42]} />
      <Extrusion len={1.0} pos={[0, 1.36, -0.42]} rot={[0, 0, Math.PI / 2]} />
      {/* diagonal-ish corner brackets */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 0.12, -0.42]} castShadow>
          <boxGeometry args={[0.13, 0.13, 0.13]} />
          <meshStandardMaterial color={BLACK} metalness={0.3} roughness={0.6} />
        </mesh>
      ))}

      {/* ---- heated print bed (slings front/back) ---- */}
      <mesh position={[0, 0.16, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.78, 0.03, 0.78]} />
        <meshStandardMaterial color={'#101216'} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* build surface (glass/PEI sheen) */}
      <mesh position={[0, 0.18, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.72, 0.72]} />
        <meshStandardMaterial color={'#1a2430'} metalness={0.2} roughness={0.18} />
      </mesh>
      {/* a small half-printed part on the bed */}
      <mesh position={[0.08, 0.24, 0.02]} castShadow>
        <cylinderGeometry args={[0.09, 0.1, 0.12, 6]} />
        <meshStandardMaterial color={filamentColor} metalness={0.05} roughness={0.7} />
      </mesh>

      {/* ---- X gantry: beam across posts + carriage + hotend ---- */}
      <mesh position={[0, 0.95, -0.42]} castShadow>
        <boxGeometry args={[1.02, 0.06, 0.11]} />
        <meshStandardMaterial color={EXTRUSION} metalness={0.55} roughness={0.45} />
      </mesh>
      {/* carriage */}
      <group position={[0.12, 0.9, -0.34]}>
        <RoundedBox args={[0.2, 0.24, 0.14]} radius={0.015} smoothness={2} castShadow>
          <meshStandardMaterial color={BLACK} metalness={0.3} roughness={0.6} />
        </RoundedBox>
        {/* hotend + nozzle */}
        <mesh position={[0, -0.16, 0.05]} castShadow>
          <cylinderGeometry args={[0.045, 0.02, 0.14, 8]} />
          <meshStandardMaterial color={'#6a6a70'} metalness={0.8} roughness={0.3} />
        </mesh>
        {/* part-cooling fan */}
        <mesh position={[0.12, 0, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.16, 0.16]} />
          <meshStandardMaterial color={'#1c1c20'} metalness={0.3} roughness={0.6} />
        </mesh>
      </group>
      {/* belts (thin dark lines along the gantry) */}
      <mesh position={[0, 0.99, -0.36]}>
        <boxGeometry args={[1.0, 0.006, 0.01]} />
        <meshStandardMaterial color={BELT} roughness={0.9} />
      </mesh>

      {/* ---- spool holder + filament spool ---- */}
      <Extrusion len={0.5} pos={[0, 1.36, -0.15]} rot={[Math.PI / 2, 0, 0]} />
      <group position={[0, 1.36, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={spoolGeo} castShadow>
          <meshStandardMaterial color={'#e8e4dc'} metalness={0.1} roughness={0.6} transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* wound filament */}
        <mesh castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 28]} />
          <meshStandardMaterial color={filamentColor} metalness={0.1} roughness={0.55} />
        </mesh>
        {/* hub */}
        <mesh castShadow>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 16]} />
          <meshStandardMaterial color={'#1a1a1e'} roughness={0.6} />
        </mesh>
      </group>
      {/* filament run to the extruder */}
      <mesh position={[0.02, 1.15, -0.02]} rotation={[0.4, 0, 0.2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 6]} />
        <meshStandardMaterial color={filamentColor} roughness={0.5} />
      </mesh>

      {/* ---- LCD + knob on the front-right of the base ---- */}
      <group position={[0.34, 0.12, 0.52]} rotation={[-0.35, 0, 0]}>
        <RoundedBox args={[0.34, 0.2, 0.05]} radius={0.015} smoothness={2} castShadow>
          <meshStandardMaterial color={'#101216'} metalness={0.3} roughness={0.6} />
        </RoundedBox>
        <mesh position={[-0.03, 0, 0.03]}>
          <planeGeometry args={[0.22, 0.12]} />
          <meshStandardMaterial color={'#0a2a14'} emissive={'#2f8f4a'} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
        <mesh position={[0.12, 0, 0.03]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
          <meshStandardMaterial color={'#26282d'} metalness={0.5} roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
