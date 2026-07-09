import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/** The Blender-modeled 3D printer (public/models/printer.glb), placed on the bench. */
export default function BlenderPrinter(props: { position?: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF('/models/printer.glb')
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
  return <primitive object={model} {...props} />
}

useGLTF.preload('/models/printer.glb')
