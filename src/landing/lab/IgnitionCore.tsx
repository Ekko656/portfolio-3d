import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ignition, CRADLE_POS, SOCKET_POS } from '../ignition'

const CRADLE_GROUND: [number, number, number] = [CRADLE_POS[0], 0, CRADLE_POS[2]]

/**
 * The Ignition Core — the room's single "button". A pulsing energy core rests
 * in a cradle beside the dais; click it and the arm picks it up and slots it
 * into the dais socket, surging the room. Wordless ENTER cue.
 */
export default function IgnitionCore() {
  const core = useRef<THREE.Group>(null)
  const coreMat = useRef<THREE.MeshStandardMaterial>(null)
  const coreLight = useRef<THREE.PointLight>(null)
  const surgeRing = useRef<THREE.Mesh>(null)
  const surgeLight = useRef<THREE.PointLight>(null)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    document.body.style.cursor = hover ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hover])

  // test hooks: window.__ignite() runs the sequence; __ignition inspects state
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>
    w.__ignite = () => ignition.start()
    w.__ignition = ignition
  }, [])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (!core.current || !coreMat.current) return
    const phase = ignition.phase

    // --- core position ---
    if (phase === 'idle' || phase === 'reach') {
      // float in the cradle
      core.current.position.set(
        CRADLE_POS[0],
        CRADLE_POS[1] + Math.sin(t * 1.6) * 0.05,
        CRADLE_POS[2],
      )
      core.current.rotation.y += delta * 0.8
    } else if (phase === 'grab' || phase === 'lift') {
      // held by the gripper — chase its tip closely
      core.current.position.lerp(ignition.tip, 1 - Math.exp(-14 * delta))
    } else if (phase === 'slot') {
      // guided down into the socket with the gripper
      core.current.position.lerp(ignition.tip, 1 - Math.exp(-10 * delta))
    } else if (phase === 'release' || phase === 'surge') {
      // seat + sink into the socket
      const target = new THREE.Vector3(SOCKET_POS[0], phase === 'surge' ? 0.34 : SOCKET_POS[1], SOCKET_POS[2])
      core.current.position.lerp(target, 1 - Math.exp(-8 * delta))
      core.current.rotation.y += delta * (phase === 'surge' ? 6 : 1.5)
    }

    // --- glow ---
    const basePulse = 2.1 + Math.sin(t * 2.4) * 0.7
    const hot = phase === 'surge' ? 5.5 : hover && phase === 'idle' ? 3.6 : basePulse
    coreMat.current.emissiveIntensity += (hot - coreMat.current.emissiveIntensity) * (1 - Math.exp(-8 * delta))
    if (coreLight.current)
      coreLight.current.intensity = phase === 'surge' ? 14 : hover ? 8 : 5

    // --- surge effects ---
    if (surgeRing.current && surgeLight.current) {
      if (phase === 'surge') {
        const p = Math.min((t - ignition.phaseStart) / 2.2, 1)
        const s = 0.3 + p * 9
        surgeRing.current.scale.set(s, s, s)
        ;(surgeRing.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - p)
        surgeLight.current.intensity = 40 * Math.sin(Math.min(p * Math.PI, Math.PI))
      } else {
        ;(surgeRing.current.material as THREE.MeshBasicMaterial).opacity = 0
        surgeLight.current.intensity = 0
      }
    }
  })

  return (
    <group>
      {/* cradle pedestal */}
      <group position={CRADLE_GROUND}>
        <mesh castShadow position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.28, 0.36, 0.6, 6]} />
          <meshStandardMaterial color="#2b3342" metalness={0.85} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.27, 6]} />
          <meshStandardMaterial color="#04141c" emissive="#39c6ff" emissiveIntensity={1.8} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* the core */}
      <group ref={core} position={CRADLE_POS}>
        <mesh
          onClick={(e) => {
            e.stopPropagation()
            ignition.start()
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHover(true)
          }}
          onPointerOut={() => setHover(false)}
        >
          <icosahedronGeometry args={[0.16, 0]} />
          <meshStandardMaterial
            ref={coreMat}
            color="#06121f"
            emissive="#39c6ff"
            emissiveIntensity={2.2}
            toneMapped={false}
          />
        </mesh>
        {/* halo for a bigger click target + presence */}
        <mesh>
          <sphereGeometry args={[0.24, 12, 12]} />
          <meshBasicMaterial color="#39c6ff" transparent opacity={0.06} depthWrite={false} />
        </mesh>
        <pointLight ref={coreLight} intensity={5} distance={5} color="#39c6ff" />
      </group>

      {/* dais socket */}
      <group position={[SOCKET_POS[0], 0.305, SOCKET_POS[2]]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.24, 6]} />
          <meshStandardMaterial color="#04141c" emissive="#39c6ff" emissiveIntensity={1.2} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.04, 6]} />
          <meshStandardMaterial color="#0a0f18" metalness={0.6} roughness={0.6} />
        </mesh>
        {/* surge burst */}
        <mesh ref={surgeRing} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.9, 1.0, 64]} />
          <meshBasicMaterial color="#39c6ff" transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight ref={surgeLight} position={[0, 0.6, 0]} intensity={0} distance={12} color="#39c6ff" />
      </group>
    </group>
  )
}
