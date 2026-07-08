import { Suspense, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const BASE = '/models/scifi/'

type Props = {
  name: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number | [number, number, number]
}

function Inner({ name, position, rotation, scale }: Props) {
  const { scene } = useGLTF(BASE + name + '.gltf')
  const cloned = useMemo(() => {
    const c = scene.clone(true)
    c.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        m.castShadow = true
        m.receiveShadow = true
      }
    })
    return c
  }, [scene])
  return <primitive object={cloned} position={position} rotation={rotation} scale={scale} />
}

/**
 * A Quaternius MegaKit piece (real CC0 PBR model), shadow-enabled and cloned
 * per placement. Each model owns its own Suspense boundary so one slow or
 * flaky asset can never suspend the whole world.
 */
export default function Model(props: Props) {
  return (
    <Suspense fallback={null}>
      <Inner {...props} />
    </Suspense>
  )
}

/** Preload the pieces used in the scene so they pop in together. */
export function preloadKit(names: string[]) {
  names.forEach((n) => useGLTF.preload(BASE + n + '.gltf'))
}
