import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import URDFLoader from 'urdf-loader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { armState } from '../armState'

type Joints = Record<string, { setJointValue: (v: number) => void }>

/**
 * The statement piece: a projector table casting a violet hologram of the
 * SO-101 — and the hologram MIRRORS the real arm's joints live (it reads
 * armState every frame). The room is literally dreaming about its robot.
 */
export default function HoloTable({
  position = [-7, 0, -6] as [number, number, number],
}: {
  position?: [number, number, number]
}) {
  const [ghost, setGhost] = useState<THREE.Object3D | null>(null)
  const joints = useRef<Joints | null>(null)
  const spin = useRef<THREE.Group>(null)
  const flickerMats = useRef<THREE.MeshBasicMaterial[]>([])

  useEffect(() => {
    const manager = new THREE.LoadingManager()
    const loader = new URDFLoader(manager)
    ;(loader as unknown as { packages: Record<string, string> }).packages = {
      so_arm_description: '/so101',
    }
    ;(loader as unknown as {
      loadMeshCb: (path: string, m: THREE.LoadingManager, done: (o: THREE.Object3D) => void) => void
    }).loadMeshCb = (path, m, done) => {
      new STLLoader(m).load(path, (geom) => {
        geom.computeVertexNormals()
        const mesh = new THREE.Mesh(geom)
        mesh.userData.src = path
        done(mesh)
      })
    }

    let alive = true
    let built: THREE.Object3D | null = null
    loader.load('/so101/so101.urdf', (r: THREE.Object3D) => {
      built = r
    })
    manager.onLoad = () => {
      if (!alive || !built) return
      const mats: THREE.MeshBasicMaterial[] = []
      built.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (mesh.isMesh) {
          const src = String(mesh.userData.src)
          if (src.includes('waveshare_mounting_plate') || src.includes('base_motor_holder') || src.includes('base_so101_v2')) {
            mesh.visible = false
            return
          }
          const m = new THREE.MeshBasicMaterial({
            color: '#b18cff',
            wireframe: true,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
          mesh.material = m
          mats.push(m)
        }
      })
      flickerMats.current = mats
      joints.current = (built as unknown as { joints: Joints }).joints
      setGhost(built)
    }
    return () => {
      alive = false
    }
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    // mirror the hero's live joints
    const j = joints.current
    if (j) {
      j['Rotation']?.setJointValue(armState.Rotation)
      j['Pitch']?.setJointValue(armState.Pitch)
      j['Elbow']?.setJointValue(armState.Elbow)
      j['Wrist_Pitch']?.setJointValue(armState.Wrist_Pitch)
      j['Wrist_Roll']?.setJointValue(armState.Wrist_Roll)
      j['Jaw']?.setJointValue(armState.Jaw)
    }
    // slow rotation + hologram flicker
    if (spin.current) spin.current.rotation.y = t * 0.25
    const flick = 0.2 + Math.sin(t * 17) * 0.02 + Math.sin(t * 3.1) * 0.03
    flickerMats.current.forEach((m) => (m.opacity = flick))
  })

  return (
    <group position={position}>
      {/* projector pedestal */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 0.9, 24]} />
        <meshStandardMaterial color="#232b38" metalness={0.9} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <cylinderGeometry args={[0.42, 0.5, 0.06, 24]} />
        <meshStandardMaterial color="#0c1424" emissive="#8f6bff" emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      {/* light cone up to the hologram */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[1.5, 2.6, 24, 1, true]} />
        <meshBasicMaterial
          color="#8f6bff"
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={7} distance={7} color="#8f6bff" />

      {/* the ghost SO-101, half scale, floating above the lens */}
      <group ref={spin} position={[0, 1.05, 0]}>
        {ghost && <primitive object={ghost} rotation={[-Math.PI / 2, 0, 0]} scale={4} />}
      </group>
    </group>
  )
}
