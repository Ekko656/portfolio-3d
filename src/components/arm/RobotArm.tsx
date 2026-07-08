import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const { clamp, lerp } = THREE.MathUtils

const UPPER = 1.35
const FORE = 1.15
const SHOULDER_Y = 0.95

const LIM = {
  yaw: [-Math.PI, Math.PI] as const,
  shoulder: [-1.5, 1.1] as const,
  elbow: [0.05, 2.4] as const,
  wrist: [-1.2, 1.2] as const,
}

function solveIK(up: number, fwd: number) {
  let d = Math.hypot(up, fwd)
  d = clamp(d, Math.abs(UPPER - FORE) + 0.05, UPPER + FORE - 0.04)
  const cosE = (d * d - UPPER * UPPER - FORE * FORE) / (2 * UPPER * FORE)
  const elbow = Math.acos(clamp(cosE, -1, 1))
  const phi = Math.atan2(fwd, up)
  const psi = Math.atan2(FORE * Math.sin(elbow), UPPER + FORE * Math.cos(elbow))
  return { shoulder: phi - psi, elbow }
}

type Props = {
  target?: RefObject<THREE.Vector3>
  grip?: RefObject<number>
  tipRef?: RefObject<THREE.Object3D>
}

/** Articulated arm in polished PBR metal, driven by a choreographed IK target. */
export default function RobotArm({ target, grip, tipRef }: Props) {
  const base = useRef<THREE.Group>(null)
  const shoulder = useRef<THREE.Group>(null)
  const elbow = useRef<THREE.Group>(null)
  const wrist = useRef<THREE.Group>(null)
  const jawL = useRef<THREE.Group>(null)
  const jawR = useRef<THREE.Group>(null)

  const baseWorld = useRef(new THREE.Vector3())
  const idle = useRef(new THREE.Vector3(1.3, 1.7, 1.3))

  useFrame((state, delta) => {
    if (!base.current || !shoulder.current || !elbow.current || !wrist.current)
      return
    const t = state.clock.elapsedTime
    base.current.getWorldPosition(baseWorld.current)

    let goal: THREE.Vector3
    if (target?.current) {
      goal = target.current
    } else {
      idle.current.set(
        baseWorld.current.x + Math.sin(t * 0.3) * 1.4,
        SHOULDER_Y + 0.9 + Math.sin(t * 0.47) * 0.5,
        baseWorld.current.z + 1.9 + Math.cos(t * 0.24) * 0.7,
      )
      goal = idle.current
    }

    const lx = goal.x - baseWorld.current.x
    const lz = goal.z - baseWorld.current.z
    const ly = goal.y - baseWorld.current.y
    const yaw = clamp(Math.atan2(lx, lz), ...LIM.yaw)
    const h = clamp(Math.hypot(lx, lz), 0.4, UPPER + FORE - 0.05)
    const v = clamp(ly - SHOULDER_Y, -1.4, 2.2)
    const { shoulder: sh, elbow: el } = solveIK(v, h)
    const shA = clamp(sh, ...LIM.shoulder)
    const elA = clamp(el, ...LIM.elbow)
    const wrA = clamp(Math.atan2(h, v) - (shA + elA), ...LIM.wrist)
    const open = grip?.current != null ? grip.current : 0.5
    const gap = lerp(0.055, 0.17, clamp(open, 0, 1))

    const k = 1 - Math.exp(-9 * delta)
    base.current.rotation.y = lerp(base.current.rotation.y, yaw, k)
    shoulder.current.rotation.x = lerp(shoulder.current.rotation.x, shA, k)
    elbow.current.rotation.x = lerp(elbow.current.rotation.x, elA, k)
    wrist.current.rotation.x = lerp(wrist.current.rotation.x, wrA, k)
    if (jawL.current) jawL.current.position.x = lerp(jawL.current.position.x, -gap, k)
    if (jawR.current) jawR.current.position.x = lerp(jawR.current.position.x, gap, k)
  })

  return (
    <group position={[0, -1.3, 0]}>
      <group ref={base}>
        <mesh castShadow receiveShadow position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.5, 0.66, 0.32, 48]} />
          <MatLight />
        </mesh>
        <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.34, 0.44, 48]} />
          <MatGlow />
        </mesh>
        <mesh castShadow position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.3, 0.34, 0.62, 32]} />
          <MatDark />
        </mesh>

        <group ref={shoulder} position={[0, SHOULDER_Y, 0]}>
          <Joint r={0.26} />
          <mesh castShadow receiveShadow position={[0, UPPER / 2, 0]}>
            <boxGeometry args={[0.3, UPPER, 0.24]} />
            <MatLight />
          </mesh>
          <mesh position={[0.155, UPPER / 2, 0]}>
            <boxGeometry args={[0.025, UPPER * 0.7, 0.13]} />
            <MatGlow />
          </mesh>

          <group ref={elbow} position={[0, UPPER, 0]}>
            <Joint r={0.22} />
            <mesh castShadow receiveShadow position={[0, FORE / 2, 0]}>
              <boxGeometry args={[0.24, FORE, 0.2]} />
              <MatLight />
            </mesh>

            <group ref={wrist} position={[0, FORE, 0]}>
              <Joint r={0.15} />
              <Gripper jawL={jawL} jawR={jawR} tipRef={tipRef} />
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

function Gripper({
  jawL,
  jawR,
  tipRef,
}: {
  jawL: RefObject<THREE.Group>
  jawR: RefObject<THREE.Group>
  tipRef?: RefObject<THREE.Object3D>
}) {
  return (
    <group position={[0, 0.04, 0]}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.1, 24]} />
        <MatDark />
      </mesh>
      <mesh castShadow position={[0, 0.18, 0]}>
        <boxGeometry args={[0.36, 0.2, 0.26]} />
        <MatLight />
      </mesh>
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.34, 0.05, 0.16]} />
        <MatDark />
      </mesh>

      <object3D ref={tipRef} position={[0, 0.66, 0]} />

      <group ref={jawL} position={[-0.06, 0.32, 0]}>
        <Finger />
      </group>
      <group ref={jawR} position={[0.06, 0.32, 0]}>
        <Finger mirror />
      </group>
    </group>
  )
}

function Finger({ mirror = false }: { mirror?: boolean }) {
  const inner = mirror ? -1 : 1
  return (
    <group>
      <mesh castShadow position={[0, 0.17, 0]}>
        <boxGeometry args={[0.075, 0.34, 0.17]} />
        <MatLight />
      </mesh>
      <mesh castShadow position={[0, 0.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.18, 14]} />
        <MatJoint />
      </mesh>
      <group position={[0, 0.34, 0]} rotation={[0, 0, inner * -0.62]}>
        <mesh castShadow position={[0, 0.09, 0]}>
          <boxGeometry args={[0.07, 0.2, 0.15]} />
          <MatLight />
        </mesh>
        <mesh position={[inner * 0.038, 0.07, 0]}>
          <boxGeometry args={[0.02, 0.16, 0.12]} />
          <MatPad />
        </mesh>
      </group>
    </group>
  )
}

/* ---- PBR materials (rely on the scene Environment for reflections) ---- */

function MatLight() {
  return (
    <meshStandardMaterial
      color="#c4cee0"
      metalness={1}
      roughness={0.26}
      envMapIntensity={1.5}
    />
  )
}
function MatDark() {
  return (
    <meshStandardMaterial
      color="#3c4658"
      metalness={1}
      roughness={0.45}
      envMapIntensity={1.1}
    />
  )
}
function MatJoint() {
  return (
    <meshStandardMaterial color="#8b97ad" metalness={1} roughness={0.34} envMapIntensity={1.3} />
  )
}
function MatPad() {
  return <meshStandardMaterial color="#14181f" metalness={0.1} roughness={0.9} />
}
function MatGlow() {
  return (
    <meshStandardMaterial
      color="#1c2740"
      emissive="#5b8bff"
      emissiveIntensity={2.2}
      toneMapped={false}
    />
  )
}
function Joint({ r }: { r: number }) {
  return (
    <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[r, r, 0.34, 28]} />
      <MatJoint />
    </mesh>
  )
}
