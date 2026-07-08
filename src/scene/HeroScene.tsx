import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense } from 'react'
import ParticleHumanoid from './ParticleHumanoid'

/** The hero canvas: the particle humanoid with a soft bloom glow. */
export default function HeroScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 7], fov: 38 }}
    >
      <Suspense fallback={null}>
        <ParticleHumanoid />
        <EffectComposer>
          <Bloom
            intensity={0.9}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.4}
            mipmapBlur
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
