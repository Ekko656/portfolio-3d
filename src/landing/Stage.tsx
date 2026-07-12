import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox, useGLTF } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import Window from './Window'
import Outdoors from './Outdoors'
import Workstation from './Workstation'
import Printer3D from './Printer3D'
import { concreteTexture, plywoodTexture, pegboardTexture, workbenchTexture, ceilingTexture, resumeSheetTexture } from './textures'

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
      {/* full-height drawer cabinet on the right — floor up to just under the top */}
      <group position={[DESK_W / 2 - 1.35, 0, 0.02]}>
        <mesh position={[0, -0.88, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[1.76, 2.24, DESK_D - 0.06]} />
          {mSteelLt}
        </mesh>
        {/* three tall drawers filling the space, all below the benchtop */}
        {[-1.6, -0.88, -0.16].map((dy, i) => (
          <group key={dy} position={[0, dy, DESK_D / 2 + 0.02]}>
            <RoundedBox args={[1.66, 0.68, 0.05]} radius={0.02} smoothness={2} castShadow>
              <meshStandardMaterial color={'#3f4248'} metalness={0.7} roughness={0.42} />
            </RoundedBox>
            <mesh position={[0, 0.13, 0.05]} castShadow>
              <boxGeometry args={[0.8, 0.06, 0.06]} />
              {mSteel}
            </mesh>
            {/* label plate */}
            <mesh position={[-0.6, -0.14, 0.03]}>
              <boxGeometry args={[0.24, 0.1, 0.01]} />
              <meshStandardMaterial color={i === 1 ? '#b0432e' : '#c9c2a8'} roughness={0.6} />
            </mesh>
          </group>
        ))}
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

const TEAL_RGB = '#2fe6d0'
const rgbMat = (
  <meshStandardMaterial color={'#9ffff0'} emissive={TEAL_RGB} emissiveIntensity={2.4} toneMapped={false} />
)

/** A case fan: dark square housing, an RGB ring, a hub and spinning blades. Faces +Z. */
function PcFan({ position, r, rotation = [0, 0, 0], spin = 7 }: { position: [number, number, number]; r: number; rotation?: [number, number, number]; spin?: number }) {
  const blades = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.z += dt * spin
  })
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <RoundedBox args={[r * 2.1, r * 2.1, 0.06]} radius={0.03} smoothness={2}>
        <meshStandardMaterial color={'#111214'} metalness={0.3} roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0, 0.035]}>
        <torusGeometry args={[r * 0.9, 0.022, 10, 30]} />
        {rgbMat}
      </mesh>
      <group ref={blades} position={[0, 0, 0.03]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[r * 0.3, r * 0.3, 0.06, 16]} />
          <meshStandardMaterial color={'#0a0a0c'} metalness={0.2} roughness={0.5} />
        </mesh>
        {Array.from({ length: 7 }).map((_, i) => (
          <mesh key={i} rotation={[0.35, 0, (i / 7) * Math.PI * 2]}>
            <boxGeometry args={[r * 1.5, 0.02, 0.05]} />
            <meshStandardMaterial color={'#1b1c20'} metalness={0.1} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/** A glowing arc-reactor display on a stand — the "cool" Iron-Man-garage piece. */
function ArcReactor({ position }: { position: [number, number, number] }) {
  const rings = useRef<THREE.Group>(null)
  const core = useRef<THREE.Mesh>(null)
  useFrame(({ clock }, dt) => {
    if (rings.current) rings.current.rotation.z += dt * 0.6
    if (core.current) {
      const m = core.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = 5 + Math.sin(clock.elapsedTime * 2.5) * 1.5
    }
  })
  const glow = <meshStandardMaterial color={'#bffff5'} emissive={'#2fe6d0'} emissiveIntensity={3} toneMapped={false} />
  return (
    <group position={position} rotation={[0.18, 0.5, 0]}>
      {/* stand base + neck */}
      <mesh position={[0, -0.42, 0]} castShadow><cylinderGeometry args={[0.16, 0.2, 0.08, 20]} /><meshStandardMaterial color={'#20222a'} metalness={0.6} roughness={0.4} /></mesh>
      <mesh position={[0, -0.24, -0.05]} rotation={[0.4, 0, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.36, 10]} /><meshStandardMaterial color={'#2a2d33'} metalness={0.7} roughness={0.4} /></mesh>
      {/* dark housing ring + copper coils */}
      <mesh castShadow><torusGeometry args={[0.34, 0.07, 14, 36]} /><meshStandardMaterial color={'#26282e'} metalness={0.7} roughness={0.4} /></mesh>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0]} rotation={[Math.PI / 2, 0, a]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.11, 8]} />
            <meshStandardMaterial color={'#b5763a'} metalness={0.9} roughness={0.35} />
          </mesh>
        )
      })}
      {/* glowing concentric rings (slow spin) */}
      <group ref={rings}>
        <mesh><torusGeometry args={[0.22, 0.025, 10, 32]} />{glow}</mesh>
        <mesh><torusGeometry args={[0.14, 0.02, 10, 28]} />{glow}</mesh>
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2
          return <mesh key={i} position={[Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0]}><boxGeometry args={[0.03, 0.03, 0.03]} />{glow}</mesh>
        })}
      </group>
      {/* bright pulsing core */}
      <mesh ref={core} position={[0, 0, 0.02]}><sphereGeometry args={[0.09, 16, 16]} /><meshStandardMaterial color={'#ccfff8'} emissive={'#3fe6d0'} emissiveIntensity={5} toneMapped={false} /></mesh>
      <pointLight position={[0, 0, 0.3]} intensity={1.2} distance={3.5} decay={2} color={'#2fe6d0'} />
    </group>
  )
}

/** A basketball — orange, pebbled, with black seam lines. */
// Shared helper: load a GLB, clone it per instance, and enable shadows.
function useModel(url: string) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const obj = scene.clone(true)
    obj.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return obj
  }, [scene])
}

/** The basketball, built + seamed in Blender (public/models/basketball.glb). */
function Basketball({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const obj = useModel('/models/basketball.glb')
  return <primitive object={obj} position={position} rotation={rotation as unknown as THREE.Euler} scale={0.34} />
}
useGLTF.preload('/models/basketball.glb')

/** A three-stripe sneaker, lofted + subdivided in Blender (models/sneaker.glb).
 *  Local: heel at -Z, toe at +Z, sole on y=0. */
function Sneaker({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const obj = useModel('/models/sneaker.glb')
  return <primitive object={obj} position={position} rotation={rotation as unknown as THREE.Euler} scale={0.4} />
}
useGLTF.preload('/models/sneaker.glb')

/** A detailed gaming PC tower with a glass front revealing the RGB interior. */
function PcTower({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const W = 1.0, H = 1.85, D = 1.7
  const CASE = <meshStandardMaterial color={'#17181c'} metalness={0.45} roughness={0.45} />
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* chassis panels (open front, +Z) */}
      <RoundedBox args={[W, 0.06, D]} radius={0.02} position={[0, 0.03, 0]} castShadow receiveShadow>{CASE}</RoundedBox>
      <RoundedBox args={[W, 0.06, D]} radius={0.02} position={[0, H, 0]} castShadow>{CASE}</RoundedBox>
      <RoundedBox args={[W, H, 0.06]} radius={0.02} position={[0, H / 2, -D / 2]} castShadow>{CASE}</RoundedBox>
      <RoundedBox args={[0.06, H, D]} radius={0.02} position={[-W / 2, H / 2, 0]} castShadow>{CASE}</RoundedBox>
      <RoundedBox args={[0.06, H, D]} radius={0.02} position={[W / 2, H / 2, 0]} castShadow>{CASE}</RoundedBox>
      {/* PSU shroud along the bottom */}
      <RoundedBox args={[W - 0.1, 0.34, D - 0.12]} radius={0.02} position={[0, 0.4, 0]} castShadow>
        <meshStandardMaterial color={'#0e0f12'} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.15, 0.4, D / 2 - 0.1]}>
        <boxGeometry args={[0.4, 0.02, 0.02]} />
        {rgbMat}
      </mesh>
      {/* motherboard on the back wall */}
      <mesh position={[0, H / 2 + 0.15, -D / 2 + 0.07]}>
        <boxGeometry args={[W - 0.16, H - 0.75, 0.03]} />
        <meshStandardMaterial color={'#0e3524'} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* GPU: horizontal card + underglow + two down-facing fans */}
      <RoundedBox args={[W - 0.2, 0.16, 1.0]} radius={0.02} position={[0, 0.98, 0.12]} castShadow>
        <meshStandardMaterial color={'#0a0a0c'} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.9, 0.12]}>
        <boxGeometry args={[W - 0.24, 0.02, 0.95]} />
        {rgbMat}
      </mesh>
      <PcFan position={[0, 0.88, -0.15]} r={0.16} rotation={[Math.PI / 2, 0, 0]} />
      <PcFan position={[0, 0.88, 0.35]} r={0.16} rotation={[Math.PI / 2, 0, 0]} />
      {/* CPU tower cooler + top fan */}
      <RoundedBox args={[0.3, 0.44, 0.3]} radius={0.02} position={[-0.14, 1.52, -0.32]} castShadow>
        <meshStandardMaterial color={'#3a3d43'} metalness={0.85} roughness={0.3} />
      </RoundedBox>
      <PcFan position={[-0.14, 1.75, -0.32]} r={0.15} rotation={[-Math.PI / 2, 0, 0]} />
      {/* RAM sticks with lit tops */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[0.05 + i * 0.06, 1.42, -0.5]}>
          <mesh><boxGeometry args={[0.04, 0.34, 0.14]} /><meshStandardMaterial color={'#0a0a0c'} metalness={0.3} roughness={0.5} /></mesh>
          <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.04, 0.02, 0.14]} />{rgbMat}</mesh>
        </group>
      ))}
      {/* two front intake fans, just behind the glass */}
      <PcFan position={[0, 0.72, D / 2 - 0.12]} r={0.24} />
      <PcFan position={[0, 1.42, D / 2 - 0.12]} r={0.24} />
      {/* front I/O strip on the top edge */}
      <mesh position={[0, H - 0.02, D / 2 - 0.2]}><boxGeometry args={[0.5, 0.03, 0.06]} />{rgbMat}</mesh>
      <mesh position={[-0.3, H - 0.02, D / 2 - 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 16]} />
        <meshStandardMaterial color={'#3a3d43'} metalness={0.8} roughness={0.35} />
      </mesh>
      {[-0.1, 0.02].map((x) => (
        <mesh key={x} position={[x, H - 0.02, D / 2 - 0.35]}>
          <boxGeometry args={[0.09, 0.04, 0.04]} />
          <meshStandardMaterial color={'#0c0c0e'} metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* tempered-glass front panel */}
      <mesh position={[0, H / 2, D / 2]}>
        <boxGeometry args={[W - 0.1, H - 0.1, 0.02]} />
        <meshStandardMaterial color={'#0b1418'} metalness={0.1} roughness={0.08} transparent opacity={0.22} />
      </mesh>
      {/* four thumbscrews on the glass */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy], i) => (
        <mesh key={i} position={[sx * (W / 2 - 0.08), H / 2 + sy * (H / 2 - 0.08), D / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
          <meshStandardMaterial color={'#4a4d53'} metalness={0.85} roughness={0.3} />
        </mesh>
      ))}
      {/* feet */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (W / 2 - 0.1), -0.02, sz * (D / 2 - 0.12)]}>
          <cylinderGeometry args={[0.06, 0.06, 0.05, 10]} />
          <meshStandardMaterial color={'#050505'} roughness={0.9} />
        </mesh>
      ))}
      {/* interior glow */}
      <pointLight position={[0, 1.0, 0.2]} intensity={0.6} distance={2.2} decay={2} color={TEAL_RGB} />
    </group>
  )
}

/** A lived-in stack of papers with the résumé on top — a binder clip + pen. */
function PaperStack({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const resume = useMemo(() => resumeSheetTexture(), [])
  const W = 0.52, D = 0.66, T = 0.007
  // a loose stack: each sheet nudged + fanned a little so it reads as paper, not a box
  const sheets = [
    { dx: 0.018, dz: -0.014, ry: -0.07, tone: '#e2dbca' },
    { dx: -0.02, dz: 0.01, ry: 0.06, tone: '#e8e1d1' },
    { dx: 0.01, dz: 0.018, ry: -0.03, tone: '#e5decd' },
    { dx: -0.01, dz: -0.008, ry: 0.09, tone: '#ece6d8' },
    { dx: 0.014, dz: 0.006, ry: -0.05, tone: '#e6dfce' },
    { dx: -0.008, dz: 0.012, ry: 0.03, tone: '#eae3d4' },
    { dx: 0.0, dz: 0.0, ry: 0.02, tone: '#efe9dc' },
  ]
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {/* the understack */}
      {sheets.map((s, i) => (
        <mesh key={i} position={[s.dx, i * T, s.dz]} rotation={[0, s.ry, 0]} castShadow receiveShadow>
          <boxGeometry args={[W, T, D]} />
          <meshStandardMaterial color={s.tone} roughness={0.85} />
        </mesh>
      ))}
      {/* the résumé, face up on top, slightly askew */}
      <mesh position={[0.008, sheets.length * T + 0.001, 0.006]} rotation={[0, -0.04, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, T, D]} />
        <meshStandardMaterial color={'#efe9dd'} roughness={0.82} />
        {/* top face texture via a thin plane just above, so only the top shows the CV */}
      </mesh>
      <mesh position={[0.008, sheets.length * T + 0.0055, 0.006]} rotation={[-Math.PI / 2, 0, -0.04]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={resume} roughness={0.85} />
      </mesh>
      {/* black bulldog binder clip near the top edge */}
      <group position={[0.008, sheets.length * T + 0.012, -0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.09, 0.02, 0.05]} />
          <meshStandardMaterial color={'#17181b'} metalness={0.5} roughness={0.45} />
        </mesh>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 0.045, 0.02, 0]} rotation={[0, 0, sx * 0.5]}>
            <cylinderGeometry args={[0.003, 0.003, 0.05, 8]} />
            <meshStandardMaterial color={'#c9ccd2'} metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* a pen laid diagonally across the stack */}
      <group position={[-0.04, sheets.length * T + 0.012, 0.05]} rotation={[0, 0.7, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.34, 12]} />
          <meshStandardMaterial color={'#1b1c20'} roughness={0.4} metalness={0.2} />
        </mesh>
        <mesh position={[0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.008, 0.05, 12]} />
          <meshStandardMaterial color={'#2a2c31'} roughness={0.4} />
        </mesh>
        <mesh position={[-0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.006, 0.006, 0.03, 8]} />
          <meshStandardMaterial color={accentSilver} metalness={0.85} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

const accentSilver = '#b9bcc2'

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
      {/* résumé + papers left out on top of the chest */}
      <PaperStack position={[0.08, 2.705, 0.02]} rotation={[0, 0.22, 0]} />
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

const hookMat = <meshStandardMaterial color={'#3a3d43'} metalness={0.75} roughness={0.4} />

/** A real peg hook that stands off the board and the tool hangs on. */
function Hook({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0]}>
      {/* peg out from the board */}
      <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 6]} />
        {hookMat}
      </mesh>
      {/* upturned tip the tool rests on */}
      <mesh position={[0, -0.03, 0.11]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.07, 6]} />
        {hookMat}
      </mesh>
    </group>
  )
}

const steelBright = <meshStandardMaterial color={'#8a8d93'} metalness={0.85} roughness={0.3} />

/** A combination wrench: ring end hung over the peg, flat shaft, open jaw. */
function ComboWrench({ x, y, len, r = 0 }: { x: number; y: number; len: number; r?: number }) {
  return (
    <group position={[x, y, 0]} rotation={[0, 0, r]}>
      <Hook x={0} y={len / 2 + 0.065} />
      {/* ring end hanging over the peg */}
      <mesh position={[0, len / 2 + 0.03, 0]} castShadow>
        <torusGeometry args={[0.046, 0.017, 10, 22]} />
        {toolMetal}
      </mesh>
      {/* flat tapered shaft */}
      <mesh castShadow>
        <boxGeometry args={[0.044, len, 0.014]} />
        {toolMetal}
      </mesh>
      {/* open-end head: round boss + two prongs leaving a jaw gap, angled 15° */}
      <group position={[0, -len / 2 - 0.015, 0]} rotation={[0, 0, 0.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.014, 16]} />
          {toolMetal}
        </mesh>
        <mesh position={[-0.03, -0.035, 0]} rotation={[0, 0, 0.18]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.014]} />
          {toolMetal}
        </mesh>
        <mesh position={[0.032, -0.04, 0]} rotation={[0, 0, -0.14]} castShadow>
          <boxGeometry args={[0.02, 0.07, 0.014]} />
          {toolMetal}
        </mesh>
      </group>
    </group>
  )
}

/** A realistic short screwdriver hanging handle-up: butt, grip, ferrule, shaft, tip. */
function Screwdriver({ x, y, c }: { x: number; y: number; c: string }) {
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.21} />
      {/* rounded butt + grip (fatter at top, waisted) + dark band */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.03, 14, 10]} />
        <meshStandardMaterial color={c} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.031, 0.026, 0.13, 14]} />
        <meshStandardMaterial color={c} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.03, 0]} castShadow>
        <cylinderGeometry args={[0.027, 0.024, 0.03, 14]} />
        <meshStandardMaterial color={'#1a1b1e'} roughness={0.6} />
      </mesh>
      {/* steel ferrule + shaft + flat tip */}
      <mesh position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.025, 10]} />
        {steelBright}
      </mesh>
      <mesh position={[0, -0.07, 0]} castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.13, 8]} />
        {steelBright}
      </mesh>
      <mesh position={[0, -0.14, 0]} castShadow>
        <boxGeometry args={[0.022, 0.018, 0.006]} />
        {steelBright}
      </mesh>
    </group>
  )
}

/** Pliers: two arms crossing at a visible pivot — jaws meet at the top, red
 *  dipped handles spread into the V below. Nothing floats. */
function Pliers({ x, y }: { x: number; y: number }) {
  const grip = <meshStandardMaterial color={'#a03028'} roughness={0.5} metalness={0.05} />
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.15} />
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* jaw — leans in so the tips meet under the hook */}
          <mesh position={[s * 0.014, 0.07, s * 0.006]} rotation={[0, 0, -s * 0.22]} castShadow>
            <boxGeometry args={[0.026, 0.13, 0.014]} />
            {toolMetal}
          </mesh>
          {/* handle — continues the same line through the pivot */}
          <mesh position={[s * 0.036, -0.085, s * 0.006]} rotation={[0, 0, s * 0.28]} castShadow>
            <boxGeometry args={[0.03, 0.18, 0.018]} />
            {grip}
          </mesh>
        </group>
      ))}
      {/* nose tip where the jaws meet */}
      <mesh position={[0, 0.135, 0]} castShadow>
        <boxGeometry args={[0.034, 0.035, 0.024]} />
        {toolMetal}
      </mesh>
      {/* pivot bolt through the crossing */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.017, 0.017, 0.036, 12]} />
        {steelBright}
      </mesh>
    </group>
  )
}

/** A tape measure: yellow body, rubber bumpers, front seam disc, thumb lock,
 *  belt clip, and the tape tongue with its steel end hook. */
function TapeMeasure({ x, y }: { x: number; y: number }) {
  const YELLOW = <meshStandardMaterial color={'#c8a12e'} metalness={0.15} roughness={0.5} />
  const RUBBER = <meshStandardMaterial color={'#17181b'} roughness={0.8} />
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.19} />
      {/* body + rubber over-mould bumpers top/bottom */}
      <RoundedBox args={[0.2, 0.22, 0.12]} radius={0.035} smoothness={3} castShadow>{YELLOW}</RoundedBox>
      <RoundedBox args={[0.205, 0.06, 0.125]} radius={0.028} smoothness={2} position={[0, 0.085, 0]}>{RUBBER}</RoundedBox>
      <RoundedBox args={[0.205, 0.06, 0.125]} radius={0.028} smoothness={2} position={[0, -0.085, 0]}>{RUBBER}</RoundedBox>
      {/* front seam disc (the coiled-tape hub) */}
      <mesh position={[0, 0.01, 0.062]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.006, 24]} />
        {RUBBER}
      </mesh>
      {/* thumb lock on the front */}
      <mesh position={[0, 0.055, 0.068]} castShadow>
        <boxGeometry args={[0.03, 0.05, 0.012]} />
        {RUBBER}
      </mesh>
      {/* belt clip on the side */}
      <mesh position={[-0.108, 0.02, 0]} castShadow>
        <boxGeometry args={[0.008, 0.12, 0.05]} />
        {steelBright}
      </mesh>
      {/* tape tongue out the bottom slot + steel end hook */}
      <mesh position={[0.02, -0.125, 0.01]} rotation={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[0.09, 0.016, 0.045]} />
        <meshStandardMaterial color={'#d8b83e'} roughness={0.45} />
      </mesh>
      <mesh position={[0.068, -0.132, 0.01]} castShadow>
        <boxGeometry args={[0.012, 0.03, 0.05]} />
        {steelBright}
      </mesh>
    </group>
  )
}

/** An adjustable (crescent) wrench hanging head-up: round head boss, fixed
 *  upper jaw, movable lower jaw with a gap, knurled adjuster worm, flat handle. */
function AdjustableWrench({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.26} />
      {/* head boss hung over the peg (the jaw gap sits on the hook) */}
      <group position={[0, 0.16, 0]} rotation={[0, 0, -0.25]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.024, 18]} />
          {toolMetal}
        </mesh>
        {/* fixed jaw (upper prong) */}
        <mesh position={[-0.045, 0.085, 0]} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.032, 0.11, 0.022]} />
          {toolMetal}
        </mesh>
        {/* movable jaw (lower prong, leaving the adjustable gap) */}
        <mesh position={[0.028, 0.07, 0]} rotation={[0, 0, -0.06]} castShadow>
          <boxGeometry args={[0.036, 0.07, 0.022]} />
          {toolMetal}
        </mesh>
        {/* knurled adjuster worm set into the head */}
        <mesh position={[0.052, -0.005, 0]} rotation={[0, 0, 1.15]} castShadow>
          <cylinderGeometry args={[0.022, 0.022, 0.05, 12]} />
          {steelBright}
        </mesh>
      </group>
      {/* flat tapered handle with a hang hole */}
      <mesh position={[0.035, -0.08, 0]} rotation={[0, 0, -0.12]} castShadow>
        <boxGeometry args={[0.055, 0.36, 0.018]} />
        {toolMetal}
      </mesh>
      <mesh position={[0.055, -0.235, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.014, 0.014, 0.024, 10]} />
        <meshStandardMaterial color={'#15161a'} roughness={0.6} />
      </mesh>
    </group>
  )
}

/** A handsaw hung by its handle, blade sweeping out sideways over the board. */
function Handsaw({ x, y }: { x: number; y: number }) {
  const WOOD = <meshStandardMaterial color={'#6a4a28'} metalness={0.05} roughness={0.65} />
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.1} />
      {/* closed wooden handle: outer grip ring + inner web */}
      <mesh rotation={[0, 0, 0.2]} castShadow>
        <torusGeometry args={[0.085, 0.028, 10, 22]} />
        {WOOD}
      </mesh>
      <mesh rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.062, 0.062, 0.018, 18]} />
        {WOOD}
      </mesh>
      {/* two brass saw screws where the blade enters the handle */}
      {[[0.1, 0.03], [0.13, -0.03]].map(([bx, by], i) => (
        <mesh key={i} position={[bx, by, 0.014]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.012, 10]} />
          <meshStandardMaterial color={'#c9a24a'} metalness={0.8} roughness={0.35} />
        </mesh>
      ))}
      {/* blade: long plate tapering to the tip, teeth strip along the bottom */}
      <mesh position={[0.48, 0.0, 0]} rotation={[0, 0, 0.06]} castShadow>
        <boxGeometry args={[0.72, 0.15, 0.008]} />
        {steelBright}
      </mesh>
      <mesh position={[0.82, 0.05, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[0.16, 0.1, 0.008]} />
        {steelBright}
      </mesh>
      <mesh position={[0.48, -0.075, 0]} rotation={[0, 0, 0.06]}>
        <boxGeometry args={[0.7, 0.014, 0.012]} />
        <meshStandardMaterial color={'#3a3d43'} metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  )
}

/** A claw hammer: wood handle, steel head with striking face + rear claw. */
function ClawHammer({ x, y }: { x: number; y: number }) {
  return (
    <group position={[x, y, 0]}>
      <Hook x={0} y={0.36} />
      {/* handle (hangs head-up, resting on the peg) */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.028, 0.6, 10]} />
        <meshStandardMaterial color={'#7a5530'} metalness={0.05} roughness={0.7} />
      </mesh>
      {/* rubber grip at the bottom */}
      <mesh position={[0, -0.19, 0]} castShadow>
        <cylinderGeometry args={[0.026, 0.03, 0.16, 10]} />
        <meshStandardMaterial color={'#1a1b1e'} roughness={0.8} />
      </mesh>
      {/* head: eye block + neck + round striking face */}
      <mesh position={[0, 0.33, 0]} castShadow>
        <boxGeometry args={[0.09, 0.075, 0.055]} />
        {toolMetal}
      </mesh>
      <mesh position={[0.075, 0.33, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.026, 0.034, 0.07, 12]} />
        {toolMetal}
      </mesh>
      <mesh position={[0.115, 0.33, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.038, 0.038, 0.02, 12]} />
        {steelBright}
      </mesh>
      {/* claw: two prongs curving down-back */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[-0.085, 0.3, s * 0.014]} rotation={[0, s * 0.12, -0.55]} castShadow>
          <boxGeometry args={[0.09, 0.024, 0.016]} />
          {toolMetal}
        </mesh>
      ))}
    </group>
  )
}

/** The simple box level, lying flat on the ledge shelf. */
function LedgeLevel({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.05, 0.11, 0.05]} />
        <meshStandardMaterial color={'#b8961f'} metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.15, 0.055, 0.02]} />
        <meshStandardMaterial color={'#2fbf6a'} emissive={'#0a2a1a'} emissiveIntensity={0.25} transparent opacity={0.75} />
      </mesh>
    </group>
  )
}

function Tools() {
  // per-tool scale wrappers keep each tool anchored at its board position
  const at = (x: number, y: number, s: number, el: JSX.Element) => (
    <group position={[x, y, 0]} scale={s}>{el}</group>
  )
  return (
    <group position={[0, 0, -3.28]}>
      {/* cluster A: graduated combination wrenches, upper-left of the board */}
      {at(0.95, 3.65, 1.35, <ComboWrench x={0} y={0} len={0.44} />)}
      {at(1.28, 3.63, 1.35, <ComboWrench x={0} y={0} len={0.38} r={0.06} />)}
      {at(1.58, 3.61, 1.35, <ComboWrench x={0} y={0} len={0.32} r={-0.05} />)}

      {/* cluster B: screwdrivers, upper-middle */}
      {at(2.15, 3.5, 1.5, <Screwdriver x={0} y={0} c={'#b23c3c'} />)}
      {at(2.42, 3.55, 1.5, <Screwdriver x={0} y={0} c={'#c8a12e'} />)}
      {at(2.69, 3.48, 1.5, <Screwdriver x={0} y={0} c={'#3c6bb2'} />)}

      {/* pliers, mid-board */}
      {at(3.2, 3.5, 1.4, <Pliers x={0} y={0} />)}

      {/* claw hammer, upper-right */}
      {at(3.75, 3.5, 1.2, <ClawHammer x={0} y={0} />)}

      {/* tape measure, right */}
      {at(4.35, 3.5, 1.35, <TapeMeasure x={0} y={0} />)}

      {/* coiled extension cord with a hanging plug, lower-right */}
      <group position={[4.3, 2.7, 0.02]}>
        <Hook x={0} y={0.32} />
        <mesh castShadow>
          <torusGeometry args={[0.24, 0.06, 10, 24]} />
          <meshStandardMaterial color={'#171719'} metalness={0.2} roughness={0.85} />
        </mesh>
        {/* the plug end dangling off the coil */}
        <mesh position={[0.14, -0.36, 0.02]} rotation={[0, 0, 0.2]} castShadow>
          <boxGeometry args={[0.07, 0.1, 0.06]} />
          <meshStandardMaterial color={'#101114'} roughness={0.7} />
        </mesh>
        {[-0.014, 0.014].map((dx) => (
          <mesh key={dx} position={[0.125 + dx, -0.43, 0.02]} castShadow>
            <boxGeometry args={[0.01, 0.04, 0.014]} />
            {steelBright}
          </mesh>
        ))}
      </group>

      {/* lower-left: an adjustable wrench + a handsaw (readable garage staples) */}
      {at(0.55, 2.45, 1.35, <AdjustableWrench x={0} y={0} />)}
      {at(1.35, 2.95, 1.25, <Handsaw x={0} y={0} />)}
    </group>
  )
}

// ---- bench clutter + wires (relative to bench top; sits inside the bench group)
function tube(pts: [number, number, number][], r: number, color: string, key?: string) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))
  const geom = new THREE.TubeGeometry(curve, Math.max(8, pts.length * 6), r, 6)
  return (
    <mesh key={key} geometry={geom} castShadow>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.1} />
    </mesh>
  )
}

/** A breadboard top: cream base, red/blue power rails, and a real hole grid. */
function makeBreadboardTex() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 180
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#e9e6dc'
  ctx.fillRect(0, 0, 256, 180)
  // power rails
  ctx.strokeStyle = '#c0392b'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(10, 16); ctx.lineTo(246, 16); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(10, 164); ctx.lineTo(246, 164); ctx.stroke()
  ctx.strokeStyle = '#2c5aa0'
  ctx.beginPath(); ctx.moveTo(10, 26); ctx.lineTo(246, 26); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(10, 154); ctx.lineTo(246, 154); ctx.stroke()
  // center channel
  ctx.fillStyle = '#cfccc2'
  ctx.fillRect(0, 86, 256, 8)
  // hole grid
  ctx.fillStyle = '#1c1c1c'
  for (let x = 16; x < 246; x += 10) {
    for (const y of [8, 20, 40, 50, 60, 70, 80, 100, 110, 120, 130, 140, 160, 172]) {
      ctx.fillRect(x, y, 2.4, 2.4)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function BenchClutter() {
  const screws = useMemo(() => Array.from({ length: 24 }, () => [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4] as [number, number]), [])
  const bbTex = useMemo(makeBreadboardTex, [])
  return (
    <group position={[0, DESK_Y, 0]}>
      {/* a real dev board the arm is working over */}
      <group position={[0.98, 0.02, 0.55]} rotation={[0, 0.3, 0]}>
        <RoundedBox args={[0.82, 0.03, 0.56]} radius={0.01} smoothness={2} castShadow receiveShadow>
          <meshStandardMaterial color={'#0f4a2c'} metalness={0.25} roughness={0.5} />
        </RoundedBox>
        {/* main microcontroller IC + its legs */}
        <mesh position={[0.02, 0.05, 0]} castShadow>
          <boxGeometry args={[0.2, 0.05, 0.2]} />
          <meshStandardMaterial color={'#0a0a0c'} metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[-0.09, 0.055, -0.07]}>
          <boxGeometry args={[0.02, 0.008, 0.02]} />
          <meshStandardMaterial color={'#c9b070'} metalness={0.9} roughness={0.3} />
        </mesh>
        {/* header pin rows (gold) */}
        {[-0.36, 0.36].map((z) =>
          Array.from({ length: 12 }).map((_, i) => (
            <mesh key={`${z}:${i}`} position={[-0.33 + i * 0.06, 0.06, z]}>
              <boxGeometry args={[0.014, 0.06, 0.014]} />
              <meshStandardMaterial color={'#c9b070'} metalness={0.9} roughness={0.28} />
            </mesh>
          )),
        )}
        {/* USB-C port */}
        <mesh position={[-0.38, 0.05, 0]} castShadow>
          <boxGeometry args={[0.09, 0.05, 0.11]} />
          <meshStandardMaterial color={'#8a8d92'} metalness={0.85} roughness={0.3} />
        </mesh>
        {/* electrolytic caps + SMD bits */}
        {[[-0.15, 0.12, '#2a3a6a'], [0.24, -0.14, '#1a1a20'], [0.3, 0.14, '#6a4a1a']].map(([x, z, c], i) => (
          <mesh key={`cap${i}`} position={[x as number, 0.07, z as number]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.1, 12]} />
            <meshStandardMaterial color={c as string} metalness={0.3} roughness={0.45} />
          </mesh>
        ))}
        {[[-0.24, -0.05], [0.12, 0.2], [-0.02, -0.2]].map(([x, z], i) => (
          <mesh key={`smd${i}`} position={[x, 0.04, z]}>
            <boxGeometry args={[0.04, 0.02, 0.02]} />
            <meshStandardMaterial color={'#c8a05a'} metalness={0.2} roughness={0.6} />
          </mesh>
        ))}
        {/* two status LEDs */}
        <mesh position={[0.32, 0.045, -0.05]}><boxGeometry args={[0.02, 0.015, 0.02]} /><meshStandardMaterial color={'#7fffa0'} emissive={'#2fbf4a'} emissiveIntensity={2.5} toneMapped={false} /></mesh>
        <mesh position={[0.32, 0.045, 0.0]}><boxGeometry args={[0.02, 0.015, 0.02]} /><meshStandardMaterial color={'#ffb0b0'} emissive={'#c93a3a'} emissiveIntensity={1.8} toneMapped={false} /></mesh>
      </group>

      {/* a servo motor (SO-101 style) + horn + ribbon cable */}
      <group position={[1.15, 0.02, 0.35]} rotation={[0, 0.6, 0]}>
        <RoundedBox args={[0.22, 0.3, 0.14]} radius={0.012} smoothness={2} position={[0, 0.15, 0]} castShadow>
          <meshStandardMaterial color={'#1a1c22'} metalness={0.35} roughness={0.5} />
        </RoundedBox>
        {/* mounting tabs */}
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.24, 0]} castShadow><boxGeometry args={[0.06, 0.03, 0.14]} /><meshStandardMaterial color={'#26282e'} metalness={0.4} roughness={0.5} /></mesh>
        ))}
        {/* gearbox top + output horn */}
        <mesh position={[0, 0.31, 0.03]} castShadow><cylinderGeometry args={[0.06, 0.06, 0.04, 16]} /><meshStandardMaterial color={'#3a3d43'} metalness={0.7} roughness={0.4} /></mesh>
        <mesh position={[0, 0.34, 0.03]} castShadow><boxGeometry args={[0.16, 0.02, 0.03]} /><meshStandardMaterial color={'#c9ccd2'} metalness={0.5} roughness={0.4} /></mesh>
        {/* 3-wire cable */}
        {tube([[0.05, 0.06, -0.06], [0.2, 0.02, -0.2], [0.4, 0.02, -0.1]], 0.016, '#7a2a2a', 'sv')}
      </group>

      {/* parts tray with loose screws */}
      <group position={[1.5, 0.03, 0.7]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.62, 0.08, 0.46]} />
          <meshStandardMaterial color={'#2a2c30'} metalness={0.5} roughness={0.5} />
        </mesh>
        {[-0.18, 0.02, 0.22].map((x) => (
          <mesh key={x} position={[x, 0.05, 0]}>
            <boxGeometry args={[0.02, 0.06, 0.4]} />
            <meshStandardMaterial color={'#1c1e22'} metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        {screws.map(([x, z], i) => (
          <mesh key={i} position={[x * 0.9, 0.08, z * 0.7]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.014, 0.014, 0.05, 6]} />
            <meshStandardMaterial color={'#8a8d92'} metalness={0.8} roughness={0.35} />
          </mesh>
        ))}
      </group>

      {/* soldering iron in a stand + brass sponge + solder spool */}
      <group position={[2.0, 0.02, 0.9]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.05, 0.28]} />
          <meshStandardMaterial color={'#20222a'} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.05, 0.18, 0]} rotation={[0, 0, 0.5]}>
          <torusGeometry args={[0.11, 0.012, 6, 14, Math.PI * 1.2]} />
          <meshStandardMaterial color={'#4a4d53'} metalness={0.7} roughness={0.4} />
        </mesh>
        <group position={[0.1, 0.16, 0.02]} rotation={[0, 0, -0.55]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.3, 10]} />
            <meshStandardMaterial color={'#8a2a2a'} metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.22, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.006, 0.16, 8]} />
            <meshStandardMaterial color={'#6a6a70'} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      </group>

      {/* real robotics parts by the monitors (far left) — pulled clear of the keyboard */}
      <group position={[-3.95, 0.02, 0.78]}>
        {/* --- an Arduino-style board --- */}
        <group position={[-0.15, 0, 0.05]} rotation={[0, 0.35, 0]}>
          <RoundedBox args={[0.42, 0.028, 0.3]} radius={0.008} smoothness={2} castShadow>
            <meshStandardMaterial color={'#146a8a'} metalness={0.3} roughness={0.5} />
          </RoundedBox>
          {/* USB-B jack (silver) */}
          <mesh position={[-0.19, 0.04, -0.07]} castShadow><boxGeometry args={[0.09, 0.06, 0.1]} /><meshStandardMaterial color={'#b9bcc2'} metalness={0.85} roughness={0.3} /></mesh>
          {/* barrel power jack (black) */}
          <mesh position={[-0.19, 0.03, 0.08]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.08, 12]} /><meshStandardMaterial color={'#0c0c0e'} roughness={0.5} /></mesh>
          {/* main MCU chip */}
          <mesh position={[0.06, 0.035, 0.02]} castShadow><boxGeometry args={[0.14, 0.03, 0.05]} /><meshStandardMaterial color={'#111' } metalness={0.3} roughness={0.5} /></mesh>
          {/* black female header strips along both long edges */}
          {[-0.12, 0.12].map((z) => (
            <mesh key={z} position={[0.02, 0.035, z]} castShadow><boxGeometry args={[0.32, 0.03, 0.03]} /><meshStandardMaterial color={'#0e0e10'} roughness={0.6} /></mesh>
          ))}
          {/* electrolytic cap + crystal + reset button */}
          <mesh position={[-0.05, 0.05, -0.05]} castShadow><cylinderGeometry args={[0.03, 0.03, 0.06, 12]} /><meshStandardMaterial color={'#20304a'} metalness={0.3} roughness={0.4} /></mesh>
          <mesh position={[0.16, 0.04, -0.03]} castShadow><boxGeometry args={[0.05, 0.025, 0.03]} /><meshStandardMaterial color={'#9a9da3'} metalness={0.7} roughness={0.4} /></mesh>
          {/* two SMD LEDs */}
          <mesh position={[0.17, 0.03, 0.06]}><boxGeometry args={[0.02, 0.012, 0.015]} /><meshStandardMaterial color={'#7fffa0'} emissive={'#2fbf4a'} emissiveIntensity={2} toneMapped={false} /></mesh>
        </group>

        {/* --- a breadboard with a real hole grid + rails --- */}
        <group position={[0.35, 0, -0.02]} rotation={[0, -0.2, 0]}>
          <RoundedBox args={[0.5, 0.05, 0.34]} radius={0.01} smoothness={2} castShadow receiveShadow>
            <meshStandardMaterial color={'#eae7dd'} roughness={0.6} />
          </RoundedBox>
          <mesh position={[0, 0.028, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.34]} />
            <meshStandardMaterial map={bbTex} roughness={0.6} />
          </mesh>
        </group>

        {/* --- a small gearmotor with shaft + terminals --- */}
        <group position={[0.15, 0.02, 0.34]} rotation={[Math.PI / 2, 0, 0.5]}>
          <mesh castShadow><cylinderGeometry args={[0.09, 0.09, 0.22, 20]} /><meshStandardMaterial color={'#8a8d92'} metalness={0.8} roughness={0.35} /></mesh>
          <mesh position={[0, 0.14, 0]} castShadow><boxGeometry args={[0.16, 0.06, 0.16]} /><meshStandardMaterial color={'#c9a24a'} metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.02, 0.02, 0.1, 10]} /><meshStandardMaterial color={'#5a5d63'} metalness={0.9} roughness={0.3} /></mesh>
          <mesh position={[0, -0.13, 0.03]}><boxGeometry args={[0.06, 0.03, 0.02]} /><meshStandardMaterial color={'#b0432e'} roughness={0.5} /></mesh>
        </group>

        {/* --- jumper wires bridging the board + breadboard --- */}
        {tube([[0.0, 0.05, 0.02], [0.1, 0.12, -0.1], [0.22, 0.06, -0.02]], 0.012, '#c0392b', 'jw1')}
        {tube([[0.02, 0.05, 0.08], [0.14, 0.1, 0.05], [0.24, 0.06, 0.06]], 0.012, '#2c5aa0', 'jw2')}
        {tube([[-0.02, 0.05, -0.04], [0.1, 0.09, -0.16], [0.2, 0.06, -0.12]], 0.012, '#2fae5a', 'jw3')}
      </group>

      {/* power strip at the back with cables feeding the gear */}
      <group position={[-0.3, 0.04, -1.4]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 0.08, 0.18]} />
          <meshStandardMaterial color={'#17181c'} metalness={0.3} roughness={0.6} />
        </mesh>
        {[-0.5, -0.2, 0.1, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.045, 0]}>
            <boxGeometry args={[0.12, 0.02, 0.1]} />
            <meshStandardMaterial color={'#0a0a0c'} metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0.6, 0.05, 0]}>
          <boxGeometry args={[0.04, 0.02, 0.02]} />
          <meshStandardMaterial color={'#3fd6c4'} emissive={'#1a6a64'} emissiveIntensity={1.5} toneMapped={false} />
        </mesh>
      </group>
      {/* routed cables: monitors + printer -> power strip */}
      {tube([[-2.9, 0.02, -1.15], [-2.2, 0.03, -1.35], [-1.1, 0.03, -1.4], [-0.9, 0.05, -1.4]], 0.022, '#101012', 'w1')}
      {tube([[2.7, 0.02, -0.6], [1.5, 0.03, -1.2], [0.2, 0.04, -1.4]], 0.022, '#101012', 'w2')}
      {tube([[0.3, 0.05, -1.5], [0.6, 0.02, -1.65], [1.5, -0.9, -1.7]], 0.03, '#0c0c0e', 'w3')}
    </group>
  )
}

/** A stackable louvered parts bin (angled open front, lip, hang-slot, label). */
function PartBin({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* body */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.6, 0.46, 0.66]} />
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.7} />
      </mesh>
      {/* hollowed dark interior opening at the top-front */}
      <mesh position={[0, 0.12, 0.16]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.54, 0.34, 0.02]} />
        <meshStandardMaterial color={'#0c0c0e'} roughness={0.8} />
      </mesh>
      {/* front lip */}
      <mesh position={[0, -0.16, 0.34]} castShadow>
        <boxGeometry args={[0.6, 0.14, 0.04]} />
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.7} />
      </mesh>
      {/* recessed label card */}
      <mesh position={[0, -0.16, 0.37]}>
        <boxGeometry args={[0.34, 0.1, 0.005]} />
        <meshStandardMaterial color={'#d8d2c0'} roughness={0.6} />
      </mesh>
      {/* stacking ridge on top */}
      <mesh position={[0, 0.25, -0.1]} castShadow>
        <boxGeometry args={[0.5, 0.04, 0.4]} />
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.7} />
      </mesh>
    </group>
  )
}

/** A glass jar of fasteners with a metal lid. */
function ScrewJar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.4, 18]} />
        <meshStandardMaterial color={'#9fb0b8'} metalness={0.1} roughness={0.1} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.2, 18]} />
        <meshStandardMaterial color={'#6a6058'} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.08, 18]} />
        <meshStandardMaterial color={'#3a3d43'} metalness={0.8} roughness={0.35} />
      </mesh>
    </group>
  )
}

/** Background dressing: wall shelves of real parts bins/jars, poster, stool, floor life. */
function Background() {
  const binColors = ['#c9772a', '#3a6a8a', '#3f7a54', '#9a3a3a']
  return (
    <group>
      {/* narrow wall shelves left of the window, holding real parts bins + a jar */}
      {[4.5, 3.1].map((sy, si) => (
        <group key={sy} position={[-6.95, sy, -3.24]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.9, 0.09, 0.72]} />
            <meshStandardMaterial color={'#2a2620'} metalness={0.3} roughness={0.7} />
          </mesh>
          <PartBin position={[-0.55, 0.29, 0]} color={binColors[si * 2]} />
          {si === 0 ? (
            <PartBin position={[0.5, 0.29, 0]} color={binColors[si * 2 + 1]} />
          ) : (
            <ScrewJar position={[0.5, 0.26, 0.05]} />
          )}
        </group>
      ))}
      {/* a taped-up schematic / blueprint poster on the back wall */}
      <mesh position={[6.6, 3.6, -3.34]}>
        <planeGeometry args={[1.8, 2.3]} />
        <meshStandardMaterial color={'#16324a'} emissive={'#0a1a2a'} emissiveIntensity={0.3} roughness={0.9} />
      </mesh>
      <mesh position={[6.6, 3.6, -3.33]}>
        <planeGeometry args={[1.6, 2.1]} />
        <meshStandardMaterial color={'#1e4a6a'} roughness={0.9} wireframe />
      </mesh>
      {/* taped photos / sticky notes cluster */}
      {[[5.2, 4.4, '#c9b56a', -0.1], [5.5, 3.9, '#8a9a6a', 0.08], [5.15, 3.55, '#b57a6a', 0.05]].map(([x, y, c, r], i) => (
        <mesh key={i} position={[x as number, y as number, -3.33]} rotation={[0, 0, r as number]} castShadow>
          <planeGeometry args={[0.42, 0.34]} />
          <meshStandardMaterial color={c as string} roughness={0.8} />
        </mesh>
      ))}
      {/* a round wall clock */}
      <group position={[6.7, 5.3, -3.32]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.08, 28]} />
          <meshStandardMaterial color={'#1a1c20'} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 0.02, 28]} />
          <meshStandardMaterial color={'#e8e4dc'} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.12, 0.07]}>
          <boxGeometry args={[0.02, 0.24, 0.01]} />
          <meshStandardMaterial color={'#111'} />
        </mesh>
        <mesh position={[0.08, 0.02, 0.07]} rotation={[0, 0, -1.0]}>
          <boxGeometry args={[0.02, 0.18, 0.01]} />
          <meshStandardMaterial color={'#111'} />
        </mesh>
      </group>
      {/* wall conduit + cable runs */}
      {[2.2, 2.5].map((y, i) => (
        <mesh key={y} position={[3.5, y, -3.5 + i * 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 9, 8]} />
          <meshStandardMaterial color={i ? '#b23c3c' : '#1a1a1e'} roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      {/* a shop stool pulled up to the bench, left of the monitors */}
      <group position={[-3.75, -2, 0.75]}>
        {/* padded seat */}
        <mesh position={[0, 2.0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.44, 0.44, 0.14, 28]} />
          <meshStandardMaterial color={'#2a1616'} metalness={0.15} roughness={0.6} />
        </mesh>
        {/* central post */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 2.0, 14]} />
          {mSteel}
        </mesh>
        {/* footrest ring */}
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.03, 8, 22]} />
          {mSteelLt}
        </mesh>
        {/* flared base on the floor */}
        <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.48, 0.54, 0.1, 22]} />
          {mSteel}
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
      {/* corner mounting screws holding the board to the wall */}
      {[[0.55, 4.25], [4.65, 4.25], [0.55, 1.75], [4.65, 1.75]].map(([x, y], i) => (
        <group key={i} position={[x, y, -3.28]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 0.04, 12]} />
            <meshStandardMaterial color={'#4a4d53'} metalness={0.8} roughness={0.35} />
          </mesh>
          {/* phillips slot */}
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.06, 0.012, 0.01]} />
            <meshStandardMaterial color={'#15161a'} metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* a small tool ledge/shelf across the board holding cans + a jar */}
      <group position={[2.6, 2.15, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.06, 0.34]} />
          <meshStandardMaterial color={'#2a2119'} metalness={0.3} roughness={0.7} />
        </mesh>
        {/* two little support brackets */}
        {[-1.5, 1.5].map((x) => (
          <mesh key={x} position={[x, -0.09, 0.06]} castShadow>
            <boxGeometry args={[0.05, 0.14, 0.22]} />
            {mSteel}
          </mesh>
        ))}
        {/* spray-paint can: body + label band + shoulder + cap + nozzle */}
        <group position={[-1.1, 0.03, 0.02]}>
          <mesh position={[0, 0.19, 0]} castShadow>
            <cylinderGeometry args={[0.105, 0.105, 0.38, 18]} />
            <meshStandardMaterial color={'#2e5a78'} metalness={0.55} roughness={0.35} />
          </mesh>
          {/* wrapped paper label */}
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.108, 0.108, 0.2, 18]} />
            <meshStandardMaterial color={'#d8d2c2'} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.109, 0.109, 0.07, 18]} />
            <meshStandardMaterial color={'#b0432e'} roughness={0.55} />
          </mesh>
          {/* rolled rim + tapered shoulder + cap + nozzle */}
          <mesh position={[0, 0.385, 0]} castShadow>
            <torusGeometry args={[0.09, 0.014, 8, 18]} />
            {steelBright}
          </mesh>
          <mesh position={[0, 0.415, 0]} castShadow>
            <cylinderGeometry args={[0.055, 0.09, 0.05, 18]} />
            <meshStandardMaterial color={'#8a8d93'} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.465, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.06, 16]} />
            <meshStandardMaterial color={'#c23a3a'} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.02, 8]} />
            <meshStandardMaterial color={'#e8e4dc'} roughness={0.5} />
          </mesh>
        </group>
        {/* glass jar of screws: glass, metal lid, visible hardware inside */}
        <group position={[-0.68, 0.03, 0.02]}>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.115, 0.115, 0.26, 18]} />
            <meshStandardMaterial color={'#aebfc2'} metalness={0.1} roughness={0.12} transparent opacity={0.3} />
          </mesh>
          {/* the screws filling the lower half, seen through the glass */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.14, 14]} />
            <meshStandardMaterial color={'#55575c'} metalness={0.7} roughness={0.55} />
          </mesh>
          {/* screw-top lid with a knurl groove */}
          <mesh position={[0, 0.295, 0]} castShadow>
            <cylinderGeometry args={[0.105, 0.105, 0.05, 18]} />
            <meshStandardMaterial color={'#8a6a2a'} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.283, 0]}>
            <cylinderGeometry args={[0.107, 0.107, 0.012, 18]} />
            <meshStandardMaterial color={'#6a5220'} metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
        {/* small cardboard parts box: flaps + packing-tape strip + side label */}
        <group position={[0.9, 0.03, 0.02]} rotation={[0, -0.15, 0]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <boxGeometry args={[0.36, 0.28, 0.26]} />
            <meshStandardMaterial color={'#8a5f38'} roughness={0.75} />
          </mesh>
          {/* slightly-open top flaps */}
          <mesh position={[-0.09, 0.29, 0]} rotation={[0, 0, 0.12]} castShadow>
            <boxGeometry args={[0.18, 0.012, 0.25]} />
            <meshStandardMaterial color={'#96693e'} roughness={0.75} />
          </mesh>
          <mesh position={[0.09, 0.295, 0]} rotation={[0, 0, -0.18]} castShadow>
            <boxGeometry args={[0.18, 0.012, 0.25]} />
            <meshStandardMaterial color={'#96693e'} roughness={0.75} />
          </mesh>
          {/* packing tape down the front + a shipping label */}
          <mesh position={[0, 0.14, 0.131]}>
            <boxGeometry args={[0.07, 0.28, 0.004]} />
            <meshStandardMaterial color={'#b8a988'} roughness={0.4} />
          </mesh>
          <mesh position={[-0.09, 0.17, 0.131]}>
            <boxGeometry args={[0.12, 0.08, 0.004]} />
            <meshStandardMaterial color={'#e2ddd0'} roughness={0.6} />
          </mesh>
        </group>
        {/* the box level lying flat on the ledge, in front of the cans/jar/box.
            Nested groups: outer spins it in-plane, inner lays it flat (vial up) —
            avoids the Euler tilt from combining both on one node. */}
        <group position={[0.05, 0.033, 0.06]} rotation={[0, 0.14, 0]}>
          <LedgeLevel position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        </group>
      </group>
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
      <Background />
      <ShopLight />
      {/* bench cluster, pushed back against the wall */}
      <group position={[0, 0, BENCH_Z]}>
        <Workbench />
        <group position={[0, DESK_Y, 0]}>
          <Workstation />
        </group>
        {/* the 3D printer, on the bench right */}
        <Printer3D position={[2.7, DESK_Y + 0.17, -0.4]} rotation={[0, -0.5, 0]} scale={0.6} />
        <BenchClutter />
        <So101Arm />
      </group>

      {/* PC tucked under the desk, under the monitors */}
      <PcTower position={[-2.4, -2, -1.2]} rotation={[0, 0.5, 0]} />
      <ToolChest position={[-5.6, -2, -2.2]} />
      {/* under the table beside the drawers: a basketball + a pair of sneakers
          (Blender GLBs, loaded async so they need a Suspense boundary) */}
      <Suspense fallback={null}>
        <Basketball position={[1.35, -1.66, -1.35]} rotation={[-Math.PI / 2 + 0.15, 0.7, 0]} />
        <Sneaker position={[0.2, -2, -1.15]} rotation={[0, 0.9, 0]} />
        <Sneaker position={[0.52, -2, -1.42]} rotation={[0, 1.7, 0.06]} />
      </Suspense>

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
