/**
 * Live joint values of the SO-101, published each frame by the arm and read by
 * the holographic telemetry displays so the environment reacts to the hero.
 */
export const armState = {
  Rotation: 0,
  Pitch: 0,
  Elbow: 0,
  Wrist_Pitch: 0,
  Wrist_Roll: 0,
  Jaw: 0,
  t: 0,
}

// normalized-ish display ranges per joint (for telemetry bars)
export const JOINT_RANGE: Record<string, [number, number]> = {
  Rotation: [-1.9, 1.9],
  Pitch: [-1.7, 1.7],
  Elbow: [-1.7, 1.5],
  Wrist_Pitch: [-1.65, 1.65],
  Wrist_Roll: [-2.8, 2.8],
  Jaw: [-0.17, 1.75],
}
