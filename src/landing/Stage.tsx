import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import Window from './Window'
import Outdoors from './Outdoors'
import Workstation from './Workstation'
import { concreteTexture, plywoodTexture, pegboardTexture, workbenchTexture, ceilingTexture } from './textures'

/**
 * The warm dim home-garage workshop at a rainy dawn. Blockout stage: real
 * architecture (concrete floor, corner walls, ceiling, a hanging shop light)
 * establishes the room + scale; texture and station dressing come next.
 */

// ---- palette (Big Hero 6 warm garage: warm woods/cream + teal tech accents) --
const BG = '#150d05' // warm dark
const CONCRETE = '#3a2c1e' // warm sealed floor
const PLY = '#7a5a38' // warm wood-panel wall
const WALL_WARM = '#a07d4f' // warm cream drywall
const METAL = '#4a4038'
const KEY = '#ffcf8f' // warm tungsten
const PRACTICAL = '#ff9a4d' // warm lamp
const RIM = '#9ec2ff' // cool dawn rim
const TEAL = '#3fd6c4' // tech-glow accent

const DESK_Y = 0.4

const mMetal = <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />

const DESK_D = 4.8 // bench depth (extended along the short/z side)

/** The arm's workbench — worn wood top on a steel frame. */
function Workbench() {
  const wood = useMemo(() => workbenchTexture([2, 1.4]), [])
  const legXs = [-2.85, 2.85]
  const legZs = [-2.05, 2.05]
  return (
    <group>
      {/* worn wood top */}
      <RoundedBox args={[6.4, 0.18, DESK_D]} radius={0.03} smoothness={4} position={[0, DESK_Y - 0.09, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color={'#6a4d33'} metalness={0.05} roughness={0.72} />
      </RoundedBox>
      {/* steel apron */}
      <mesh position={[0, DESK_Y - 0.24, 0]} castShadow>
        <boxGeometry args={[6.2, 0.12, DESK_D - 0.2]} />
        {mMetal}
      </mesh>
      {legXs.map((x) =>
        legZs.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, (DESK_Y - 0.3 - 2) / 2 + 0.1, z]} castShadow receiveShadow>
            <boxGeometry args={[0.15, DESK_Y - 0.3 + 2, 0.15]} />
            {mMetal}
          </mesh>
        )),
      )}
      {/* lower shelf */}
      <mesh position={[0, -1.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.9, 0.08, DESK_D - 0.3]} />
        {mMetal}
      </mesh>
    </group>
  )
}

/** Concrete floor, corner walls, and a joisted garage ceiling — the shell. */
function Shell() {
  const concrete = useMemo(() => concreteTexture([9, 9]), [])
  const plywood = useMemo(() => plywoodTexture([3, 2]), [])
  const ceil = useMemo(() => ceilingTexture([10, 5]), [])
  return (
    <group>
      {/* concrete floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={concrete} color={CONCRETE} metalness={0.04} roughness={0.96} />
      </mesh>
      {/* left wall (plywood) — interior-side of the back wall */}
      <mesh position={[-8, 2.5, 3.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial map={plywood} color={PLY} metalness={0.05} roughness={0.9} />
      </mesh>
      {/* ceiling boards (warm) */}
      <mesh position={[0, 7, 4]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial map={ceil} color={'#3a2a18'} metalness={0.04} roughness={0.92} />
      </mesh>
      {/* exposed warm-wood joists running across the ceiling */}
      {[-6, -3, 0, 3, 6, 9].map((z) => (
        <mesh key={z} position={[0, 6.75, z]} castShadow>
          <boxGeometry args={[26, 0.5, 0.28]} />
          <meshStandardMaterial color={'#4a3420'} metalness={0.04} roughness={0.85} />
        </mesh>
      ))}
      {/* a couple of conduit/pipe runs for detail */}
      <mesh position={[-3, 6.5, 2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 24, 8]} />
        <meshStandardMaterial color={'#3a3630'} metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** Floor-standing PC tower beside the bench, cabled up to the desk. */
function PcTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 1.7, 1.5]} radius={0.03} smoothness={3} position={[0, 0.85, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={'#1a1c20'} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {/* glass side panel with a faint interior glow */}
      <mesh position={[0.36, 0.85, 0]}>
        <planeGeometry args={[1.3, 1.5]} />
        <meshStandardMaterial color={'#0a1016'} emissive={'#123'} emissiveIntensity={0.5} metalness={0.1} roughness={0.1} transparent opacity={0.55} />
      </mesh>
      {/* front intake + power LED */}
      <mesh position={[0, 1.55, 0.76]}>
        <boxGeometry args={[0.5, 0.03, 0.02]} />
        <meshStandardMaterial color={'#6ad0ff'} emissive={'#2a86c9'} emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
      {/* cable bundle rising toward the desk */}
      <mesh position={[0, 1.75, -0.3]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
        <meshStandardMaterial color={'#0d0d0f'} roughness={0.9} />
      </mesh>
    </group>
  )
}

/** A steel shelving unit stacked with parts boxes, totes and cans. */
function Shelving({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const shelfYs = [0, 1.3, 2.6, 3.9]
  const box = (x: number, y: number, z: number, w: number, h: number, d: number, c: string) => (
    <mesh position={[x, y, z]} castShadow receiveShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={c} metalness={0.1} roughness={0.7} />
    </mesh>
  )
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* uprights */}
      {[[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].map(([x, z], i) => (
        <mesh key={i} position={[x, 2, z]} castShadow>
          <boxGeometry args={[0.1, 4.2, 0.1]} />
          <meshStandardMaterial color={'#2b2620'} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* shelves + contents */}
      {shelfYs.map((y, si) => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.0, 0.08, 1.5]} />
            <meshStandardMaterial color={'#332c22'} metalness={0.2} roughness={0.7} />
          </mesh>
          {si === 0 && (<>{box(-0.8, y + 0.35, 0, 0.9, 0.6, 1.1, '#5a4636')}{box(0.5, y + 0.3, 0.1, 1.0, 0.5, 1.0, '#3a4d63')}</>)}
          {si === 1 && (<>{box(-0.6, y + 0.3, 0, 1.2, 0.5, 1.1, '#4a5340')}{box(0.8, y + 0.4, -0.1, 0.7, 0.7, 0.8, '#63503a')}</>)}
          {si === 2 && (<>{box(-0.9, y + 0.25, 0.1, 0.7, 0.42, 0.9, '#3e3a52')}{box(0.2, y + 0.3, 0, 1.1, 0.5, 1.0, '#5a4636')}
            <mesh position={[1.1, y + 0.28, 0.2]} castShadow><cylinderGeometry args={[0.22, 0.22, 0.55, 16]} /><meshStandardMaterial color={'#7a6a4a'} metalness={0.4} roughness={0.6} /></mesh></>)}
          {si === 3 && (<>{box(-0.5, y + 0.3, 0, 1.3, 0.5, 1.1, '#332c3e')}
            <mesh position={[0.9, y + 0.3, 0]} castShadow><cylinderGeometry args={[0.2, 0.2, 0.6, 14]} /><meshStandardMaterial color={'#4a4d55'} metalness={0.6} roughness={0.4} /></mesh></>)}
        </group>
      ))}
    </group>
  )
}

/** A red rolling tool chest — a classic garage anchor. */
function ToolChest({ position }: { position: [number, number, number] }) {
  const RED = '#7a1f1f'
  return (
    <group position={position}>
      {/* cabinet body */}
      <RoundedBox args={[1.8, 2.0, 1.0]} radius={0.03} smoothness={3} position={[0, 1.2, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={RED} metalness={0.35} roughness={0.5} />
      </RoundedBox>
      {/* top chest */}
      <RoundedBox args={[1.85, 0.5, 1.05]} radius={0.03} smoothness={3} position={[0, 2.45, 0]} castShadow>
        <meshStandardMaterial color={RED} metalness={0.35} roughness={0.5} />
      </RoundedBox>
      {/* drawers with handles */}
      {[0.45, 0.95, 1.45, 1.9].map((y, i) => (
        <group key={y}>
          <mesh position={[0, y, 0.51]} castShadow>
            <boxGeometry args={[1.66, i === 3 ? 0.42 : 0.4, 0.03]} />
            <meshStandardMaterial color={'#8a2a2a'} metalness={0.3} roughness={0.55} />
          </mesh>
          <mesh position={[0, y, 0.55]} castShadow>
            <boxGeometry args={[1.2, 0.05, 0.04]} />
            <meshStandardMaterial color={'#c8ccd2'} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* casters */}
      {[[-0.7, -0.35], [0.7, -0.35], [-0.7, 0.35], [0.7, 0.35]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.12, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.1, 12]} />
          <meshStandardMaterial color={'#0d0d0f'} roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

// ---- pegboard tools, arranged like a real, lived-in tool wall ---------------
const toolMetal = <meshStandardMaterial color={'#3f4249'} metalness={0.7} roughness={0.42} />

/** small peg hook the tool hangs from */
function Hook({ x, y }: { x: number; y: number }) {
  return (
    <mesh position={[x, y, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.025, 0.008, 6, 10, Math.PI]} />
      <meshStandardMaterial color={'#24262b'} metalness={0.6} roughness={0.5} />
    </mesh>
  )
}

function OpenWrench({ x, y, len, r = 0 }: { x: number; y: number; len: number; r?: number }) {
  return (
    <group position={[x, y, 0]} rotation={[0, 0, r]}>
      <Hook x={0} y={len / 2 + 0.03} />
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.045, len, 0.028]} />
        {toolMetal}
      </mesh>
      <mesh position={[0, len / 2, 0]} castShadow>
        <boxGeometry args={[0.13, 0.1, 0.032]} />
        {toolMetal}
      </mesh>
      <mesh position={[0, -len / 2, 0]} castShadow>
        <torusGeometry args={[0.055, 0.02, 8, 14]} />
        {toolMetal}
      </mesh>
    </group>
  )
}

function Screwdriver({ x, y, len, c }: { x: number; y: number; len: number; c: string }) {
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={len / 2 + 0.12} />
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, len, 8]} />
        {toolMetal}
      </mesh>
      <mesh position={[0, len / 2 + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.032, 0.18, 10]} />
        <meshStandardMaterial color={c} metalness={0.1} roughness={0.5} />
      </mesh>
    </group>
  )
}

function Tools() {
  return (
    <group position={[0, 0, -3.28]}>
      {/* cluster A: graduated wrenches, upper-left of the board */}
      <OpenWrench x={0.95} y={3.75} len={0.66} />
      <OpenWrench x={1.22} y={3.72} len={0.58} r={0.06} />
      <OpenWrench x={1.46} y={3.68} len={0.48} r={-0.05} />

      {/* cluster B: screwdrivers, upper-middle */}
      <Screwdriver x={2.05} y={3.66} len={0.5} c={'#b23c3c'} />
      <Screwdriver x={2.22} y={3.72} len={0.58} c={'#c8a12e'} />
      <Screwdriver x={2.39} y={3.64} len={0.46} c={'#3c6bb2'} />

      {/* pliers, hanging by the jaw, mid-board */}
      <group position={[2.95, 3.55, 0]}>
        <Hook x={0} y={0.28} />
        <mesh position={[0, 0.16, 0]} castShadow>
          <coneGeometry args={[0.055, 0.22, 6]} />
          {toolMetal}
        </mesh>
        <mesh position={[-0.035, -0.14, 0]} rotation={[0, 0, 0.16]} castShadow>
          <boxGeometry args={[0.038, 0.42, 0.028]} />
          <meshStandardMaterial color={'#7a2a2a'} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0.035, -0.14, 0.01]} rotation={[0, 0, -0.16]} castShadow>
          <boxGeometry args={[0.038, 0.42, 0.028]} />
          <meshStandardMaterial color={'#7a2a2a'} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>

      {/* claw hammer, upper-right */}
      <group position={[3.7, 3.62, 0]}>
        <Hook x={0} y={0.36} />
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.03, 0.64, 8]} />
          <meshStandardMaterial color={'#5a3d24'} metalness={0.1} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.34, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.05, 0.045, 0.24, 10]} />
          {toolMetal}
        </mesh>
      </group>

      {/* tape measure (boxy), right */}
      <group position={[4.25, 3.55, 0]}>
        <Hook x={0} y={0.2} />
        <RoundedBox args={[0.24, 0.26, 0.14]} radius={0.03} smoothness={2} castShadow>
          <meshStandardMaterial color={'#c8a12e'} metalness={0.2} roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.12, 0.06, 0.1]} />
          <meshStandardMaterial color={'#2a2a2e'} metalness={0.3} roughness={0.6} />
        </mesh>
      </group>

      {/* coiled extension cord, lower-right */}
      <mesh position={[4.3, 2.55, 0.02]} castShadow>
        <torusGeometry args={[0.2, 0.05, 10, 24]} />
        <meshStandardMaterial color={'#171719'} metalness={0.2} roughness={0.85} />
      </mesh>
      <Hook x={4.3} y={2.82} />

      {/* C-clamps, lower-left */}
      {[0.8, 1.15].map((x, i) => (
        <group key={x} position={[x, 2.4 - i * 0.05, 0]}>
          <Hook x={0} y={0.2} />
          <mesh castShadow>
            <torusGeometry args={[0.12, 0.03, 8, 16, Math.PI * 1.4]} />
            {toolMetal}
          </mesh>
          <mesh position={[0.02, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.2, 8]} />
            {toolMetal}
          </mesh>
        </group>
      ))}

      {/* spirit level, resting on two hooks lower-middle */}
      <group position={[2.5, 2.15, 0]}>
        <Hook x={-0.4} y={0.09} />
        <Hook x={0.4} y={0.09} />
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.11, 0.05]} />
          <meshStandardMaterial color={'#b8961f'} metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.15, 0.055, 0.02]} />
          <meshStandardMaterial color={'#2fbf6a'} emissive={'#0a2a1a'} emissiveIntensity={0.25} transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  )
}

/** A pegboard panel on the back wall (hung with tools) + a shelf of parts bins. */
function WallDressing() {
  const peg = useMemo(() => pegboardTexture([2.4, 1.4]), [])
  return (
    <group>
      {/* pegboard panel, right of the window, above the bench */}
      <mesh position={[2.6, 3.0, -3.33]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 2.8, 0.06]} />
        <meshStandardMaterial map={peg} metalness={0.05} roughness={0.85} />
      </mesh>
      {/* pegboard frame */}
      <mesh position={[2.6, 3.0, -3.38]}>
        <boxGeometry args={[4.8, 3.0, 0.05]} />
        <meshStandardMaterial color={'#241a12'} metalness={0.2} roughness={0.8} />
      </mesh>
      <Tools />
    </group>
  )
}

/** A hanging fluorescent shop light over the bench — motivates the warm key. */
function ShopLight() {
  return (
    <group position={[0, 5.4, -0.3]}>
      {/* suspension rods */}
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
          <meshStandardMaterial color={'#1a1712'} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* housing */}
      <RoundedBox args={[3.4, 0.18, 0.7]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color={'#33302a'} metalness={0.6} roughness={0.45} />
      </RoundedBox>
      {/* two glowing tubes */}
      {[-0.18, 0.18].map((z) => (
        <mesh key={z} position={[0, -0.1, z]}>
          <boxGeometry args={[3.1, 0.05, 0.14]} />
          <meshStandardMaterial color={'#fff1d8'} emissive={KEY} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
      ))}
      {/* the light pool it casts */}
      <pointLight position={[0, -0.4, 0]} intensity={6} distance={11} decay={2} color={PRACTICAL} />
    </group>
  )
}

function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null)
  return (
    <>
      {/* warm, lifted ambient — cozy garage, not a void */}
      <ambientLight intensity={0.42} color={'#ffe0b0'} />
      <hemisphereLight args={['#6a5238', '#1a1109', 0.8]} />
      {/* warm key from the shop light, casts the hero shadow */}
      <directionalLight
        ref={key}
        position={[-2.5, 6.5, 3.0]}
        intensity={1.7}
        color={KEY}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-11, 11, 11, -11, 0.1, 32]} />
      </directionalLight>
      {/* cool dawn rim from the window side */}
      <directionalLight position={[-6, 4, -5]} intensity={0.45} color={RIM} />
      {/* warm bounce/fill pools for a cozy wrap */}
      <pointLight position={[-3, 1.5, 2]} intensity={2.2} distance={9} decay={2} color={'#ff9d54'} />
      <pointLight position={[4, 1.8, 1.5]} intensity={1.6} distance={8} decay={2} color={'#ffb060'} />
    </>
  )
}

/** Warm string lights draped along the wall — a cozy Big Hero 6 staple. */
function StringLights() {
  const bulbs = useMemo(() => {
    const arr: [number, number, number][] = []
    const n = 14
    for (let i = 0; i <= n; i++) {
      const t = i / n
      const x = -6.5 + t * 12.5
      const sag = Math.sin(t * Math.PI) * 0.5
      arr.push([x, 5.1 - sag, -3.1])
    }
    return arr
  }, [])
  return (
    <group>
      {/* the wire */}
      {bulbs.slice(0, -1).map((b, i) => {
        const n = bulbs[i + 1]
        const mid: [number, number, number] = [(b[0] + n[0]) / 2, (b[1] + n[1]) / 2, (b[2] + n[2]) / 2]
        const len = Math.hypot(n[0] - b[0], n[1] - b[1])
        const ang = Math.atan2(n[1] - b[1], n[0] - b[0])
        return (
          <mesh key={`w${i}`} position={mid} rotation={[0, 0, ang]}>
            <cylinderGeometry args={[0.012, 0.012, len, 4]} />
            <meshStandardMaterial color={'#1a1109'} />
          </mesh>
        )
      })}
      {/* warm bulbs (emissive) */}
      {bulbs.map((b, i) => (
        <mesh key={`b${i}`} position={[b[0], b[1] - 0.12, b[2]]}>
          <sphereGeometry args={[0.075, 10, 8]} />
          <meshStandardMaterial color={'#ffe6b0'} emissive={'#ffb64a'} emissiveIntensity={3.2} toneMapped={false} />
        </mesh>
      ))}
      {/* a couple of real lights so the string actually warms the wall */}
      <pointLight position={[-3, 4.7, -2.8]} intensity={1.4} distance={7} decay={2} color={'#ffb64a'} />
      <pointLight position={[3, 4.7, -2.8]} intensity={1.4} distance={7} decay={2} color={'#ffb64a'} />
    </group>
  )
}

export default function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.28 }}
      camera={{ position: [9.2, 4.4, 16.2], fov: 39, near: 0.1, far: 120 }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(BG)
        scene.fog = new THREE.Fog(BG, 22, 48)
        camera.lookAt(-0.3, 1.35, -1.1)
      }}
    >
      <Lighting />
      <StringLights />

      <Environment resolution={256}>
        <Lightformer intensity={1.0} color={KEY} position={[-3, 4, 3]} scale={[6, 6, 1]} />
        <Lightformer intensity={0.4} color={RIM} position={[-5, 3, -4]} scale={[5, 5, 1]} />
        <Lightformer intensity={0.25} color={PRACTICAL} position={[3, 1, 3]} scale={[3, 3, 1]} />
      </Environment>

      <Outdoors />
      <Shell />
      <Window />
      <WallDressing />
      <ShopLight />
      <Workbench />
      <group position={[0, DESK_Y, 0]}>
        <Workstation />
      </group>
      <So101Arm />

      {/* background / floor dressing */}
      <PcTower position={[4.3, -2, 1.2]} />
      <ToolChest position={[-4.7, -2, 2.4]} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
