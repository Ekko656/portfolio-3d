import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import So101Arm from '../components/arm/So101Arm'
import MegaLab from './lab/MegaLab'
import Motes from './Motes'
import { HERO_Z } from './ignition'

/** Tiered dais the arm stands on. */
function Dais() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.0, 2.2, 0.1, 64]} />
        <meshStandardMaterial color="#2a3140" metalness={0.9} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.16, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.14, 64]} />
        <meshStandardMaterial color="#323a4b" metalness={0.95} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.105, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.0, 80]} />
        <meshStandardMaterial color="#0c1424" emissive="#4f8bff" emissiveIntensity={1.6} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* fills so the robot's base is never a black silhouette */}
      <pointLight position={[0.6, 1.3, 3.0]} intensity={10} distance={7} color="#dfe8ff" />
      <pointLight position={[-2.2, 0.9, 0.8]} intensity={5} distance={6} color="#cfe0ff" />
      <pointLight position={[0, 2.9, 0.7]} intensity={6} distance={5} color="#dfe8ff" />
    </group>
  )
}

function World() {
  return (
    <>
      <MegaLab />
      {/* hero cluster pulled toward the camera so the room reads behind it */}
      <group position={[0, 0, HERO_Z]}>
        <Dais />
        <group position={[0, -0.03, 0]}>
          <So101Arm />
        </group>
      </group>
      <Motes count={450} />
    </>
  )
}

/** Cinematic lighting: white key, cool rim, and the room's own pooled lights. */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.22} />
      <directionalLight
        position={[5, 9, 6]}
        intensity={2.6}
        color="#ffffff"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.1, 32]} />
      </directionalLight>
      <spotLight position={[-7, 6, -6]} angle={0.65} penumbra={1} intensity={110} color="#4f7bd6" distance={32} />
      <pointLight position={[6, 2, -4]} intensity={7} color="#ffd2b0" distance={14} />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.6} position={[0, 7, 3]} scale={[12, 8, 1]} color="#dfe8ff" />
        <Lightformer form="rect" intensity={2} position={[-7, 3, 2]} scale={[5, 8, 1]} color="#6f93e6" />
        <Lightformer form="rect" intensity={1.3} position={[7, 2, -3]} scale={[5, 5, 1]} color="#ffffff" />
      </Environment>
    </>
  )
}

/**
 * When the visitor goes idle for a few seconds, the camera breathes — a slow
 * azimuth/polar drift around the hero that eases away the moment they touch
 * the controls again.
 */
function IdleDrift() {
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null
  const lastInput = useRef(0)
  const amp = useRef(0)
  const base = useRef({ az: 0, pol: 0, t0: 0, captured: false })

  useEffect(() => {
    if (!controls) return
    const touch = () => {
      lastInput.current = performance.now() / 1000
      base.current.captured = false
    }
    controls.addEventListener('start', touch)
    controls.addEventListener('end', touch)
    return () => {
      controls.removeEventListener('start', touch)
      controls.removeEventListener('end', touch)
    }
  }, [controls])

  useFrame(({ clock, camera }, delta) => {
    ;(window as unknown as Record<string, unknown>).__cam = camera
    if (!controls) return
    const t = clock.elapsedTime
    const idle = performance.now() / 1000 - lastInput.current > 5
    if (idle && !base.current.captured) {
      base.current = { az: controls.getAzimuthalAngle(), pol: controls.getPolarAngle(), t0: t, captured: true }
    }
    amp.current += ((idle ? 1 : 0) - amp.current) * (1 - Math.exp(-1.1 * delta))
    if (amp.current > 0.002 && base.current.captured) {
      const dt = t - base.current.t0
      controls.setAzimuthalAngle(base.current.az + Math.sin(dt * 0.07) * 0.13 * amp.current)
      controls.setPolarAngle(base.current.pol + Math.sin(dt * 0.045 + 1.2) * 0.035 * amp.current)
    }
  })
  return null
}

export default function LandingScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{ position: [0, 4.0, 17], fov: 44 }}
    >
      <color attach="background" args={['#0b0f17']} />
      <fog attach="fog" args={['#0b0f17', 16, 46]} />

      <Suspense fallback={null}>
        <Lighting />
        <World />
        <IdleDrift />

        <EffectComposer>
          <Bloom intensity={0.85} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.3} darkness={0.72} />
        </EffectComposer>
      </Suspense>

      {/* straight-on composed view; drag explores within limits so the
          composition can't be lost */}
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={7}
        maxDistance={16}
        minPolarAngle={1.0}
        maxPolarAngle={1.5}
        minAzimuthAngle={-0.8}
        maxAzimuthAngle={0.8}
        target={[0, 1.7, HERO_Z]}
      />
    </Canvas>
  )
}
