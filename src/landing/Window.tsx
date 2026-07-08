import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

/**
 * A real window set into the back wall — extruded casing molding, mullions
 * dividing six panes, a sill, and glass — with a genuine opening cut through
 * the wall so the outdoor dawn is visible beyond it.
 */

const WIN = { x: -4.2, y: 3.1, w: 3.2, h: 3.8 } // opening
const WALL = { z: -4.0, thick: 0.6, cy: 3, w: 46, h: 24 }
const FRAME_COL = '#bcb19a' // weathered warm-white painted casing
const WALL_COL = '#0c0a09'

function makeWallGeometry() {
  const s = new THREE.Shape()
  s.moveTo(-WALL.w / 2, -WALL.h / 2)
  s.lineTo(WALL.w / 2, -WALL.h / 2)
  s.lineTo(WALL.w / 2, WALL.h / 2)
  s.lineTo(-WALL.w / 2, WALL.h / 2)
  s.lineTo(-WALL.w / 2, -WALL.h / 2)
  const hx = WIN.x
  const hy = WIN.y - WALL.cy
  const hole = new THREE.Path()
  hole.moveTo(hx - WIN.w / 2, hy - WIN.h / 2)
  hole.lineTo(hx - WIN.w / 2, hy + WIN.h / 2)
  hole.lineTo(hx + WIN.w / 2, hy + WIN.h / 2)
  hole.lineTo(hx + WIN.w / 2, hy - WIN.h / 2)
  hole.lineTo(hx - WIN.w / 2, hy - WIN.h / 2)
  s.holes.push(hole)
  const g = new THREE.ExtrudeGeometry(s, { depth: WALL.thick, bevelEnabled: false })
  g.translate(0, 0, 0)
  return g
}

function makeFrameGeometry() {
  const ow = WIN.w + 0.34
  const oh = WIN.h + 0.34
  const iw = WIN.w - 0.14
  const ih = WIN.h - 0.14
  const s = new THREE.Shape()
  s.moveTo(-ow / 2, -oh / 2)
  s.lineTo(ow / 2, -oh / 2)
  s.lineTo(ow / 2, oh / 2)
  s.lineTo(-ow / 2, oh / 2)
  s.lineTo(-ow / 2, -oh / 2)
  const hole = new THREE.Path()
  hole.moveTo(-iw / 2, -ih / 2)
  hole.lineTo(-iw / 2, ih / 2)
  hole.lineTo(iw / 2, ih / 2)
  hole.lineTo(iw / 2, -ih / 2)
  hole.lineTo(-iw / 2, -ih / 2)
  s.holes.push(hole)
  return new THREE.ExtrudeGeometry(s, {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
  })
}

export default function Window() {
  const wallGeom = useMemo(makeWallGeometry, [])
  const frameGeom = useMemo(makeFrameGeometry, [])
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: FRAME_COL, roughness: 0.72, metalness: 0.04 }),
    [],
  )
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#0f1622',
        roughness: 0.08,
        metalness: 0,
        transparent: true,
        opacity: 0.12,
        envMapIntensity: 1.4,
      }),
    [],
  )

  const barV = 0.07
  const rowY = [WIN.y - WIN.h / 6, WIN.y + WIN.h / 6]

  return (
    <group>
      {/* wall with the window opening cut through it */}
      <mesh geometry={wallGeom} position={[0, WALL.cy, WALL.z]} receiveShadow>
        <meshStandardMaterial color={WALL_COL} roughness={0.95} metalness={0.05} />
      </mesh>

      {/* casing molding around the opening */}
      <mesh geometry={frameGeom} position={[WIN.x, WIN.y, -3.5]} material={frameMat} castShadow receiveShadow />

      {/* mullions: one vertical, two horizontal → six panes */}
      <mesh position={[WIN.x, WIN.y, -3.52]} material={frameMat} castShadow>
        <boxGeometry args={[barV, WIN.h - 0.12, 0.1]} />
      </mesh>
      {rowY.map((y) => (
        <mesh key={y} position={[WIN.x, y, -3.52]} material={frameMat} castShadow>
          <boxGeometry args={[WIN.w - 0.12, barV, 0.1]} />
        </mesh>
      ))}

      {/* sill */}
      <RoundedBox
        args={[WIN.w + 0.5, 0.14, 0.4]}
        radius={0.03}
        smoothness={3}
        position={[WIN.x, WIN.y - WIN.h / 2 - 0.05, -3.36]}
        material={frameMat}
        castShadow
        receiveShadow
      />

      {/* glass */}
      <mesh position={[WIN.x, WIN.y, -3.62]} material={glassMat}>
        <planeGeometry args={[WIN.w - 0.1, WIN.h - 0.1]} />
      </mesh>
    </group>
  )
}
