import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, RoundedBox } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'

/**
 * The warm dim workshop at night. The real SO-101 on a workbench, fixed
 * cinematic camera, film-lit warm-night mood. Detailed elements are added one
 * at a time via the modeling/baking pipeline — no primitive filler props.
 */

// ---- palette (single source of truth) --------------------------------------
const BG = '#0a0806'
const FLOOR = '#0d0a08'
const WOOD = '#241a12' // warm dark bench top
const METAL = '#2a2723' // frame / legs
const KEY = '#ffcf96' // warm tungsten
const PRACTICAL = '#ff9a4d' // warm practical pool
const RIM = '#8fb4ff' // moonlight

const DESK_Y = 0.4 // top surface height; arm base rests here

const mWood = <meshStandardMaterial color={WOOD} metalness={0.15} roughness={0.72} />
const mMetal = <meshStandardMaterial color={METAL} metalness={0.6} roughness={0.5} />

/** The workbench: thick top, metal frame legs, a lower shelf. */
function Workbench() {
  const legXs = [-2.85, 2.85]
  const legZs = [-1.3, 1.3]
  return (
    <group>
      <RoundedBox args={[6.4, 0.16, 3.1]} radius={0.03} smoothness={4} position={[0, DESK_Y - 0.08, 0]} castShadow receiveShadow>
        {mWood}
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

/** Floor + a back wall with a moonlit window that motivates the cool rim. */
function Room() {
  return (
    <group>
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={FLOOR} metalness={0.25} roughness={0.85} />
      </mesh>
      <mesh position={[0, 3, -3.4]} receiveShadow>
        <planeGeometry args={[80, 24]} />
        <meshStandardMaterial color={'#0c0a09'} metalness={0.1} roughness={0.95} />
      </mesh>
      {/* window frame + cool moonlit pane (emissive, dim) */}
      <group position={[-4.2, 3.1, -3.35]}>
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[3.0, 3.8]} />
          <meshStandardMaterial color={'#0e1626'} emissive={RIM} emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[3.05, 0.06, 0.06]} />
          {mMetal}
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.06, 3.85, 0.06]} />
          {mMetal}
        </mesh>
      </group>
    </group>
  )
}

function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null)
  return (
    <>
      <ambientLight intensity={0.1} color={KEY} />
      {/* warm key, casts the hero shadow */}
      <directionalLight
        ref={key}
        position={[-3.5, 6.0, 3.5]}
        intensity={1.6}
        color={KEY}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-9, 9, 9, -9, 0.1, 30]} />
      </directionalLight>
      {/* cool moonlight rim from the window side */}
      <directionalLight position={[-6, 4, -5]} intensity={0.7} color={RIM} />
      {/* warm practical pool over the bench */}
      <pointLight position={[-1.2, 2.0, 1.0]} intensity={5} distance={8} decay={2} color={PRACTICAL} />
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
        scene.fog = new THREE.Fog(BG, 16, 44)
        camera.lookAt(0, 1.1, -0.2)
      }}
    >
      <Lighting />

      <Environment resolution={256}>
        <Lightformer intensity={1.0} color={KEY} position={[-3, 4, 3]} scale={[6, 6, 1]} />
        <Lightformer intensity={0.4} color={RIM} position={[-5, 3, -4]} scale={[5, 5, 1]} />
        <Lightformer intensity={0.25} color={PRACTICAL} position={[3, 1, 3]} scale={[3, 3, 1]} />
      </Environment>

      <Room />
      <Workbench />
      <So101Arm />

      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
