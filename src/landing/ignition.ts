import * as THREE from 'three'

/**
 * Shared state for the Ignition sequence — the signature interaction:
 * click the energy core → the arm reaches over, grips it, lifts it, and
 * slots it into the dais socket → the room surges.
 *
 * The arm drives `phase` timing and publishes its gripper world position;
 * the core follows it during lift/slot; Scanner/lights react during surge.
 */
export type IgnitionPhase =
  | 'idle'
  | 'reach'
  | 'grab'
  | 'lift'
  | 'slot'
  | 'release'
  | 'surge'

/** Forward offset of the hero cluster (dais/arm/core) toward the camera. */
export const HERO_Z = 3

export const CRADLE_POS: [number, number, number] = [2.6, 1.02, 1.4]
export const SOCKET_POS: [number, number, number] = [0.85, 0.4, 0]

export const ignition = {
  phase: 'idle' as IgnitionPhase,
  phaseStart: 0,
  /** world position of the gripper tip, written by the arm every frame */
  tip: new THREE.Vector3(),
  /** kick off the sequence (no-op if already running) */
  start() {
    if (this.phase === 'idle') this.phase = 'reach'
  },
}

/** Phase durations in seconds (advance handled by the arm's frame loop). */
export const PHASE_LEN: Record<Exclude<IgnitionPhase, 'idle'>, number> = {
  reach: 1.6,
  grab: 0.5,
  lift: 1.4,
  slot: 1.4,
  release: 0.6,
  surge: 2.2,
}
