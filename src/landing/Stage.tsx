import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import Window from './Window'
import Outdoors from './Outdoors'
import Workstation from './Workstation'
import GlbModel from './BlenderPrinter'
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

function BenchClutter() {
  const screws = useMemo(() => Array.from({ length: 24 }, () => [(Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.4] as [number, number]), [])
  return (
    <group position={[0, DESK_Y, 0]}>
      {/* PCB the arm is working over */}
      <group position={[0.5, 0.02, 0.55]} rotation={[0, 0.3, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.03, 0.5]} />
          <meshStandardMaterial color={'#123f2a'} metalness={0.3} roughness={0.5} />
        </mesh>
        {[[-0.2, 0.1], [0.15, -0.05], [0.05, 0.15]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.05, z]} castShadow>
            <boxGeometry args={[0.12, 0.05, 0.09]} />
            <meshStandardMaterial color={'#0c0c0e'} metalness={0.4} roughness={0.5} />
          </mesh>
        ))}
        {[[-0.25, -0.12], [0.28, 0.1], [0.0, -0.18]].map(([x, z], i) => (
          <mesh key={`c${i}`} position={[x, 0.06, z]} castShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.1, 10]} />
            <meshStandardMaterial color={'#3a4a6a'} metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
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
        <mesh position={[0.28, 0.13, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.1, 0.035, 10, 20]} />
          <meshStandardMaterial color={'#c9c2b0'} metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* coffee mug */}
      <group position={[-3.55, 0.13, 0.6]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.26, 20]} />
          <meshStandardMaterial color={'#7a3b2a'} metalness={0.05} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.02, 20]} />
          <meshStandardMaterial color={'#2a1a12'} roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0.13, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.018, 8, 14, Math.PI]} />
          <meshStandardMaterial color={'#7a3b2a'} roughness={0.6} />
        </mesh>
      </group>

      {/* a coil of hookup wire */}
      <mesh position={[1.0, 0.06, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.14, 0.035, 10, 24]} />
        <meshStandardMaterial color={'#b23c3c'} roughness={0.6} metalness={0.1} />
      </mesh>

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

/** Background dressing: a wall shelf of bins, a schematic poster, a shop stool. */
function Background() {
  const binColors = ['#3a4d63', '#7a3b2a', '#3f5a44', '#4a4438', '#2f4a52']
  return (
    <group>
      {/* wall shelf with parts totes, left of the window on the back wall */}
      <group position={[-7.4, 4.4, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.1, 0.9]} />
          <meshStandardMaterial color={'#2a2620'} metalness={0.3} roughness={0.7} />
        </mesh>
        {[-1.2, -0.45, 0.35, 1.15].map((x, i) => (
          <mesh key={x} position={[x, 0.32, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.66, 0.5, 0.7]} />
            <meshStandardMaterial color={binColors[i % binColors.length]} metalness={0.1} roughness={0.7} />
          </mesh>
        ))}
      </group>
      {/* a second lower shelf with boxes + a coil */}
      <group position={[-7.4, 2.4, -3.2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.4, 0.1, 0.9]} />
          <meshStandardMaterial color={'#2a2620'} metalness={0.3} roughness={0.7} />
        </mesh>
        <mesh position={[-0.9, 0.4, 0]} castShadow>
          <boxGeometry args={[0.9, 0.7, 0.7]} />
          <meshStandardMaterial color={'#5a4636'} roughness={0.8} />
        </mesh>
        <mesh position={[0.3, 0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.6, 0.6]} />
          <meshStandardMaterial color={'#3a3a40'} roughness={0.7} />
        </mesh>
        <mesh position={[1.2, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.28, 0.08, 10, 24]} />
          <meshStandardMaterial color={'#17140f'} roughness={0.85} />
        </mesh>
      </group>
      {/* a taped-up schematic / blueprint poster on the back wall */}
      <mesh position={[6.5, 3.4, -3.34]}>
        <planeGeometry args={[1.9, 2.5]} />
        <meshStandardMaterial color={'#16324a'} emissive={'#0a1a2a'} emissiveIntensity={0.3} roughness={0.9} />
      </mesh>
      <mesh position={[6.5, 3.4, -3.33]}>
        <planeGeometry args={[1.7, 2.3]} />
        <meshStandardMaterial color={'#1e4a6a'} roughness={0.9} wireframe />
      </mesh>
      {/* wall conduit + cable runs */}
      {[2.2, 2.5].map((y, i) => (
        <mesh key={y} position={[3.5, y, -3.5 + i * 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 9, 8]} />
          <meshStandardMaterial color={i ? '#b23c3c' : '#1a1a1e'} roughness={0.7} metalness={0.2} />
        </mesh>
      ))}
      {/* a shop stool tucked under the bench-left */}
      <group position={[-2.5, -2, 1.6]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.09, 20]} />
          <meshStandardMaterial color={'#2a1414'} metalness={0.2} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.0, 10]} />
          {mSteel}
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.28, 0.05, Math.sin(a) * 0.28]} rotation={[0, -a, 0.35]} castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
              {mSteel}
            </mesh>
          )
        })}
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
        {/* spray can, jar of bits, small box */}
        <mesh position={[-1.1, 0.24, 0.02]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.42, 14]} />
          <meshStandardMaterial color={'#3a6a8a'} metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[-0.7, 0.2, 0.02]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.34, 14]} />
          <meshStandardMaterial color={'#6a5a3a'} metalness={0.1} roughness={0.5} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0.9, 0.16, 0.02]} castShadow>
          <boxGeometry args={[0.36, 0.3, 0.26]} />
          <meshStandardMaterial color={'#7a3b2a'} metalness={0.1} roughness={0.7} />
        </mesh>
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
        {/* the Blender-modeled 3D printer, on the bench right */}
        <GlbModel url="/models/printer.glb" position={[2.7, DESK_Y + 0.32, -0.35]} rotation={[0, -0.5, 0]} scale={0.42} />
        <BenchClutter />
        <So101Arm />
      </group>

      {/* floor dressing beside the bench */}
      <GlbModel url="/models/pc.glb" position={[4.5, -2, -0.2]} rotation={[0, -0.7, 0]} scale={0.58} />
      <ToolChest position={[-5.6, -2, -2.2]} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
