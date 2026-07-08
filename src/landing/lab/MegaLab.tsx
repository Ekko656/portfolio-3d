import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Model, { preloadKit } from './Model'
import HoloTelemetry from './HoloTelemetry'
import Drone from './Drone'
import Scanner from './Scanner'
import IgnitionCore from './IgnitionCore'
import HoloTable from './HoloTable'
import DataStreams from './DataStreams'
import { HERO_Z } from '../ignition'

const TILE = 4
const EDGE = 16 // room half-size (walls sit here)

const USED = [
  'Platform_DarkPlates',
  'WallAstra_Straight',
  'Column_Large_Straight',
  'TopCables_Straight',
  'Prop_Computer',
  'Prop_Crate3',
  'Prop_Crate4',
  'Prop_Barrel_Large',
  'Prop_Light_Wide',
  'Prop_Cable_1',
  'Prop_Cable_3',
  'Prop_Vent_Wide',
  'Prop_Vent_Big',
  'Prop_Chest',
  'Prop_ItemHolder',
  'Prop_AccessPoint',
  'Door_Frame_Square',
  'Door_Metal',
  'Decal_Line_90_Round_Large',
  'Decal_Dashes',
  'Decal_Line_Straight',
  'Decal_Logo',
  'Decal_Sign',
]
preloadKit(USED)

const DECAL_Y = 0.015
const floorCells = [-4, -3, -2, -1, 0, 1, 2, 3, 4]
const wallCells = [-3, -2, -1, 0, 1, 2, 3]
const ceilCells = [-2, -1, 0, 1, 2]

/** Pulsing warning beacon (mounted above the bay door). */
function Beacon({ position }: { position: [number, number, number] }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null)
  const light = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    const p = (Math.sin(clock.elapsedTime * 2.2) + 1) / 2
    if (mat.current) mat.current.emissiveIntensity = 0.4 + p * 2.6
    if (light.current) light.current.intensity = p * 6
  })
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.14, 0.18, 0.12, 16]} />
        <meshStandardMaterial color="#1a212d" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.11, 0]}>
        <sphereGeometry args={[0.11, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial ref={mat} color="#1a0c04" emissive="#ffae5c" emissiveIntensity={1} toneMapped={false} transparent opacity={0.9} />
      </mesh>
      <pointLight ref={light} position={[0, 0.3, 0.3]} color="#ffae5c" distance={7} />
    </group>
  )
}

/** Flickering status pips above a console — tiny life on every screen. */
function BlinkPips({ position }: { position: [number, number, number] }) {
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    mats.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = Math.sin(t * (2 + i * 0.7) + i * 2.1) > 0.2 ? 2.6 : 0.2
    })
  })
  const colors = ['#48e58b', '#39c6ff', '#ffae5c']
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[(i - 1) * 0.14, 0, 0]}>
          <boxGeometry args={[0.07, 0.04, 0.02]} />
          <meshStandardMaterial
            ref={(m) => (mats.current[i] = m)}
            color="#04141c"
            emissive={c}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/** Hanging light fixture with a real pool of light below it. */
function HangLight({ position, color = '#cfe0ff' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
        <meshStandardMaterial color="#10141c" metalness={0.6} roughness={0.6} />
      </mesh>
      <group position={[0, -0.85, 0]}>
        <Model name="Prop_Light_Wide" position={[0, 0, 0]} />
        <pointLight position={[0, -0.35, 0]} intensity={11} distance={17} color={color} />
      </group>
    </group>
  )
}

/**
 * The robotics bay: uniform dark-plate floor, three-storey walls with a
 * detailed cable-run ceiling over the centre, bay door + beacon, consoles,
 * safety rails around the work zone, live telemetry, drone patrol.
 */
export default function MegaLab() {
  return (
    <group>
      {/* floor */}
      {floorCells.map((gx) =>
        floorCells.map((gz) => (
          <Model key={`f${gx}${gz}`} name="Platform_DarkPlates" position={[gx * TILE, 0, gz * TILE]} />
        )),
      )}

      {/* detailed cable-run ceiling over the centre + dark backdrop above */}
      {ceilCells.map((gx) =>
        ceilCells.map((gz) => (
          <Model
            key={`c${gx}${gz}`}
            name="TopCables_Straight"
            position={[gx * TILE, 12.15, gz * TILE]}
          />
        )),
      )}
      <mesh position={[0, 12.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[44, 44]} />
        <meshStandardMaterial color="#0a0d13" metalness={0.4} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* four-storey walls (back, left, right) */}
      {[0, 3.03, 6.06, 9.09].map((y) => (
        <group key={`row${y}`}>
          {wallCells.map((g) => (
            <Model key={`wb${g}`} name="WallAstra_Straight" position={[g * TILE, y, -EDGE]} rotation={[0, Math.PI / 2, 0]} />
          ))}
          {wallCells.map((g) => (
            <Model key={`wl${g}`} name="WallAstra_Straight" position={[-EDGE, y, g * TILE]} rotation={[0, 0, 0]} />
          ))}
          {wallCells.map((g) => (
            <Model key={`wr${g}`} name="WallAstra_Straight" position={[EDGE, y, g * TILE]} rotation={[0, Math.PI, 0]} />
          ))}
        </group>
      ))}
      {/* trim beam closing the last sliver to the ceiling */}
      {(
        [
          [0, -EDGE, 0],
          [-EDGE, 0, Math.PI / 2],
          [EDGE, 0, Math.PI / 2],
        ] as [number, number, number][]
      ).map(([x, z, ry], i) => (
        <mesh key={`trim${i}`} position={[x, 12.3, z]} rotation={[0, ry, 0]}>
          <boxGeometry args={[2 * EDGE + 1, 0.45, 0.5]} />
          <meshStandardMaterial color="#12171f" metalness={0.6} roughness={0.6} />
        </mesh>
      ))}
      {/* front closure — full-height dark panel beyond the camera's max orbit */}
      <mesh position={[0, 6.3, EDGE + 2.2]}>
        <boxGeometry args={[2 * EDGE + 8, 13, 0.4]} />
        <meshStandardMaterial color="#141a24" metalness={0.6} roughness={0.65} />
      </mesh>

      {/* structural columns at corners + wall midpoints */}
      {[
        [-EDGE, -EDGE],
        [EDGE, -EDGE],
        [-EDGE, EDGE],
        [EDGE, EDGE],
        [-EDGE, 0],
        [EDGE, 0],
        [0 - EDGE / 2, -EDGE],
        [EDGE / 2, -EDGE],
      ].map(([x, z], i) => (
        <Model key={`col${i}`} name="Column_Large_Straight" position={[x, 0, z]} />
      ))}

      {/* bay door centred in the back wall, beacon above it */}
      <group position={[0, 0, -EDGE + 1.15]}>
        <Model name="Door_Frame_Square" position={[0, 0, 0]} />
        <Model name="Door_Metal" position={[0, 0, -0.12]} />
      </group>
      <Beacon position={[0, 5.6, -EDGE + 1.3]} />
      <Model name="Prop_AccessPoint" position={[3.4, 0, -EDGE + 0.85]} rotation={[0, Math.PI / 2, 0]} />

      {/* consoles: two flanking the door + one per side wall */}
      {[-6.5, 6.5].map((x, i) => (
        <group key={`console${i}`}>
          <Model name="Prop_Computer" position={[x, 0, -EDGE + 0.9]} />
          <BlinkPips position={[x, 1.75, -EDGE + 1.15]} />
        </group>
      ))}
      <group>
        <Model name="Prop_Computer" position={[-EDGE + 0.9, 0, -4]} rotation={[0, Math.PI / 2, 0]} />
        <BlinkPips position={[-EDGE + 1.15, 1.75, -4]} />
      </group>
      <group>
        <Model name="Prop_Computer" position={[EDGE - 0.9, 0, 6]} rotation={[0, -Math.PI / 2, 0]} />
        <BlinkPips position={[EDGE - 1.15, 1.75, 6]} />
      </group>

      {/* wall vents on the second storey */}
      <Model name="Prop_Vent_Big" position={[-9, 4.4, -EDGE + 0.65]} rotation={[Math.PI / 2, 0, 0]} />
      <Model name="Prop_Vent_Big" position={[9, 4.4, -EDGE + 0.65]} rotation={[Math.PI / 2, 0, 0]} />
      <Model name="Prop_Vent_Big" position={[-EDGE + 0.65, 4.4, 5]} rotation={[Math.PI / 2, 0, Math.PI / 2]} />

      {/* work clutter, hugging the room edges */}
      <group position={[-10.5, 0, 6]} rotation={[0, 0.4, 0]}>
        <Model name="Prop_Crate3" position={[0, 0, 0]} />
        <Model name="Prop_Crate4" position={[1.3, 0, 0.4]} rotation={[0, -0.5, 0]} />
        <Model name="Prop_Crate3" position={[0.4, 1.0, 0.15]} rotation={[0, 0.9, 0]} scale={0.8} />
        <Model name="Prop_Barrel_Large" position={[-1.2, 0, 0.8]} />
      </group>
      <group position={[11, 0, 3.5]} rotation={[0, -0.6, 0]}>
        <Model name="Prop_Barrel_Large" position={[0, 0, 0]} />
        <Model name="Prop_Barrel_Large" position={[0.7, 0, 0.5]} />
        <Model name="Prop_Crate4" position={[-0.4, 0, 1.4]} rotation={[0, 0.3, 0]} />
      </group>
      <group position={[-12, 0, 10]} rotation={[0, 0.8, 0]}>
        <Model name="Prop_Chest" position={[0, 0, 0]} />
        <Model name="Prop_ItemHolder" position={[1.6, 0, 0.3]} rotation={[0, 0.4, 0]} />
        <Model name="Prop_Barrel_Large" position={[-1.3, 0, 0.5]} />
      </group>

      {/* floor markings — work zone rings follow the hero forward */}
      <group position={[0, 0, HERO_Z]}>
        {(
          [
            [2.4, 2.4, 0],
            [2.4, -2.4, Math.PI / 2],
            [-2.4, -2.4, Math.PI],
            [-2.4, 2.4, -Math.PI / 2],
          ] as [number, number, number][]
        ).map(([x, z, r], i) => (
          <Model key={`ring${i}`} name="Decal_Line_90_Round_Large" position={[x, DECAL_Y, z]} rotation={[0, r, 0]} />
        ))}
        {[5.4, 6.6, 7.8].map((z, i) => (
          <Model key={`dash${i}`} name="Decal_Dashes" position={[0, DECAL_Y, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}
      </group>
      {[-8, 8].map((x, i) => (
        <group key={`lane${i}`}>
          <Model name="Decal_Line_Straight" position={[x, DECAL_Y, -6]} />
          <Model name="Decal_Line_Straight" position={[x, DECAL_Y, -2]} />
          <Model name="Decal_Line_Straight" position={[x, DECAL_Y, 2]} />
          <Model name="Decal_Line_Straight" position={[x, DECAL_Y, 6]} />
        </group>
      ))}
      <Model name="Decal_Logo" position={[-9, DECAL_Y, 10.5]} rotation={[0, 0.35, 0]} />
      <Model name="Decal_Sign" position={[4, DECAL_Y, 4.2]} rotation={[0, -0.4, 0]} />

      {/* cabling from consoles toward the dais + along wall bases */}
      <Model name="Prop_Cable_3" position={[0.2, 0.01, -10]} />
      <Model name="Prop_Cable_1" position={[-5.6, 0.01, -13.2]} rotation={[0, 0.7, 0]} />
      <Model name="Prop_Cable_1" position={[6.4, 0.01, -12.8]} rotation={[0, -1.1, 0]} />
      <Model name="Prop_Cable_1" position={[-13.5, 0.01, 0.5]} rotation={[0, 1.5, 0]} />
      <Model name="Prop_Vent_Wide" position={[-14.4, 0.01, -6]} />
      <Model name="Prop_Vent_Wide" position={[14.4, 0.01, 3]} rotation={[0, Math.PI, 0]} />

      {/* live holographic telemetry — tight to the arm, always in frame */}
      <group position={[0, 0, HERO_Z]}>
        <HoloTelemetry position={[3.5, 2.7, -0.9]} rotation={[0, -0.5, 0]} scale={0.9} />
        <HoloTelemetry
          position={[-3.6, 2.95, -1.2]}
          rotation={[0, 0.45, 0]}
          scale={0.8}
          title="BAY-07 · SYSTEMS"
          accent="#a78bff"
        />
      </group>
      <HoloTelemetry position={[-10, 5.6, -10]} rotation={[0, 0.65, 0]} scale={0.65} title="DRONE LINK · PATROL" />

      {/* the statement piece: violet hologram of the SO-101, mirroring the
          hero's live joints */}
      <HoloTable position={[-8, 0, -7]} />

      {/* the room's nervous system */}
      <DataStreams />

      {/* hanging light pools (12m ceiling) */}
      <HangLight position={[-6, 12.2, 5]} />
      <HangLight position={[6, 12.2, 5]} />
      <HangLight position={[0, 12.2, -8]} color="#ffd9b8" />

      {/* ambient events */}
      <Drone />

      {/* hero-cluster effects follow the dais forward */}
      <group position={[0, 0, HERO_Z]}>
        <Scanner />
        <IgnitionCore />
      </group>
    </group>
  )
}
