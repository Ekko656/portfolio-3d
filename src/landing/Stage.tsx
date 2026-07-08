import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'

/**
 * P0 foundation — the warm dim workshop at night.
 *
 * Deliberately minimal: one composed frame, a fixed camera, the real SO-101 on
 * a workbench, and film-lit warm-night mood. No stock kit, no scattered props.
 * This is the palette/identity + composition baseline the rest builds on.
 */

// Warm-night palette (single source of truth for the scene).
const BG = '#0a0806' // near-black warm brown
const FLOOR = '#0e0b09'
const BENCH = '#17130f'
const KEY = '#ffcf96' // warm tungsten key
const PRACTICAL = '#ff9a4d' // the desk-lamp practical glow
const RIM = '#8fb4ff' // cool moonlight rim for metal separation

/** Dark workbench slab the arm sits on (top flush with the arm base at y=0). */
function Bench() {
  return (
    <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
      <boxGeometry args={[5.2, 2, 3.2]} />
      <meshStandardMaterial color={BENCH} metalness={0.4} roughness={0.6} />
    </mesh>
  )
}

/** Floor + a single back wall to contain the frame in warm darkness. */
function Room() {
  return (
    <group>
      <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={FLOOR} metalness={0.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 4, -7]} receiveShadow>
        <planeGeometry args={[60, 24]} />
        <meshStandardMaterial color={BG} metalness={0.1} roughness={0.95} />
      </mesh>
    </group>
  )
}

function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null)
  return (
    <>
      <ambientLight intensity={0.12} color={KEY} />
      {/* warm key from upper-front-left, casts the hero shadow */}
      <directionalLight
        ref={key}
        position={[-4.5, 6.5, 4]}
        intensity={2.4}
        color={KEY}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 0.1, 30]} />
      </directionalLight>
      {/* cool moonlight rim from behind-right for metal separation */}
      <directionalLight position={[6, 4, -5]} intensity={0.6} color={RIM} />
      {/* the desk-lamp practical: a warm point glow just off the bench */}
      <pointLight position={[2.4, 1.6, 1.8]} intensity={9} distance={9} decay={2} color={PRACTICAL} />
    </>
  )
}

export default function Stage() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [6.0, 3.2, 12.0], fov: 32, near: 0.1, far: 100 }}
      onCreated={({ scene, camera }) => {
        scene.background = new THREE.Color(BG)
        scene.fog = new THREE.Fog(BG, 16, 40)
        camera.lookAt(0, 1.5, -0.5)
      }}
    >
      <Lighting />

      {/* subtle env for PBR metal reflections — Lightformers, no network fetch */}
      <Environment resolution={256}>
        <Lightformer intensity={1.2} color={KEY} position={[-3, 4, 3]} scale={[6, 6, 1]} />
        <Lightformer intensity={0.5} color={RIM} position={[5, 3, -4]} scale={[5, 5, 1]} />
        <Lightformer intensity={0.3} color={PRACTICAL} position={[3, 1, 3]} scale={[3, 3, 1]} />
      </Environment>

      <Room />
      <Bench />
      <So101Arm />

      <EffectComposer>
        <Bloom luminanceThreshold={0.55} luminanceSmoothing={0.2} intensity={0.7} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  )
}
