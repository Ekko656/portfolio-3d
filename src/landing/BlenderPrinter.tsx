import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/** Loads a Blender-exported GLB (printer, PC, …) and places it. */
export default function GlbModel({
  url,
  position,
  rotation,
  scale,
}: {
  url: string
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
}) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
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
  return <primitive object={model} position={position} rotation={rotation} scale={scale} />
}

useGLTF.preload('/models/printer.glb')
useGLTF.preload('/models/pc.glb')
