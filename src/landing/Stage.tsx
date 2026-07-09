import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import Window from './Window'
import Outdoors from './Outdoors'
import Workstation from './Workstation'
import BlenderPrinter from './BlenderPrinter'
import { concreteTexture, plywoodTexture, pegboardTexture, workbenchTexture, ceilingTexture } from './textures'

/**
 * The warm dim home-garage workshop at a rainy dawn. Blockout stage: real
 * architecture (concrete floor, corner walls, ceiling, a hanging shop light)
 * establishes the room + scale; texture and station dressing come next.
 */

// ---- palette (Big Hero 6 working GARAGE: concrete + OSB + industrial, teal tech) --
const BG = '#0e0f11' // neutral industrial dark
const CONCRETE = '#41434a' // grey sealed concrete floor
const PLY = '#6b5a3c' // OSB / chipboard wall
const METAL = '#3a3c42'
const KEY = '#fff3dc' // neutral-warm shop fluorescent
const PRACTICAL = '#ffb060' // warm work-lamp accent
const RIM = '#9ec2ff' // cool dawn rim from the window
// (teal accent reserved)

const DESK_Y = 0.4

const mMetal = <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />

const DESK_W = 9.0 // bench width
const DESK_D = 3.4 // bench depth (a real bench, pushed against the wall)
const BENCH_Z = -2.0 // bench cluster offset so its back edge sits near the wall (z≈-3.7)

const mSteel = <meshStandardMaterial color={'#26282c'} metalness={0.7} roughness={0.42} />
const mSteelLt = <meshStandardMaterial color={'#3a3d43'} metalness={0.75} roughness={0.38} />

/** A heavy industrial robotics workbench — steel frame, worn dark wood top with
 *  a steel edge, a drawer bank, a lower shelf, and a bench vise. Sits against
 *  the wall (its back edge is at z = DESK_D/2). */
function Workbench() {
  const wood = useMemo(() => workbenchTexture([3, 1.2]), [])
  const legXs = [-DESK_W / 2 + 0.35, DESK_W / 2 - 0.35]
  const legZs = [-DESK_D / 2 + 0.35, DESK_D / 2 - 0.35]
  const legTop = DESK_Y - 0.24
  const legH = legTop + 2
  return (
    <group>
      {/* thick worn dark-wood top */}
      <RoundedBox args={[DESK_W, 0.16, DESK_D]} radius={0.02} smoothness={4} position={[0, DESK_Y - 0.08, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color={'#4e3720'} metalness={0.05} roughness={0.75} />
      </RoundedBox>
      {/* steel edge banding around the top */}
      <mesh position={[0, DESK_Y - 0.08, DESK_D / 2]} castShadow>
        <boxGeometry args={[DESK_W, 0.2, 0.05]} />
        {mSteel}
      </mesh>
      <mesh position={[0, DESK_Y - 0.08, -DESK_D / 2]} castShadow>
        <boxGeometry args={[DESK_W, 0.2, 0.05]} />
        {mSteel}
      </mesh>
      {/* heavy square-tube steel legs + side rails */}
      {legXs.map((x) =>
        legZs.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, legTop - legH / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.16, legH, 0.16]} />
            {mSteel}
          </mesh>
        )),
      )}
      {legXs.map((x) => (
        <mesh key={`rail${x}`} position={[x, -1.35, 0]} castShadow>
          <boxGeometry args={[0.1, 0.1, DESK_D - 0.5]} />
          {mSteel}
        </mesh>
      ))}
      {/* lower shelf (steel) */}
      <mesh position={[0, -1.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[DESK_W - 0.5, 0.06, DESK_D - 0.4]} />
        {mSteelLt}
      </mesh>
      {/* drawer bank under the right side */}
      <group position={[DESK_W / 2 - 1.3, 0, 0]}>
        <mesh position={[0, DESK_Y - 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 1.1, DESK_D - 0.4]} />
          {mSteelLt}
        </mesh>
        {[-0.35, 0.0, 0.35].map((dy) => (
          <group key={dy} position={[0, DESK_Y - 0.55 + dy, DESK_D / 2 - 0.18]}>
            <mesh castShadow>
              <boxGeometry args={[1.5, 0.3, 0.04]} />
              <meshStandardMaterial color={'#43464c'} metalness={0.7} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, 0.04]} castShadow>
              <boxGeometry args={[0.7, 0.05, 0.05]} />
              {mSteel}
            </mesh>
          </group>
        ))}
      </group>
      {/* bench vise clamped to the front-left edge */}
      <group position={[-DESK_W / 2 + 1.1, DESK_Y + 0.02, DESK_D / 2 - 0.3]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.4, 0.24, 0.3]} />
          <meshStandardMaterial color={'#3a2622'} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0.28]} castShadow>
          <boxGeometry args={[0.44, 0.28, 0.1]} />
          <meshStandardMaterial color={'#3a2622'} metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0.42]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          {mSteelLt}
        </mesh>
      </group>
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
      {/* dark sealed-concrete floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial map={concrete} color={'#44423e'} metalness={0.03} roughness={0.94} />
      </mesh>
      {/* left wall — dark industrial board */}
      <mesh position={[-8, 2.5, 3.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial map={plywood} color={'#38342a'} metalness={0.02} roughness={0.9} />
      </mesh>
      {/* dark board ceiling */}
      <mesh position={[0, 7, 4]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial map={ceil} color={'#3a3026'} metalness={0.02} roughness={0.92} />
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
    <group position={[0, 5.4, -1.8]}>
      {/* suspension rods */}
      {[-1.4, 1.4].map((x) => (
        <mesh key={x} position={[x, 0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
          <meshStandardMaterial color={'#1a1712'} metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* housing */}
      <RoundedBox args={[3.4, 0.18, 0.7]} radius={0.04} smoothness={3} castShadow>
        <meshStandardMaterial color={'#2a2620'} metalness={0.6} roughness={0.45} />
      </RoundedBox>
      {/* two glowing amber tubes */}
      {[-0.18, 0.18].map((z) => (
        <mesh key={z} position={[0, -0.1, z]}>
          <boxGeometry args={[3.1, 0.05, 0.14]} />
          <meshStandardMaterial color={'#ffdca0'} emissive={'#ff9c3a'} emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
      ))}
      {/* the warm-amber light pool it casts */}
      <pointLight position={[0, -0.4, 0]} intensity={6.5} distance={12} decay={2} color={'#ff9c3a'} />
    </group>
  )
}

function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null)
  return (
    <>
      {/* dark, moody garage — low warm-amber fill, not daylight */}
      <ambientLight intensity={0.22} color={'#ffc888'} />
      <hemisphereLight args={['#4a3a24', '#0c0a08', 0.4]} />
      {/* warm-amber shop light key, casts the hero shadow */}
      <directionalLight
        ref={key}
        position={[-2.5, 6.5, 3.0]}
        intensity={1.55}
        color={'#ffbe78'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-11, 11, 11, -11, 0.1, 32]} />
      </directionalLight>
      {/* cool dawn rim from the window side (subtle) */}
      <directionalLight position={[-6, 4, -5]} intensity={0.4} color={RIM} />
      {/* warm work-lamp pool over the bench */}
      <pointLight position={[-1, 2.2, 1.2]} intensity={1.5} distance={7} decay={2} color={PRACTICAL} />
    </>
  )
}

export default function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }}
      camera={{ position: [8.4, 4.2, 13.0], fov: 42, near: 0.1, far: 120 }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(BG)
        scene.fog = new THREE.Fog(BG, 20, 46)
        camera.lookAt(-0.2, 1.5, -2.4)
      }}
    >
      <Lighting />

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
      {/* bench cluster, pushed back against the wall */}
      <group position={[0, 0, BENCH_Z]}>
        <Workbench />
        <group position={[0, DESK_Y, 0]}>
          <Workstation />
        </group>
        {/* the Blender-modeled 3D printer, on the bench right */}
        <BlenderPrinter position={[2.7, DESK_Y + 0.32, -0.35]} rotation={[0, -0.5, 0]} scale={0.42} />
        <So101Arm />
      </group>

      {/* floor dressing beside the bench, against the wall */}
      <PcTower position={[5.2, -2, -2.4]} />
      <ToolChest position={[-5.6, -2, -2.2]} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
