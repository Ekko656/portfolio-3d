import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PAD: [number, number, number] = [11.5, 0.1, -12.5]
const HOVER = new THREE.Vector3(PAD[0], 2.6, PAD[2])
const REST = new THREE.Vector3(PAD[0], 0.42, PAD[2])

type Mode = 'patrol' | 'approach' | 'land' | 'charge' | 'takeoff' | 'resume'
const DUR: Record<Exclude<Mode, 'patrol'>, number> = {
  approach: 3,
  land: 2.2,
  charge: 7,
  takeoff: 2.4,
  resume: 2,
}
const PATROL_TIME = 24

const ss = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * The maintenance drone with a life: it patrols high figure-eights, then
 * periodically returns to its lit dock pad, lands, recharges (pad pulses,
 * rotors spin down), lifts off and resumes patrol.
 */
export default function Drone() {
  const root = useRef<THREE.Group>(null)
  const navLight = useRef<THREE.MeshStandardMaterial>(null)
  const eye = useRef<THREE.MeshStandardMaterial>(null)
  const padRing = useRef<THREE.MeshStandardMaterial>(null)
  const rotors = useRef<THREE.Group[]>([])
  const rotorSpeed = useRef(1)

  const state = useRef({
    mode: 'patrol' as Mode,
    modeStart: 0,
    pathT: Math.random() * 20,
    from: new THREE.Vector3(),
    heading: 0,
  })

  const pathPos = (pt: number, out: THREE.Vector3) => {
    const a = pt * 0.12
    out.set(Math.sin(a) * 7.2, 7.2 + Math.sin(pt * 0.5) * 0.4, Math.sin(a * 2) * 3.2 - 4.5)
    return out
  }

  const tmp = useRef(new THREE.Vector3())
  const tmp2 = useRef(new THREE.Vector3())

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    const s = state.current
    if (!root.current) return
    const el = t - s.modeStart

    const switchTo = (m: Mode) => {
      s.mode = m
      s.modeStart = t
      s.from.copy(root.current!.position)
    }

    let targetRotor = 1
    if (s.mode === 'patrol') {
      s.pathT += delta
      pathPos(s.pathT, tmp.current)
      root.current.position.copy(tmp.current)
      // heading + bank from the path derivative
      pathPos(s.pathT + 0.12, tmp2.current)
      const vx = tmp2.current.x - tmp.current.x
      const vz = tmp2.current.z - tmp.current.z
      s.heading = Math.atan2(vx, vz)
      root.current.rotation.order = 'YXZ'
      root.current.rotation.y = s.heading
      root.current.rotation.x = 0.22
      root.current.rotation.z = THREE.MathUtils.clamp((vx * 0.3 - root.current.rotation.z) * 0.1 + root.current.rotation.z, -0.3, 0.3)
      if (el > PATROL_TIME) switchTo('approach')
    } else if (s.mode === 'approach') {
      const k = ss(el / DUR.approach)
      root.current.position.lerpVectors(s.from, HOVER, k)
      const hy = Math.atan2(HOVER.x - s.from.x, HOVER.z - s.from.z)
      root.current.rotation.y += (hy - root.current.rotation.y) * 0.06
      root.current.rotation.x *= 0.95
      root.current.rotation.z *= 0.95
      if (el > DUR.approach) switchTo('land')
    } else if (s.mode === 'land') {
      const k = ss(el / DUR.land)
      root.current.position.lerpVectors(s.from, REST, k)
      targetRotor = 0.55
      if (el > DUR.land) switchTo('charge')
    } else if (s.mode === 'charge') {
      root.current.position.copy(REST)
      targetRotor = 0.06
      if (el > DUR.charge) switchTo('takeoff')
    } else if (s.mode === 'takeoff') {
      const k = ss(el / DUR.takeoff)
      root.current.position.lerpVectors(REST, HOVER, k)
      targetRotor = 1.2
      if (el > DUR.takeoff) switchTo('resume')
    } else {
      // resume: glide back onto the patrol path
      const k = ss(el / DUR.resume)
      pathPos(s.pathT, tmp.current)
      root.current.position.lerpVectors(s.from, tmp.current, k)
      if (el > DUR.resume) switchTo('patrol')
    }

    // rotors
    rotorSpeed.current += (targetRotor - rotorSpeed.current) * (1 - Math.exp(-2 * delta))
    rotors.current.forEach((r, i) => {
      if (r) r.rotation.y += delta * 46 * rotorSpeed.current * (i % 2 ? 1 : -1)
    })

    // lights: white strobe in flight, solid green while charging
    const charging = s.mode === 'charge'
    if (navLight.current)
      navLight.current.emissiveIntensity = charging ? 0.4 : (t * 1.4) % 1 < 0.08 ? 5 : 0.1
    if (eye.current)
      eye.current.emissiveIntensity = charging ? 1 + Math.sin(t * 3) * 0.6 : 2.2
    if (padRing.current)
      padRing.current.emissiveIntensity = charging ? 1.8 + Math.sin(t * 5) * 1.2 : 0.9
  })

  return (
    <>
      {/* dock pad */}
      <group position={PAD}>
        <mesh receiveShadow position={[0, -0.06, 0]}>
          <cylinderGeometry args={[1.15, 1.3, 0.1, 32]} />
          <meshStandardMaterial color="#1c232f" metalness={0.85} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.75, 0.92, 32]} />
          <meshStandardMaterial
            ref={padRing}
            color="#0c1424"
            emissive="#39c6ff"
            emissiveIntensity={0.9}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* pylon with tip blinker */}
        <mesh position={[1.5, 0.55, 0.2]}>
          <boxGeometry args={[0.12, 1.1, 0.12]} />
          <meshStandardMaterial color="#232b38" metalness={0.8} roughness={0.4} />
        </mesh>
        <mesh position={[1.5, 1.16, 0.2]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color="#1a0c04" emissive="#ffae5c" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* drone */}
      <group ref={root} scale={0.95} position={[PAD[0], 0.42, PAD[2]]}>
        <mesh castShadow position={[0, 0.02, 0]}>
          <boxGeometry args={[0.3, 0.06, 0.46]} />
          <meshStandardMaterial color="#cdd5e2" metalness={0.65} roughness={0.35} envMapIntensity={1.1} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.24, 0.09, 0.34]} />
          <meshStandardMaterial color="#232a36" metalness={0.8} roughness={0.4} />
        </mesh>
        <group position={[0, -0.07, 0.24]}>
          <mesh>
            <sphereGeometry args={[0.07, 14, 14]} />
            <meshStandardMaterial color="#1a212d" metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.02, 0.055]} rotation={[0.5, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 10]} />
            <meshStandardMaterial ref={eye} color="#04141c" emissive="#39c6ff" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        </group>

        {([[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]] as [number, number][]).map(([x, z], i) => (
          <group key={i}>
            <mesh position={[x * 0.55, 0.01, z * 0.55]} rotation={[0, Math.atan2(x, z), Math.PI / 2]}>
              <cylinderGeometry args={[0.018, 0.022, 0.34, 8]} />
              <meshStandardMaterial color="#39435a" metalness={0.8} roughness={0.4} />
            </mesh>
            <group position={[x, 0.03, z]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.045, 0.055, 0.07, 12]} />
                <meshStandardMaterial color="#232a36" metalness={0.85} roughness={0.35} />
              </mesh>
              <group ref={(g) => g && (rotors.current[i] = g)} position={[0, 0.05, 0]}>
                {[0, Math.PI / 2].map((r, k) => (
                  <mesh key={k} rotation={[0, r, 0]}>
                    <boxGeometry args={[0.34, 0.006, 0.028]} />
                    <meshStandardMaterial color="#9aa6bd" metalness={0.6} roughness={0.4} transparent opacity={0.55} />
                  </mesh>
                ))}
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.05, 0.17, 24]} />
                  <meshBasicMaterial color="#aeb9cc" transparent opacity={0.07} side={THREE.DoubleSide} />
                </mesh>
              </group>
              <mesh position={[0, 0.045, 0]}>
                <torusGeometry args={[0.19, 0.012, 8, 28]} />
                <meshStandardMaterial color="#39435a" metalness={0.8} roughness={0.4} />
              </mesh>
            </group>
          </group>
        ))}

        {[-0.12, 0.12].map((x, i) => (
          <mesh key={i} position={[x, -0.12, 0]}>
            <boxGeometry args={[0.02, 0.05, 0.3]} />
            <meshStandardMaterial color="#39435a" metalness={0.7} roughness={0.5} />
          </mesh>
        ))}

        <mesh position={[-0.3, 0.02, -0.3]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#140404" emissive="#ff3b30" emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
        <mesh position={[0.3, 0.02, -0.3]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          <meshStandardMaterial color="#04140a" emissive="#34d158" emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.05, -0.24]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial ref={navLight} color="#101418" emissive="#ffffff" emissiveIntensity={0.1} toneMapped={false} />
        </mesh>

        <pointLight position={[0, -0.2, 0]} intensity={3} distance={6} color="#7fc4ff" />
      </group>
    </>
  )
}
