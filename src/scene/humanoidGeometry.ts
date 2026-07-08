import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

/**
 * Builds a stylized humanoid (head, neck, broad shoulders, tapering torso,
 * upper arms) out of primitives, then surface-samples it into a point cloud.
 * No external model needed. Returns the formed positions plus a matching set of
 * "scattered" positions so particles can assemble/dissolve between the two.
 */
function buildHumanoidMesh(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const e = new THREE.Euler()

  const add = (
    geo: THREE.BufferGeometry,
    pos: [number, number, number],
    rot: [number, number, number] = [0, 0, 0],
    scale: [number, number, number] = [1, 1, 1],
  ) => {
    e.set(rot[0], rot[1], rot[2])
    q.setFromEuler(e)
    m.compose(
      new THREE.Vector3(pos[0], pos[1], pos[2]),
      q,
      new THREE.Vector3(scale[0], scale[1], scale[2]),
    )
    geo.applyMatrix4(m)
    parts.push(geo)
  }

  // Head + visor
  add(new THREE.SphereGeometry(0.52, 28, 28), [0, 3.2, 0], [0, 0, 0], [1, 1.12, 0.96])
  add(new THREE.BoxGeometry(0.62, 0.26, 0.18), [0, 3.22, 0.38])
  // Neck
  add(new THREE.CylinderGeometry(0.17, 0.2, 0.32, 18), [0, 2.78, 0])
  // Shoulders
  add(new THREE.SphereGeometry(0.34, 20, 20), [-0.82, 2.5, 0])
  add(new THREE.SphereGeometry(0.34, 20, 20), [0.82, 2.5, 0])
  // Torso (broad chest tapering to waist)
  add(new THREE.CylinderGeometry(0.66, 0.42, 1.6, 26), [0, 1.78, 0], [0, 0, 0], [1, 1, 0.62])
  // Chest plate detail
  add(new THREE.BoxGeometry(1.0, 0.7, 0.5), [0, 2.25, 0.06], [0.12, 0, 0])
  // Upper arms
  add(new THREE.CylinderGeometry(0.17, 0.14, 1.15, 16), [-0.95, 1.85, 0], [0, 0, 0.16])
  add(new THREE.CylinderGeometry(0.17, 0.14, 1.15, 16), [0.95, 1.85, 0], [0, 0, -0.16])
  // Forearms (hint)
  add(new THREE.CylinderGeometry(0.13, 0.12, 0.95, 14), [-1.18, 0.95, 0.05], [0, 0, 0.1])
  add(new THREE.CylinderGeometry(0.13, 0.12, 0.95, 14), [1.18, 0.95, 0.05], [0, 0, -0.1])

  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  return merged
}

export type HumanoidData = {
  positions: Float32Array
  scatter: Float32Array
  seeds: Float32Array
  scales: Float32Array
  count: number
  height: number
}

export function buildHumanoid(count: number): HumanoidData {
  const mesh = new THREE.Mesh(buildHumanoidMesh())
  const sampler = new MeshSurfaceSampler(mesh).build()

  const positions = new Float32Array(count * 3)
  const scatter = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const scales = new Float32Array(count)
  const p = new THREE.Vector3()
  const CENTER_Y = 1.85 // recentre the figure on the origin for clean rotation

  for (let i = 0; i < count; i++) {
    sampler.sample(p)
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y - CENTER_Y
    positions[i * 3 + 2] = p.z

    // scattered home: a wide, flattened dust cloud the figure dissolves into
    const r = 4 + Math.random() * 6
    const a = Math.random() * Math.PI * 2
    scatter[i * 3] = Math.cos(a) * r
    scatter[i * 3 + 1] = (Math.random() - 0.5) * 7
    scatter[i * 3 + 2] = Math.sin(a) * r - 2

    seeds[i] = Math.random() * 100
    scales[i] = 0.35 + Math.random() * 0.65
  }

  mesh.geometry.dispose()
  return { positions, scatter, seeds, scales, count, height: 3.7 }
}
