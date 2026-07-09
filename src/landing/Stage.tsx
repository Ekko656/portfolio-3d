import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import Window from './Window'
import Outdoors from './Outdoors'

/**
 * The warm dim home-garage workshop at a rainy dawn. Blockout stage: real
 * architecture (concrete floor, corner walls, ceiling, a hanging shop light)
 * establishes the room + scale; texture and station dressing come next.
 */

// ---- palette ----------------------------------------------------------------
const BG = '#0a0806'
const CONCRETE = '#1d1a15'
const PLY = '#2c2318' // warm plywood wall
const BENCH_TOP = '#241a12'
const METAL = '#2a2723'
const KEY = '#ffcf96'
const PRACTICAL = '#ff9a4d'
const RIM = '#8fb4ff'

const DESK_Y = 0.4

const mBenchTop = <meshStandardMaterial color={BENCH_TOP} metalness={0.15} roughness={0.72} />
const mMetal = <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />

/** The arm's workbench. */
function Workbench() {
  const legXs = [-2.85, 2.85]
  const legZs = [-1.3, 1.3]
  return (
    <group>
      <RoundedBox args={[6.4, 0.16, 3.1]} radius={0.03} smoothness={4} position={[0, DESK_Y - 0.08, 0]} castShadow receiveShadow>
        {mBenchTop}
      </RoundedBox>
      <mesh position={[0, DESK_Y - 0.2, 0]} castShadow>
        <boxGeometry args={[6.2, 0.1, 2.9]} />
        {mMetal}
      </mesh>
      {legXs.map((x) =>
        legZs.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, (DESK_Y - 0.25 - 2) / 2 + 0.1, z]} castShadow receiveShadow>
            <boxGeometry args={[0.14, DESK_Y - 0.25 + 2, 0.14]} />
            {mMetal}
          </mesh>
        )),
      )}
      <mesh position={[0, -1.15, 0]} receiveShadow castShadow>
        <boxGeometry args={[5.9, 0.08, 2.7]} />
        {mMetal}
      </mesh>
    </group>
  )
}

/** Concrete floor, a left corner wall, and a ceiling — the room shell. */
function Shell() {
  return (
    <group>
      {/* concrete floor */}
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={CONCRETE} metalness={0.05} roughness={0.92} />
      </mesh>
      {/* left wall (plywood) forming a corner with the window wall — kept
          interior-side of the back wall so it never occludes the outdoors */}
      <mesh position={[-8, 2.5, 3.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[15, 12]} />
        <meshStandardMaterial color={PLY} metalness={0.05} roughness={0.9} />
      </mesh>
      {/* ceiling — interior only, stops at the back wall so it doesn't occlude
          the dawn sky seen through the window */}
      <mesh position={[0, 7, 4]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 15]} />
        <meshStandardMaterial color={'#100d0a'} metalness={0.05} roughness={0.95} />
      </mesh>
    </group>
  )
}

/** A hanging fluorescent shop light over the bench — motivates the warm key. */
function ShopLight() {
  return (
    <group position={[-0.5, 5.4, -0.2]}>
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
      <ambientLight intensity={0.1} color={KEY} />
      {/* warm key roughly from the shop light, casts the hero shadow */}
      <directionalLight
        ref={key}
        position={[-2.5, 6.5, 3.0]}
        intensity={1.5}
        color={KEY}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 30]} />
      </directionalLight>
      {/* cool moonlight/dawn rim from the window side */}
      <directionalLight position={[-6, 4, -5]} intensity={0.7} color={RIM} />
    </>
  )
}

export default function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      camera={{ position: [7.6, 3.4, 12.5], fov: 36, near: 0.1, far: 100 }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(BG)
        scene.fog = new THREE.Fog(BG, 20, 52)
        camera.lookAt(0, 1.1, -0.2)
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
      <ShopLight />
      <Workbench />
      <So101Arm />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
