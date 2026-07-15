import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import URDFLoader from 'urdf-loader'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { armState } from '../../landing/armState'
import { weather } from '../../landing/Outdoors'
import { ignition, PHASE_LEN, CRADLE_POS, SOCKET_POS, type IgnitionPhase } from '../../landing/ignition'

type Joints = Record<string, { setJointValue: (v: number) => void }>
type Pose = [number, number, number, number, number, number]

const JOINT_NAMES = ['Rotation', 'Pitch', 'Elbow', 'Wrist_Pitch', 'Wrist_Roll', 'Jaw'] as const

// ---------------------------------------------------------------------------
// Character poses (verified live via window.__pause + setJointValue). Joint map:
//   Rotation: + turns toward the viewer/right, − toward the window/left
//   Pitch:    0 upper-arm vertical, − leans it forward
//   Elbow:    −1.7 straight, 0 fully folded
//   Wrist_Pitch: − tilts the "head" (gripper) up, + tilts it down
//   Wrist_Roll:  cocks the head sideways (quizzical)
//   Jaw:      gripper open amount
// The arm is treated like a Luxo-lamp creature: gaze + posture carry emotion.
// ---------------------------------------------------------------------------
const REST: Pose = [0.1, -0.6, -0.5, -0.15, 0, 0.14] // settled, head near-level
const VIEWER: Pose = [0.5, -1.12, -0.55, -0.72, 0, 0.3] // perks up, looks at you
const VIEWER_NOD: Pose = [0.5, -1.12, -0.55, -0.5, 0, 0.28] // small acknowledging dip
const WINDOW: Pose = [-0.95, -0.9, -0.7, -1.12, 0, 0.2] // gazes out at the rain
const LOOK_L: Pose = [-0.5, -1.0, -0.62, -0.8, 0.35, 0.18]
const LOOK_R: Pose = [0.95, -1.0, -0.62, -0.75, -0.35, 0.22]
const PONDER: Pose = [0.25, -0.85, -0.5, -0.35, 0.7, 0.12] // head cocked, thinking
const STARTLE: Pose = [-0.05, -0.15, -1.05, -1.4, 0, 1.0] // flinch up + back, jaw open
// upright-safe pose the floor guard blends toward
const SAFE: Pose = [0, 0.2, -1.3, -0.1, 0, 0.7]

type KF = { v: Pose; move: number; hold: number }
type Behavior = { name: string; weight: number; frames: KF[] }

const BEHAVIORS: Behavior[] = [
  { name: 'rest', weight: 2, frames: [{ v: REST, move: 2.2, hold: 3.6 }] },
  // watching the rain is the emotional anchor — lingered on
  {
    name: 'watchRain',
    weight: 3,
    frames: [
      { v: WINDOW, move: 2.8, hold: 4.5 },
      { v: [-0.8, -0.9, -0.7, -1.05, 0.25, 0.2], move: 1.4, hold: 2.6 }, // slow head tilt
    ],
  },
  {
    name: 'lookAtYou',
    weight: 2,
    frames: [
      { v: VIEWER, move: 2.0, hold: 2.4 },
      { v: VIEWER_NOD, move: 0.7, hold: 1.4 },
    ],
  },
  {
    name: 'scan',
    weight: 2,
    frames: [
      { v: LOOK_L, move: 2.2, hold: 1.3 },
      { v: LOOK_R, move: 2.8, hold: 1.3 },
      { v: REST, move: 2.0, hold: 0.8 },
    ],
  },
  { name: 'ponder', weight: 1.5, frames: [{ v: PONDER, move: 1.8, hold: 3.2 }] },
]

// gentle "breathing" overlay so it never looks frozen (per-joint amp + rate)
const BREATHE_AMP: Pose = [0.014, 0.02, 0.014, 0.03, 0.018, 0.01]
const BREATHE_RATE: Pose = [0.7, 0.9, 0.8, 1.15, 0.6, 1]

// ---------------------------------------------------------------------------
// Continuous organic life: every joint drifts on layered incommensurate sines
// (smooth, quasi-non-repeating fBm-ish noise). No keyframes, no holds — the arm
// is always fluidly moving, looking around, breathing. An "energy" envelope ebbs
// and flows so it sometimes wanders more (curious) and sometimes settles (calm),
// but never goes fully static.
// ---------------------------------------------------------------------------
const fbm = (t: number, seed: number) =>
  Math.sin(t * 1.0 + seed) * 0.5 +
  Math.sin(t * 0.47 + seed * 2.3) * 0.28 +
  Math.sin(t * 2.13 + seed * 4.1) * 0.14 +
  Math.sin(t * 0.23 + seed * 5.7) * 0.08 // ~[-1, 1]

// upright Luxo idle: upper arm near-vertical, forearm up, head tilted up to
// gaze skyward — never drooping. Wander is mostly yaw + head, little vertical.
const ORG_REST: Pose = [0.05, -0.05, -1.55, -0.15, 0, 0.28] // stands tall, gazes up
const ORG_AMP: Pose = [0.5, 0.1, 0.12, 0.3, 0.6, 0.2] // wander range per joint
const ORG_SPD: Pose = [0.16, 0.13, 0.11, 0.22, 0.29, 0.19] // wander speed per joint
const ORG_SEED: Pose = [1.1, 3.7, 5.2, 7.9, 2.4, 6.6]

const smootherstep = (x: number) => {
  const t = Math.min(Math.max(x, 0), 1)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
const lerpPose = (a: Pose, b: Pose, k: number): Pose =>
  a.map((v, i) => v + (b[i] - v) * k) as Pose

// ---- Ignition choreography (verified map, unchanged scaffold) ----
const R_CORE = Math.atan2(CRADLE_POS[0], CRADLE_POS[2])
const R_SOCK = Math.atan2(SOCKET_POS[0], SOCKET_POS[2])
const IGN_POSE: Record<Exclude<IgnitionPhase, 'idle'>, Pose> = {
  reach: [R_CORE, -1.25, -1.05, 0.65, 0, 1.6],
  grab: [R_CORE, -1.28, -1.02, 0.68, 0, 0.12],
  lift: [(R_CORE + R_SOCK) / 2, -0.4, -1.55, -0.25, 0, 0.12],
  slot: [R_SOCK, -1.18, -0.98, 0.72, 0, 0.12],
  release: [R_SOCK, -1.18, -0.98, 0.72, 0, 1.3],
  surge: [0.15, 0.3, -1.4, -0.45, 0, 0.9],
}
const IGN_ORDER: Exclude<IgnitionPhase, 'idle'>[] = ['reach', 'grab', 'lift', 'slot', 'release', 'surge']

export default function So101Arm() {
  const [robot, setRobot] = useState<THREE.Object3D | null>(null)
  const joints = useRef<Joints | null>(null)
  const robotRef = useRef<THREE.Object3D | null>(null)
  const tipLinks = useRef<THREE.Object3D[]>([])
  const probe = useRef(new THREE.Vector3())
  const guardS = useRef(1)
  const lastApplied = useRef<Pose>([...SAFE] as Pose)

  // behavior scheduler state
  const seg = useRef<{ from: Pose; to: Pose; move: number; hold: number; start: number } | null>(null)
  const queue = useRef<KF[]>([])
  const lastBehavior = useRef('')
  const prevFlash = useRef(0)
  const startleUntil = useRef(0)
  const startleT = useRef(-99)

  // ignition state
  const lastPhase = useRef<IgnitionPhase>('idle')
  const phaseFrom = useRef<Pose>([...SAFE] as Pose)
  const resumeFrom = useRef<Pose | null>(null)
  const resumeStart = useRef(0)

  useEffect(() => {
    const manager = new THREE.LoadingManager()
    const loader = new URDFLoader(manager)
    ;(loader as unknown as { packages: Record<string, string> }).packages = { so_arm_description: '/so101' }

    const bodyMat = new THREE.MeshStandardMaterial({ color: '#dbe2ee', metalness: 0.5, roughness: 0.5, envMapIntensity: 1.0 })
    const servoMat = new THREE.MeshStandardMaterial({ color: '#262b34', metalness: 0.7, roughness: 0.42, envMapIntensity: 0.9 })

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
      built.traverse((o) => {
        const mesh = o as THREE.Mesh & { material?: THREE.Material & { name?: string } }
        if (mesh.isMesh) {
          const src = String(mesh.userData.src)
          // hide only the wide waveshare mounting plate; keep the real SO-101
          // base + its two little feet stands visible
          if (src.includes('waveshare_mounting_plate')) {
            mesh.visible = false
            return
          }
          mesh.material = mesh.material?.name === 'sts3215' ? servoMat : bodyMat
          mesh.castShadow = true
          mesh.receiveShadow = true
        }
      })
      joints.current = (built as unknown as { joints: Joints }).joints
      const lk = (built as unknown as { links?: Record<string, THREE.Object3D> }).links
      tipLinks.current = ['wrist', 'gripper', 'jaw'].map((n) => lk?.[n]).filter((o): o is THREE.Object3D => !!o)
      robotRef.current = built
      ;(window as unknown as Record<string, unknown>).__robot = built
      setRobot(built)
    }
    return () => {
      alive = false
    }
  }, [])

  // ---- behavior scheduler helpers ----
  const pickBehavior = (): Behavior => {
    const pool = BEHAVIORS.filter((b) => b.name !== lastBehavior.current)
    const total = pool.reduce((s, b) => s + b.weight, 0)
    let r = Math.random() * total
    let chosen = pool[0]
    for (const b of pool) {
      r -= b.weight
      if (r <= 0) {
        chosen = b
        break
      }
    }
    lastBehavior.current = chosen.name
    return chosen
  }

  const nextSeg = (from: Pose, t: number) => {
    if (queue.current.length === 0) queue.current.push(...pickBehavior().frames)
    const kf = queue.current.shift()!
    seg.current = { from, to: kf.v, move: kf.move, hold: kf.hold, start: t }
  }

  useFrame(({ clock }, delta) => {
    const j = joints.current
    if (!j) return
    if ((window as unknown as Record<string, unknown>).__pause) return
    const t = clock.elapsedTime

    // publish gripper tip world position for the ignition core to follow
    if (tipLinks.current[1]) {
      tipLinks.current[1].getWorldPosition(probe.current)
      ignition.tip.copy(probe.current)
    }

    let blended: Pose

    if (ignition.phase !== 'idle') {
      // ---- scripted ignition choreography overrides idle behaviors ----
      const phase = ignition.phase as Exclude<IgnitionPhase, 'idle'>
      if (lastPhase.current !== phase) {
        lastPhase.current = phase
        ignition.phaseStart = t
        phaseFrom.current = [...lastApplied.current] as Pose
      }
      const prog = (t - ignition.phaseStart) / PHASE_LEN[phase]
      const e = smootherstep(prog)
      blended = lerpPose(phaseFrom.current, IGN_POSE[phase], e)
      if (prog >= 1) {
        const next = IGN_ORDER[IGN_ORDER.indexOf(phase) + 1]
        if (next) ignition.phase = next
        else {
          ignition.phase = 'idle'
          lastPhase.current = 'idle'
          resumeFrom.current = [...lastApplied.current] as Pose
          resumeStart.current = t
          seg.current = null
          queue.current = []
        }
      }
    } else {
      // ---- continuous organic life (no keyframes, never static) ----
      // lightning startle: rising edge triggers a smooth flinch layered on top
      const flash = weather.flash
      if (flash > 0.45 && prevFlash.current <= 0.45 && t > startleUntil.current) {
        startleT.current = t
        startleUntil.current = t + 2.4
      }
      prevFlash.current = flash

      // slow "energy" envelope (~0.35..1.0): curious wandering ebbs to calm and
      // back, never fully still
      const act = 0.4 + 0.42 * (0.5 + 0.5 * fbm(t * 0.045, 91))
      blended = JOINT_NAMES.map(
        (_, i) =>
          ORG_REST[i] +
          ORG_AMP[i] * act * fbm(t * ORG_SPD[i], ORG_SEED[i]) +
          BREATHE_AMP[i] * Math.sin(t * BREATHE_RATE[i] + i * 1.7),
      ) as Pose

      // startle flinch: fast attack, eased release, blended over the organic pose
      const st = t - startleT.current
      if (st >= 0 && st < 1.7) {
        const env = st < 0.1 ? st / 0.1 : Math.exp(-(st - 0.1) * 2.4)
        blended = lerpPose(blended, STARTLE, Math.min(1, env))
      }

      // smooth hand-back after an ignition run ends
      if (resumeFrom.current) {
        const rf = smootherstep((t - resumeStart.current) / 1.4)
        blended = lerpPose(resumeFrom.current, blended, rf)
        if (rf >= 1) resumeFrom.current = null
      }
    }

    const apply = (v: Pose) => JOINT_NAMES.forEach((name, i) => j[name]?.setJointValue(v[i]))

    // measured floor guard (exact FK) — bisect toward SAFE on Pitch/Elbow/Wrist.
    // Tracks the bench-top height so the (now smaller) arm never dips its tip
    // through the workbench surface it stands on.
    const CLEARANCE = 0.48
    const minTipY = () => {
      robotRef.current!.updateMatrixWorld(true)
      let m = Infinity
      for (const l of tipLinks.current) {
        l.getWorldPosition(probe.current)
        m = Math.min(m, probe.current.y)
      }
      return m
    }
    const mix = (sc: number): Pose => {
      const out = [...blended] as Pose
      for (const idx of [1, 2, 3]) out[idx] = SAFE[idx] + (blended[idx] - SAFE[idx]) * sc
      return out
    }

    apply(blended)
    let targetS = 1
    if (robotRef.current && tipLinks.current.length && minTipY() < CLEARANCE) {
      let lo = 0
      let hi = 1
      for (let it = 0; it < 5; it++) {
        const mid = (lo + hi) / 2
        apply(mix(mid))
        if (minTipY() < CLEARANCE) hi = mid
        else lo = mid
      }
      targetS = lo
    }
    guardS.current += (targetS - guardS.current) * (1 - Math.exp(-5 * delta))
    const final = mix(Math.min(guardS.current, targetS + 0.02))
    apply(final)

    lastApplied.current = final
    JOINT_NAMES.forEach((name, i) => {
      armState[name] = final[i] as never
    })
    armState.t = t
  })

  if (!robot) return null
  // a proportionate bench robot; base re-seated onto the workbench top
  // (measured live). Poses are joint angles, so unaffected by scale.
  return <primitive object={robot} position={[-0.026, 0.168, -0.153]} rotation={[-Math.PI / 2, 0, 0]} scale={4.8} />
}
