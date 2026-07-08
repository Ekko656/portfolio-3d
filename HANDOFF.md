# Portfolio Rebuild — Handoff / Context Document

Generated to resume this project in a fresh chat with zero context loss. Read this whole file before doing anything.

---

## 0. TL;DR — what to do next

The user's last instruction (not yet started):

1. **Delete `src/landing/lab/HoloTable.tsx`** and remove its usage from `MegaLab.tsx` — the violet hologram projector is unwanted ("random bullshit", doesn't fit).
2. **Stop adding scattered "gimmick" props.** Redesign the room as a **small, dense, purposeful workshop** (Bruno Simon philosophy: everything present belongs and reads as one composed scene, not a big empty hall with objects sprinkled around). Concretely this likely means **shrinking the room** (currently 32×32-ish, `EDGE=16`) so it reads tight and dense, and organizing existing kit pieces (console, racks, crates, cables, vents) into believable **work zones** (a control station, a parts/storage corner, a maintenance nook, the drone dock) clustered close around the hero, not scattered at the walls.
3. **Lock the camera to one fixed position — remove `OrbitControls` drag/zoom and `IdleDrift`.** Zoom in slightly from the current framing.
4. Only **after** the static scene is genuinely dense/cohesive/"finished" should work resume on: the power-on boot sequence, the ignition/pickup arm choreography, sound, and the ENTER handoff into the editorial content site.

The user is frustrated that repeated passes added isolated "cool-looking" elements (holo table, guard rails, random floating props) without an overall compositional plan. The fix is to **stop and design the room as a whole composition first**, then place kit pieces to serve that composition — not the reverse.

---

## 1. Who this is for / project goal

- **Owner:** Ekam Kooner — UBC Biomedical Engineering (Robotics) student, aiming at humanoid robotics as a career (cites Tesla Optimus specifically). Calgary → Vancouver.
- **Goal:** Rebuild personal portfolio site (`ekamkooner.com`, repo `github.com/Ekko656/portfolio`) from a simple lavender React SPA into something **unexpected and impressive** — explicitly benchmarked against **brunosimon.com** (Bruno Simon's interactive 3D portfolio) and other award-winning WebGL sites (Lusion, Active Theory).
- **Explicit non-goal:** a normal scrolling webpage with a 3D decoration bolted on. The user rejected that direction multiple times mid-session.
- **Current direction (locked in, do not re-litigate):** A **wordless, 3D interactive landing scene** — a robotics workshop/bay containing the arm — is the entire "hero" experience. It should feel like a real place (Bruno Simon energy), not a webpage with WebGL sprinkled on top. After this landing, there is a separate, clean, editorial multi-section site (About / Projects / Résumé / Contact) that the visitor reaches via a single diegetic "ENTER" interaction (see §6).

---

## 2. Hard-won decisions — DO NOT relitigate these

These were each arrived at after real back-and-forth. Re-proposing alternatives wastes the user's time and will frustrate them.

1. **No cursor-controlled arm.** Tried it, user correctly identified it as bad UX for a 6-DOF arm ("you can't do cursor following, even WASD isn't enough"). **All arm motion is prebaked/choreographed.** The room reacts to clicks on objects, not free camera/arm control.
2. **No humanoid point-cloud figure.** A full detour was built (particle-sampled humanoid from primitives, `src/scene/ParticleHumanoid.tsx` + `humanoidGeometry.ts`) and explicitly rejected: *"i have no trust in u creating a complicated humanoid robot that isn't just 5 polygons smushed together."* This code still exists in the repo but is **dead/unused** — safe to delete.
3. **The arm must be the REAL open-source SO-ARM101 model, not hand-built primitives.** Hand-built primitive arms were tried twice and rejected as "low polygon... like a kid made it." The real model was sourced and rigged (see §4) and is a hard requirement going forward. **Never regress to primitive geometry for the arm.**
4. **Matcap-only materials were tried and superseded.** Early "premium" pass used matcap shading (fake baked lighting, Bruno-style trick) — this was a real improvement over flat materials but was later superseded by full PBR (`meshStandardMaterial` + `Environment`/`Lightformer` + real shadows) for a "4K movie / Iron Man lab" look, which the user explicitly wanted over "Blender default". Current arm materials are PBR, not matcap. `src/landing/matcaps.ts` still exists but is largely unused now — check before deleting.
5. **No physics props / no cursor-pushable objects.** `@react-three/rapier` was installed and a `PhysicsProps.tsx` component built (kinematic pusher ball + rigid-body crates), then explicitly deemed "gimmicky" and deleted. **Do not reintroduce physics-based interaction.** (The `@react-three/rapier` dependency may still be in `package.json` — it is unused; fine to remove or leave.)
6. **No literal humanoid-service narrative required in the 3D scene.** Early framing tried to tie every visual to "robotics that serves people" (the arm's whole personal-mission narrative). User said this doesn't need to be literal in the 3D art direction: *"it doesn't have to be acts of service, just focus on robotics for elements and design purpose."* The personal mission/narrative belongs in the **written content** (About page copy — see §7), not forced into 3D symbolism.
7. **The gripper must be a real parallel-jaw gripper**, not two rotating boxes with a floating ball. This was fixed (see §4) — real parallel-jaw fingers that translate together (not fan outward), inward-curling fingertip pads, modeled after Robotiq 2F-85.
8. **Camera should NOT be a full cinematic scroll-journey with multiple stations.** An earlier phase built a `CameraRig` + `stations.ts` system (scroll-driven camera flying between 4 keyframed stations with a particle diffuser). This was **abandoned** when the whole "arm as scrolling hero + editorial page below it" concept was scrapped in favor of the wordless 3D-first landing. That code path (`ScrollControls`, `stations.ts`, `CameraRig.tsx`, old `ParticleDiffuser.tsx`) has since been deleted from the repo already — do not resurrect it.
9. **Current instruction (this message): lock the camera to ONE fixed position, no orbit/drag.** This reverses an earlier decision to allow `OrbitControls` (drag-to-orbit) + `IdleDrift` (autonomous slow camera breathing when idle). Both must be removed/disabled per the latest instruction. If the user later asks for limited interactivity again, prefer a **very tightly constrained** orbit (small min/max azimuth/polar) over a wide-open drag, but for now: **fully static camera.**
10. **Real geometry/kinematics must be verified empirically, not guessed.** Multiple rounds of arm-pose bugs (arm "drooping," "dead," clipping the floor, wrong bend direction) were caused by guessing joint sign conventions. The fix each time was to **pause the idle animation via a debug hook (`window.__pause`), set individual joint values via `window.__robot.joints[name].setJointValue(v)`, screenshot, and read off the real min/max/direction** before writing pose keyframes. **Always verify robot kinematics this way before tuning poses again** — do not guess and iterate blindly, it wastes many cycles and visibly angers the user.

---

## 3. User feedback patterns — how to work with this user

- **Extremely low tolerance for "AI slop" aesthetics.** Called out generic thin fonts, checkerboard floors, "// status:", "> role", "NN / NN" slash-separator UI motifs, terminal/hacker clichés, matcap-flat "unrendered clay" look, and low-poly primitive geometry ("looks like a kid made it") — all as things to avoid. Wants **real, detailed, cohesive, artistic** work, explicitly benchmarked against Bruno Simon, Lusion, Active Theory, and top hackathon/engineering portfolios.
- **Verify in the live preview before claiming something is fixed.** The user has caught multiple instances of claims not matching the rendered reality (arm still clipping after "fixing" it, box still present after "removing" it, camera not actually reframed). **Always take a fresh screenshot after every change and visually confirm the specific thing asked for is actually different** — do not rely on code inspection alone, and do not reload with stale HMR state (do a hard reload and wait for full asset load, this scene has 190+ GLTF pieces + a 16MB STL robot and can take 10-20s to settle).
- **Explicit, repeated correction on robot arm range of motion.** Said many times, with increasing frustration, that poses were too subtle ("moving all elements a few degrees"), the arm looked "dead"/"hungover"/"drooping downward permanently", the two segments always formed the same collapsed angle, and demanded a **true obtuse V-shape** — one segment near-horizontal, the other near-vertical, using near-full range of motion. This was eventually fixed via live joint probing (see §2.10 and §4).
- **Gets frustrated when the same category of mistake repeats** (e.g., "why is it still clipping", "you didn't get rid of the box", "you keep replaying this droopy motion"). When resuming work, **check that previously-reported bugs are actually still fixed** before doing new work, since regressions crept in during scene rewrites (the "box on the platform" reappeared more than once across different causes — mounting plate mesh, then a deliberately-added socket housing mesh the assistant added and had to remove again).
- **Wants to be asked focused, specific questions before big creative pivots** — but NOT vague ones. When the direction was genuinely unclear (humanoid vs. arm vs. abstract; interaction model; ROM boot sequence details) the user responded well to concrete multiple-choice questions (via AskUserQuestion tool) about: the interaction model, arm's "job"/performance, intro sequence style, palette, and living-system details. When questions were too open-ended ("what should the arm do?") the user pushed back with "i don't know man, think of something creative." **Prefer offering 3-4 concrete, opinionated options over open questions**, and be ready to just make the call and show a result when the user says "you decide."
- **Wants frequent commits/pushes.** Explicit instruction: *"push after major changes like this regularly."* Commit + push to `origin/scene-rebuild` after each meaningfully-complete change, with clear multi-paragraph commit messages (the existing commit history is a good style template — see `git log` on this branch).
- Model was switched mid-session from `claude-fable-5` to `claude-sonnet-5` via `/model claude-sonnet-5` (see the local-command message near the end of the transcript). Whatever model picks this up should behave consistently with the standards above.

---

## 4. Current technical state (as of commit `4f264f3` on branch `scene-rebuild`)

### Repo / branches
- Working directory: `~/portfolio`
- Repo: `github.com/Ekko656/portfolio` (origin)
- **Current branch: `scene-rebuild`**, pushed and in sync with `origin/scene-rebuild` as of commit `4f264f3`.
- Other branches that exist from earlier phases (do NOT merge into these, they're obsolete/reference-only): `robotics-rebuild` (dark-slate editorial site, abandoned), `main` (original lavender site, untouched, safe fallback).
- Working tree is clean (no uncommitted changes) as of last check.

### Stack
- Vite + React 18 + TypeScript + Tailwind CSS
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (Bloom + Vignette)
- **Robot loading:** `urdf-loader` + Three's `STLLoader` (for the real SO-101 model)
- **Unused-but-installed (candidates for removal):** `@react-three/rapier` (physics, removed from use), `gsap`/`@gsap/react`/`lenis` (were used in the earlier editorial-scroll-site phase, currently unused by the live 3D scene), `maath`
- Fonts: Space Grotesk (display) + Saira (secondary/body) via `@fontsource`

### What actually renders today (`src/App.tsx` → `src/landing/LandingScene.tsx`)

`App.tsx` is minimal:
```tsx
import LandingScene from './landing/LandingScene'
export default function App() {
  return (
    <div className="fixed inset-0 bg-base">
      <LandingScene />
    </div>
  )
}
```

`LandingScene.tsx` sets up:
- A single `<Canvas>` with `shadows`, `dpr={[1,2]}`, `ACESFilmicToneMapping`, camera at roughly `[0, 4.0, 17]` fov 44, looking at target `[0, 1.7, HERO_Z]` (HERO_Z = 3, see below).
- Background color `#0b0f17`, fog `[0b0f17, 16, 46]`.
- `<Lighting>`: ambient + a shadow-casting directional key light, a cool blue rim spotlight, a warm point-light kicker, and an `<Environment>` with 3 `<Lightformer>` rects for PBR reflections (this Environment block was briefly suspected of causing a Suspense hang during debugging — it was NOT the actual cause, see §5 bug log — so it's back in and confirmed fine).
- `<World>`: renders `<MegaLab />` (the whole environment, see below), a `<Dais />` (small local component — tiered pedestal with emissive rings), the `<So101Arm />` (the robot, see below), all wrapped so the "hero cluster" (dais + arm + scanner + ignition core) is offset **forward** on Z by `HERO_Z = 3` (a constant exported from `src/landing/ignition.ts`) so the room reads behind the arm instead of the arm floating in the middle of a huge space.
- `<Motes count={450} />`: ambient drifting particle dust (`src/landing/Motes.tsx`), kept, not a "gimmick" complaint target.
- `<OrbitControls>`: **currently present** with damping, `minDistance=7 maxDistance=16`, constrained azimuth/polar — **this needs to be REMOVED or fully locked down per the latest instruction** (§0.3).
- `<IdleDrift>`: a component in `LandingScene.tsx` that, after 5s of no input, slowly drifts the camera azimuth/polar using `controls.setAzimuthalAngle`/`setPolarAngle` — **this also needs to be REMOVED per the latest instruction**, since a fixed camera has no orbit to drift.

### The robot arm — `src/components/arm/So101Arm.tsx`

This is the **real SO-ARM101** open-source robot arm, NOT hand-built primitives.

- **Source:** URDF + STL meshes fetched from GitHub repo `MuammerBay/SO-ARM_ROS2_URDF` (a ROS2-format URDF for TheRobotStudio's open-source SO-ARM101). Files were downloaded and placed at:
  - `public/so101/so101.urdf`
  - `public/so101/meshes/*.stl` (13 STL files: base_motor_holder, base_so101_v2, sts3215_03a (×2 variants), waveshare_mounting_plate, motor_holder_so101_base, rotation_pitch, upper_arm, under_arm, motor_holder_so101_wrist, wrist_roll_pitch, wrist_roll_follower, moving_jaw)
- **Loading mechanism:** `URDFLoader` from the `urdf-loader` npm package, with `loader.packages = { so_arm_description: '/so101' }` to map URDF `package://` paths, and a custom `loadMeshCb` that swaps in Three's `STLLoader` (URDF loader doesn't support STL natively out of the box in this setup). Meshes are tagged with `mesh.userData.src = path` during load so they can be identified later (e.g. to hide specific meshes or apply different materials).
- **Loading is two-phase:** `loader.load(...)` kicks off the URDF parse and enqueues STL loads on a `THREE.LoadingManager`; the actual mount/materials/joint-wiring happens in `manager.onLoad` once every mesh has finished (NOT in the URDF callback directly), because the URDF callback fires before child STL meshes are ready.
- **Materials:** Two `MeshStandardMaterial`s applied post-load based on `userData.src`: light brushed steel (`#dbe2ee`, metalness 0.5, roughness 0.5) for the printed-plastic body parts, dark charcoal (`#262b34`, metalness 0.7, roughness 0.42) for the `sts3215` servo motor meshes (identified by material name `'sts3215'` in the original URDF materials, re-skinned to override the URDF's baked gold/black color — the raw URDF encodes `3d_printed` material as gold RGBA `1.0, 0.82, 0.12` and `sts3215` as near-black, both of which read wrong against the scene and were overridden).
- **Hidden meshes:** the boxy electronics enclosure is fully hidden (`mesh.visible = false`) by matching `userData.src` against `'waveshare_mounting_plate'`, `'base_motor_holder'`, and `'base_so101_v2'` substrings — this was iteratively discovered to be the source of an ugly "black box on the platform" that the user repeatedly flagged. **If a box/case reappears on the dais, check this exclusion list first** — it's likely a new build ID or a base link mesh not covered by the substring match.
- **Centering:** the model's root local origin does not correspond to its visual center. Current fix is a **hardcoded position offset** on the `<primitive>`: `position={[-0.044, 0, -0.255]}`, arrived at by measuring the visible base mesh's world-space bounding box live in the browser console (see debug technique below) and adjusting until centered on the dais. This is fragile — if the model or its transform hierarchy changes, this offset will need to be re-measured.
- **Scale/orientation:** `rotation={[-Math.PI/2, 0, 0]}` (URDF is Z-up, scene is Y-up), `scale={8}`.
- **Joints (verified empirically — this is the ground truth, do not re-derive from assumptions):**
  - Joint names (from the URDF, exactly as named): `Rotation`, `Pitch`, `Elbow`, `Wrist_Pitch`, `Wrist_Roll`, `Jaw`
  - All are revolute, axis `[0,0,1]` in their local frames, values set via `joints.current[name].setJointValue(v)` (radians)
  - **Elbow: `-1.7` = fully straight/extended, `0` = fully folded.** (i.e. negative extends, this is the single most important thing to remember — an earlier several-hour debugging saga was caused by assuming `0` was straight)
  - **Pitch: `0` = upper arm vertical; NEGATIVE leans the upper arm forward; positive leans it back.**
  - An obtuse "V" pose (the shape the user repeatedly demanded) requires **Elbow ≤ about -0.7 to -1.0** combined with Pitch near its negative range — e.g. verified good pose: `Rotation=1.2, Pitch=-1.65, Elbow=-0.95, Wrist_Pitch=-0.2, Wrist_Roll=0.4, Jaw=0.9` gives a crisp right-profile V shape (confirmed via screenshot).
  - Full-vertical-stretch verified pose: `[0, -0.1, -1.65, 0.1, 0, 0.4]`
  - **Debug technique used to verify all this (reuse this pattern for any future kinematics work):**
    1. Expose the loaded robot on `window.__robot` (already present in code: `(window as unknown as Record<string, unknown>).__robot = built` inside the `onLoad` handler — check it's still there)
    2. Set `window.__pause = true` to freeze the per-frame pose-sequencer animation (there's a check near the top of the `useFrame` callback: `if ((window as ...).__pause) return`)
    3. In the browser console via `preview_eval`, call `window.__robot.joints['Elbow'].setJointValue(X)` for arbitrary X, wait ~500ms, screenshot, repeat across the parameter range
    4. Once satisfied, write findings into the `POSES` array as verified comments, then set `window.__pause = false`
- **Pose-sequencer (idle animation):** an array `POSES: { v: Pose; move: number; hold: number }[]` of 6 keyframe poses (each a 6-tuple matching JOINT_NAMES order), the arm eases between consecutive poses using a `smootherstep` easing function (quintic smoothstep) over `move` seconds, holds for `hold` seconds, with a tiny per-joint sinusoidal "breathing" dither layered on top so holds never look frozen. A separate `SAFE: Pose` constant defines an upright/safe fallback pose.
- **Floor-safety guard:** every frame, after computing the blended target pose, the code:
  1. Applies the pose
  2. Measures the **real world-space Y position** of the wrist/gripper/jaw links (via `tipLinks.current` — an array of `THREE.Object3D` refs captured from the loaded URDF's `.links` map for `['wrist', 'gripper', 'jaw']`)
  3. If the minimum Y among those is below `CLEARANCE = 0.8`, **bisects** (5 iterations) between the raw pose and the `SAFE` pose on the Pitch/Elbow/Wrist_Pitch axes only, to find the largest blend factor that still clears the floor
  4. **Eases** toward that safe blend factor over time (exponential smoothing, not an instant snap) so the arm "glides along the clearance boundary" instead of jittering/pushing against an invisible wall — this was an explicit user complaint ("it does so make it jittery like its pushing into a barrier") that was fixed by this easing.
  - This measured-FK approach (rather than analytic joint-limit math) is deliberate and was reached after analytic approaches kept producing wrong results — **do not replace this with an analytic approximation**, it's more robust precisely because it reads the real transform hierarchy.
- **Ignition choreography scaffold (built, not yet polished):** `src/landing/ignition.ts` defines a shared mutable state object `ignition = { phase, phaseStart, tip: Vector3, start() }` with phases `'idle' | 'reach' | 'grab' | 'lift' | 'slot' | 'release' | 'surge'`, plus `CRADLE_POS`, `SOCKET_POS`, `HERO_Z`, `PHASE_LEN` (durations per phase). `So101Arm.tsx` has an `IGN_POSE` record mapping each phase to a hardcoded pose, and the `useFrame` loop branches: if `ignition.phase !== 'idle'`, it eases between phase-transition poses instead of running the normal pose-sequencer; on completing the last phase it hands control back to the idle sequencer with a smooth resume-blend. `IgnitionCore.tsx` (in `src/landing/lab/`) renders the clickable pulsing energy-core mesh in its cradle plus the socket receptacle on the dais, moves the core to follow the gripper's live tip position during grab/lift/slot, and triggers a "surge" visual (expanding ring + point light flash) on the final phase. **The user has said the exact arm routine will be redone/directed later** ("we'll be adding an actual arm routine later" / aiming was described as needing polish) — so this scaffold is a reasonable starting point but the specific `IGN_POSE` values and cradle/socket placement are **not final** and should be revisited once the room composition is locked.
- **Test/debug hooks currently in code (useful, keep):** `window.__robot` (the loaded URDF object3D), `window.__pause` (freezes idle animation), `window.__ignite()` (defined in `IgnitionCore.tsx`, calls `ignition.start()`), `window.__ignition` (the raw ignition state object, for inspection).

### The old primitive arm — `src/components/arm/RobotArm.tsx`

This is **leftover/dead code** from before the SO-101 model was sourced — a hand-built primitive arm with 2-link IK, matcap materials, cursor-tracking (later removed), and a manually-built parallel gripper. **Not imported by anything live.** Safe to delete once confirmed unused, or keep as reference for the parallel-gripper geometry approach if ever needed again (though the real SO-101 already has its own real gripper geometry, so this is low-value to keep).

### The environment — `src/landing/lab/MegaLab.tsx` (THE FILE TO REDESIGN)

This is the main room-composition file and is exactly what the user wants reworked. Current structure (as of `4f264f3`):

- **Asset source:** "Quaternius Modular Sci-Fi MegaKit" — a free CC0 sci-fi environment kit (270+ models: walls, floors, columns, doors, props). The user manually downloaded it (`Modular SciFi MegaKit[Standard]`) from itch.io/Quaternius and provided the local path; it was copied+flattened into `public/models/scifi/` as **190 `.gltf` + `.bin` pairs plus 21 shared PBR textures** (BaseColor/Normal/ORM/Emissive trim-sheet textures), all in one flat directory (not the original nested category folders) so each `.gltf`'s relative texture references resolve correctly. Total ~33MB.
  - **This kit is licensed CC0 and is the correct/approved asset source per explicit user research request.** Do not swap to a different kit without cause.
  - Available categories (see `find public/models/scifi -iname '*.gltf'` for the full list): Aliens (3), Columns (8), Decals (29), Doors (7), Platforms/floors (~31 base + variants), Props (28 — barrels, crates, cables, computer terminal, vents, rails, item holder, chest, access point, fans, pipe holders, light fixtures), ShortWalls (30), TopAstra/TopCables/TopPlastic/TopSimple/TopWindow (ceiling tile variants, ~19), WallAstra/WallBand/WallWindow (23).
  - **Measured real dimensions** (critical for tiling correctly — get this wrong and walls show gaps or overlap): `Platform_*` floor tiles are 4×4 units. `WallAstra_Straight` is 4 units long **along its local Z axis** (not X — this caused visible wall gaps until corrected), ~3.03 units tall per storey, so 2 stacked = 6.06, 3 stacked = 9.09, etc. `Column_Large_Straight` is 10 units tall. `Door_Frame_Square` is ~4.85 wide × 5.01 tall.
- **`src/landing/lab/Model.tsx`:** a thin wrapper component `<Model name="..." position=... rotation=... scale=... />` that lazy-loads a given GLTF via `useGLTF(BASE + name + '.gltf')`, clones the scene graph (so the same GLTF can be placed many times), enables `castShadow`/`receiveShadow` on all meshes. **Important recent fix:** each `<Model>` now wraps its inner loader in its **own** `<Suspense fallback={null}>` boundary — this was added because a shared/outer Suspense boundary was suspected of hanging the whole scene if any one of ~190 assets was slow (see bug log §5; this turned out not to be the actual cause of the blank-screen issue, but per-model Suspense isolation is still good practice and was kept). Also exports `preloadKit(names: string[])` which calls `useGLTF.preload` for a list of names up front.
- **Current room layout (`MegaLab.tsx`), to be redesigned per the new instruction:**
  - `TILE = 4`, `EDGE = 16` (so the room floor spans from -16 to +16 — **this is a huge ~32×32 unit room and is almost certainly too large/empty per the "dense workshop not empty hall" instruction; strongly consider shrinking this**, e.g. to `EDGE = 10` or so, and rebuilding wall-tiling math accordingly since wall counts are derived from `EDGE`/`TILE`)
  - Floor: 9×9 grid of `Platform_DarkPlates` tiles
  - Ceiling: a grid of `TopCables_Straight` tiles at y=12.15 plus a flat dark backdrop plane above that
  - Walls: **4 storeys** of `WallAstra_Straight` (y = 0, 3.03, 6.06, 9.09) around back/left/right, plus a flush trim beam closing the gap to the ceiling, plus a solid dark "front closure" box mesh (not kit geometry) placed beyond the camera's (soon-to-be-irrelevant, since camera will be fixed) max orbit distance so there's never a view into empty void behind the camera
  - Structural `Column_Large_Straight` pieces at wall corners/midpoints
  - A `Door_Frame_Square` + `Door_Metal` centered in the back wall, with a custom-built pulsing `Beacon` component (small emissive dome + point light) mounted above it
  - Two `Prop_Computer` consoles flanking the door, plus one per side wall, each paired with a custom `BlinkPips` component (3 small emissive boxes that flicker on independent sine-based timers) — these read as functional "life"
  - Vents (`Prop_Vent_Big`) on the second storey of three walls
  - Two/three loose clusters of `Prop_Crate3/4`, `Prop_Barrel_Large`, `Prop_Chest`, `Prop_ItemHolder` scattered near room edges — **these are exactly the kind of "randomly placed" clutter the user is now objecting to; the redesign should replace ad hoc scatter with deliberate zone composition**
  - Floor `Decal_*` markings: rounded corner-ring decals around the hero work-zone, dashed lane lines, a `Decal_Logo`, a `Decal_Sign` — kept inside a `<group position={[0,0,HERO_Z]}>` so they track the hero's forward offset
  - Cable props (`Prop_Cable_1/3`) and more vents scattered along wall bases
  - `<HoloTelemetry>` × 2 (see below) positioned flanking the arm, plus a third one near the drone dock
  - `<HangLight>` × 3 (custom component: a thin pole + `Prop_Light_Wide` fixture + a real `pointLight` for the light pool)
  - `<Drone />` (see below)
  - `<Scanner />` and `<IgnitionCore />` grouped under the hero's forward Z-offset
  - **`<HoloTable position={[-8, 0, -7]} />` — TO BE DELETED**, along with its import
  - `<DataStreams />` — wall-seam light pulses (kept for now per "wall data-streams" being one of the approved "living systems" in an earlier question round, but re-evaluate whether it reads as a gimmick or genuinely supports the scene once the room is redesigned)

### Custom "life" components in `src/landing/lab/`

- **`HoloTelemetry.tsx`:** a floating canvas-texture panel that draws (via 2D canvas API, redrawn to a `CanvasTexture` at ~30fps) a fake technical readout — title bar with blinking status dot, live bar-graphs for each of the 6 joint values (reading from a shared `armState` object, see below — so this panel is **genuinely live-driven by the real robot**, not just decorative), a scrolling waveform of the Rotation joint's history, and a scanline sweep effect. Takes an `accent` color prop (hex string) and derives light/dark/rgb variants from it via `THREE.Color` math for recoloring the canvas draw calls — used to give one panel a violet ("BAY-07 · SYSTEMS") vs. cyan accent, establishing a **violet accent as a secondary signature color** per an earlier approved decision. **This component is good and should stay** — it's functional, tied to the real robot state, and not "gimmicky" in the way the hologram was; the user's objection was specifically to the HoloTable projector, not this telemetry panel (though double check it still reads as purposeful once the room is redesigned — it was flagged early on for being partially cut off / poorly framed, and was since repositioned closer to the arm).
- **`src/landing/armState.ts`:** a small shared mutable object (`armState = { Rotation, Pitch, Elbow, Wrist_Pitch, Wrist_Roll, Jaw, t }`) that `So101Arm.tsx` writes to every frame with its actual current joint values (after the floor-safety guard is applied), and that `HoloTelemetry.tsx` (and the now-deleted `HoloTable.tsx`) read from. Also exports `JOINT_RANGE` (a per-joint `[min,max]` display range record) used to normalize bar-graph fills. **Keep this — it's the mechanism for any future "the room reacts to the real robot" effects**, just not via a giant hologram.
- **`Drone.tsx`:** a fully custom-modeled quadcopter (motor pods, spinning-blur rotor blades via a `torusGeometry` guard ring + thin blurred blade meshes, aviation nav lights — red left / green right / white strobe tail, downward camera gimbal with a lens). Originally just cursor-independent figure-8 patrol; was substantially upgraded per user request ("make the drone look like a real drone... properly flight, not a cylinder with wings moving vertically") to: bank into turns and pitch nose-down into travel direction using the analytic derivative of its patrol path, AND (per the "drone dock + routine" approved living-system) cycle through a state machine `'patrol' | 'approach' | 'land' | 'charge' | 'takeoff' | 'resume'` with a real lit dock pad (`PAD` position constant), landing/takeoff eased transitions, rotor spin-down while charging, and nav-light behavior changes (solid green glow while charging vs. strobing white in flight). Patrol altitude was raised per feedback ("make the drone fly higher") — check current `py` base height in the patrol branch is still reasonable once the room shrinks. **This is a good component, keep and adapt its dock-pad position/height to fit the redesigned room.**
- **`Scanner.tsx`:** small animated dais effects — two counter-rotating partial-ring meshes (scanner sweep arcs) plus a breathing-intensity emissive containment ring, all sped up dramatically during `ignition.phase === 'surge'`. Simple, cheap, reads fine, keep.
- **`IgnitionCore.tsx`:** the clickable pulsing "energy core" object + its cradle + the dais socket receptacle + the surge visual effect (expanding additive ring + flash point light). Exposes `window.__ignite()` and hover-cursor styling. Ties into the arm's `ignition.phase` state machine. **Keep the mechanism, but the cradle/socket world-positions and the core's visual design should be reviewed once the room layout changes** (their current positions were tuned against the old, much larger room).
- **`DataStreams.tsx`:** procedurally generates small emissive box meshes that lerp along fixed `LANES` (hardcoded from/to positions along wall seams at various heights) to simulate data pulses traveling the room's "nervous system." Uses `EDGE = 16` hardcoded internally — **if the room shrinks, this file's `LANES` array must be updated to match new wall positions**, or it will draw pulses traveling through the wrong (now-outside) space.
- **`Motes.tsx`** (in `src/landing/`, not `lab/`): ambient drifting dust particles, a `THREE.Points` cloud with sinusoidal drift. Not a target of the "gimmick" complaint, keep as-is.

### Dead/unused files safe to delete (confirm before deleting, but strong candidates)

- `src/scene/ParticleHumanoid.tsx`, `src/scene/humanoidGeometry.ts`, `src/scene/HeroScene.tsx` — the abandoned humanoid point-cloud experiment. Not imported by `App.tsx` or anything live.
- `src/components/arm/RobotArm.tsx` — the old primitive arm, superseded by `So101Arm.tsx`.
- `src/landing/matcaps.ts` — the matcap-texture generator, superseded by full PBR materials (check no live import remains before deleting).
- `src/components/{Ambient,Marquee,ProjectCard,Reveal,SectionHeader,SignalField,SmoothScroll,TypeRoles}.tsx`, `src/sections/*`, `src/data/projects.ts`, `src/lib/motion.ts` — all leftovers from the earlier "clean editorial dark-slate scrolling site" phase (before the full pivot to a 3D-only landing). Not imported by the current `App.tsx`. These may become relevant again once the **post-landing editorial content site** is built (§6), but as currently written they reflect an earlier design direction (dark navy-slate theme, Saira/Space Grotesk, GSAP magnetic buttons, project card tilt effects) that predates several since-revised decisions — **treat as reference/scaffolding to possibly reuse, not as current source of truth for the content site's design.**
- **`src/landing/lab/HoloTable.tsx`** — explicitly instructed to delete this session (§0.1).

### Package dependencies possibly prunable (low priority)
`@react-three/rapier` (physics, unused), `gsap`, `@gsap/react`, `lenis` (scroll libs, unused by current 3D-only scene), `maath` (check usage). Not urgent, but if doing a cleanup pass these are candidates.

---

## 5. Bug log / gotchas already solved (avoid repeating this debugging time)

1. **Wall gaps from wrong axis assumption.** `WallAstra_Straight`'s 4-unit span is along local **Z**, not X. Any new wall-tiling code must re-verify this per-model (use the accessor-bounds Python script approach below) rather than assuming a "standard" axis.
   - **Reusable technique for measuring any GLTF/STL model's real bounding box without opening a 3D tool:** parse the `.gltf` JSON directly and scan `accessors[].min/max` for 3-length arrays (position accessors), e.g.:
     ```python
     import json
     d = json.load(open('ModelName.gltf'))
     mn=[1e9]*3; mx=[-1e9]*3
     for a in d.get('accessors', []):
         if 'min' in a and len(a.get('min',[]))==3:
             for i in range(3):
                 mn[i]=min(mn[i],a['min'][i]); mx[i]=max(mx[i],a['max'][i])
     print('size', [round(mx[i]-mn[i],2) for i in range(3)])
     ```
     For STL, parse the binary format directly (80-byte header, 4-byte triangle count, then 50 bytes per triangle: 12 floats + 2-byte attribute) to extract vertex bounds — a working Python snippet for this was used during the session, re-derive if needed (`struct.unpack('<12fH', ...)`).
2. **"Black box on the platform" recurred multiple times, from different causes:**
   - First cause: the URDF's `waveshare_mounting_plate` and `base_motor_holder` STL meshes rendering as an ugly flat case — fixed by hiding them via `userData.src` substring match.
   - Second cause: the assistant then *deliberately added* a custom-built "mount housing" box mesh (to visually "dock" the arm into the dais) — the user rejected this too ("get rid of the random box u added"), so it was removed. **Do not add a custom housing/socket mesh around the robot's base again** unless explicitly requested — the arm should just mount directly onto the dais.
   - **Lesson:** when the user says "get rid of the box," check BOTH (a) any hidden-mesh exclusion list for gaps, AND (b) any custom-built geometry the assistant may have added on top, since both have independently caused this exact complaint.
3. **Robot arm base-centering required live measurement, not calculation.** The URDF's `base` link's local origin ≠ its visual center. Fixed by: reload the scene, run `window.__robot.traverse(...)` in the console to find the mesh matching `userData.src.includes('base_so101_v2')` (the one *visible* base mesh, not the hidden ones), call `.geometry.computeBoundingBox()` then `.boundingBox.clone().applyMatrix4(mesh.matrixWorld)` to get world-space bounds, read off the center offset needed, and hardcode it into the `<primitive position=...>` prop. **If the robot ever looks off-center again, redo this exact measurement — do not guess an offset.**
4. **A genuinely confusing "blank canvas" debugging detour** — spent significant time suspecting: stale Vite HMR cache, a hanging `<Suspense>` boundary around 190+ assets, `<StrictMode>` double-mounting racing asset loads, and the `<Environment>`/`<Lightformer>` block. **The actual root cause was almost certainly that the preview browser tab was backgrounded** (`document.hidden === true`, `document.visibilityState === 'hidden'` was confirmed via `preview_eval`), and browsers throttle/pause `requestAnimationFrame` in hidden tabs, so React Three Fiber's render loop simply never ticked — nothing was actually broken in the scene code. Two real (harmless, arguably good) changes were made during this detour and were kept: (a) removing `<StrictMode>` from `main.tsx` (comment explains why: avoids dev-only double-mount racing R3F suspense with 200+ asset promises), (b) giving each `<Model>` instance its own `<Suspense>` boundary instead of one shared boundary. **If a blank/frozen canvas happens again during preview verification, FIRST check `document.visibilityState` / whether the preview tab lost focus, before assuming the scene code is broken.** Reloading and waiting the full 15-20s for all assets (this scene is asset-heavy: 190 GLTF + 13 STL + textures) before concluding something is broken is also advisable — false alarms happened from checking too early after a reload.
5. **Arm "jittery, like pushing into a barrier"** — caused by the floor-safety guard *snapping* to the clamped pose the instant a violation was detected, every single frame, rather than easing. Fixed by adding an exponentially-smoothed `guardS` blend factor that eases toward the computed safe-blend target over time instead of applying it instantly. **Any future "invisible wall" / constraint-clamping system should ease its correction factor over multiple frames, never snap.**
6. **Colors reading wrong (gold arm instead of steel):** the URDF bakes its own `<material>` color definitions (`3d_printed` = gold RGBA, `sts3215` = near-black) which the loader applies by default; these must be explicitly overridden post-load by matching on the *original* material's `.name` property (not assuming order or geometry), then constructing fresh `MeshStandardMaterial`s.
7. **A "warm kicker" point light was making the steel read gold** even after material overrides — the fix was to cool the point light's color/intensity down (`#ffd2b0` at low intensity) rather than only fixing materials; lighting color bleeds into PBR metal significantly, worth checking both when a metal color reads wrong.

---

## 6. The overall experience plan (the "Ignition" concept — still the target end-state, sequencing TBD)

This was the creative concept the assistant proposed and the user accepted, called **"The Ignition Core."** It is the intended full experience once the static scene and choreography are both done — but per the user's latest instruction, **scene composition must be finished and approved FIRST**, then work resumes on this sequence:

1. **Boot / power-on sequence** (on page load, ties into the loading screen): room starts dark, a terminal-style `SYSTEM BOOT` loader plays, then room systems wake in sequence — hanging lights kick on one by one, consoles flicker alive, telemetry panels spin up, and the arm does a **joint-by-joint calibration sweep** (each servo sweeps its range, gripper clicks open/closed) before settling into its idle pose-sequencer routine. Not yet built.
2. **Idle state** (mostly built): the arm's pose-sequencer runs its varied full-ROM poses; the drone patrols/docks/recharges; ambient telemetry/data-streams/scanner effects run. Two additional interaction behaviors were approved but **not yet implemented**:
   - Occasionally (not constantly) the arm pauses its idle routine and does one smooth prebaked "glance" motion toward the visitor's cursor position, then resumes — NOTE: this may need re-evaluation now that the camera is being locked to one fixed position (a "glance toward cursor" still makes sense with a fixed camera, since cursor position on screen can still be read via `pointer` events even without camera movement; keep this idea, it was approved separately from the camera-orbit decision).
   - Clicking specific objects in the scene (dais, consoles, the drone) triggers short prebaked reactions (a flourish gesture, a scan-burst effect, a drone flyby) — **not yet implemented**, only the Ignition Core's click is wired up so far.
3. **The Ignition Core (the single "ENTER" cue):** a pulsing energy core in a cradle beside the dais is the room's only interactive "button" (no floating UI element). Clicking it plays the full choreographed sequence: arm reaches to the cradle, grips the core, lifts it in an arc, carries it to a socket at the center of the dais, slots it in, releases; the socket then **surges** — light floods outward through the floor/scanner rings, telemetry spikes, lights flare — camera (if any camera motion remains after the fixed-camera decision — TBD, possibly this becomes a fixed cut/zoom rather than a moving push-in) settles on the glow, then a **white-out transition** hands off into the clean editorial multi-section site (About/Projects/Résumé/Contact). **Scaffolded (phases + poses exist in `ignition.ts`/`So101Arm.tsx`/`IgnitionCore.tsx`) but the choreography quality itself is explicitly acknowledged by the user as not-yet-good and to be redone later.**
4. **Sound design** (approved, ON by default with a mute toggle — not the usual muted-by-default pattern): soft servo whirs as the arm moves, UI click ticks, a low ambient pad. **Not yet implemented at all.**
5. **Polished intro loader** (ties into step 1): a designed loading sequence rather than a blank canvas flash. **Not yet implemented.**
6. **The post-landing editorial site:** clean, fast, smoothly-animated, NOT another 3D scene — normal DOM/CSS sections for About (with the personal "engineering with purpose / humanoid robotics for people who need it" narrative — see the original CONTEXT.md-style content further down), Projects (grid of real projects — see content list below), Résumé (embed the existing `resume.pdf`), Contact. Some of this content and even partial component scaffolding exists in `src/sections/*` from an earlier phase (dark navy-slate theme) but should be treated as a rough starting point, not final, since the visual language may need to reconcile with whatever the 3D landing ends up looking like tonally.

**Sequencing note for whoever picks this up:** the user's most recent message is unambiguous that **step 0 (redesign MegaLab.tsx as a dense, cohesive, composed scene with ONE fixed camera) must be completed and satisfy the user BEFORE any further work on steps 1-5 above resumes.** Do not jump ahead to boot sequences or arm choreography polish until the static room composition itself is approved.

---

## 7. Original site content (for eventual use in the post-landing editorial site)

This is the full content inventory from the **original lavender site** (`main` branch, still live/untouched) that should eventually populate the editorial site in §6.3. Preserved here since it's easy to lose track of amid the 3D work.

### Identity
- Name: Ekam Kooner. Location: Calgary → Vancouver. Email: ekooner656@gmail.com
- LinkedIn: linkedin.com/in/ekam-kooner/ · GitHub: github.com/Ekko656 · Devpost: devpost.com/ekooner656
- Site: ekamkooner.com · Repo: github.com/Ekko656/portfolio

### About-page narrative (the personal mission statement — reuse this copy, it's been validated by the user across many iterations of the about section)
> Who is engineering for? ... Most of what gets built today is built for the people who need it least. Faster trading algorithms. Sharper ad targeting. Another delivery app. I want to spend my life pointed somewhere else. At the older person who can't reach the top shelf anymore. At the hospital running short on night staff. At the parent who needs an extra set of hands. This is why I'm in Biomedical Engineering at UBC. This is why I'm aiming at humanoid robotics. Tesla Optimus, specifically. Not for the technology. For who the technology is able to serve. Everything I build comes back to that. Engineering with purpose.

Interests aside: 🏐 Volleyball, 🏀 NBA, 🎮 League of Legends, 🎵 Drake, 🥊 Boxing.

### Projects (in original site's display order — preserve this order)
1. **Arm Sim** (Simulation) — 7-DOF humanoid arm in MuJoCo, forward kinematics/Jacobian/damped-least-squares IK written from scratch in NumPy, verified to 1e-6m vs MuJoCo across 50+ poses. Stack: Python, NumPy, MuJoCo, MJCF. GitHub: github.com/Ekko656/arm-sim. Has a demo video `arm-sim.webm`.
2. **Barrage** (Backend) — concurrent API load tester, live dashboard. Stack: Java, Spring Boot, JUnit 5, jQuery. GitHub: github.com/Ekko656/barrage. Live demo: barrage-0ajs.onrender.com
3. **HoneyKey** (Security) — honeypot API, real-time attacker classification + SOC-style reports. Built at nwHacks, Best Cybersecurity Hack finalist. Stack: Python, FastAPI, SQLite, MITRE ATT&CK. GitHub: github.com/Ekko656/HoneyKey. Devpost: devpost.com/software/honeykey. Has a YouTube demo embed.
4. **UBC Bionics** (Embedded) — trans-radial prosthetic arm embedded software, Rust lower-level systems work, for CYBATHLON 2028. Stack: Rust, PyO3, STM32, I²C. Org: github.com/BEARUBC, ubcbionics.com
5. **VEX Robotics** (Robotics) — autonomous nav for HS VEX team, 2 years, Alberta's #1 team, competed at Worlds in Dallas. Stack: C++, PID, Pure Pursuit, Odometry. Awards: VEX Tournament Champion, VEX Judges Award, VEX Design Award, Top 15 Mecha Mayhem Finalist.
6. **Ultrasonic Claw** (Hardware) — Arduino ultrasonic-sensor claw, class project. Stack: Arduino, C++, HC-SR04, Fusion 360.
7. **Arduino RC Car** (Hardware) — Bluetooth RC car, HS battlebot 1st place. Stack: Arduino, C++, HC-05, Servos.

### Résumé content (for the Résumé page / for tone/facts to draw on)
- Skills: Rust, C, C++, Python, Java, JS/TS · Matlab, Git, Fusion360, Solidworks, Altium, STM32CubeIDE, Spring Boot, REST APIs · PID control, Odometry, EMG signal processing
- **Embedded Software Engineer, UBC Bionics** (Sept 2025–present): EMG-controlled trans-radial prosthetic arm for CYBATHLON 2028; built full Rust-to-Python interface via PyO3/maturin; reduced inter-layer latency 97.5% (2ms→50ns) by replacing SGCP-over-MPSC with direct PyO3 bindings; engineered Rust I²C multiplexing + fault detection for a custom BMS (TCA9548A + dual MAX17049 fuel gauges, 2S2P lithium-ion array).
- **Robotics Software Engineer, WCHS VEX Robotics** (Apr 2023–May 2025): autonomous C++ routines (odometry/IMU/gyro), PID + holonomic drive tuning, custom pure-pursuit path optimization, Technical Team Lead for Alberta's #1 team (10 members), competed at VEX Worlds Dallas.
- Education: UBC, Bachelor of Applied Science, Sept 2025–present.

### Contact page
- "Let's talk." / "Reach out about robotics, embedded systems, internships, or whatever you're building." / Availability badge: "Open to internships, Summer 2026" (pulsing dot). Links: email, LinkedIn, GitHub. Footer: "© 2025 Ekam Kooner · Calgary → Vancouver"

### Assets already in `public/`
`headshot.jpg` (LinkedIn headshot, used in About), `resume.pdf`, `projects/arm-sim.webm`, `projects/barrage.png`, `projects/claw.jpg`, `projects/claw.mp4`, `projects/honeykey.png`, `projects/rc-car.jpg`, `projects/ubc-bionics.mp4`, `projects/ubcbionics.png`, `projects/vex.png`. These carried over into the current repo (`~/portfolio/public/`) — verify they're still present, they should not have been touched by the 3D scene work.

---

## 8. Memory files already saved (check these, they persist across chats)

A memory file exists at `~/.claude/projects/-Users-ekam/memory/humanoid-arm-portfolio.md` (indexed in `MEMORY.md`) referencing a **separate, different project**: a 7-DOF MuJoCo arm simulation at `~/humanoid-arm`, private repo `Ekko656/humanoid-arm` (this is the **Arm Sim** project from the projects list above, NOT this portfolio-site rebuild — don't confuse the two). No memory file yet exists specifically documenting this portfolio-rebuild session's preferences/decisions — **consider writing one** (type: `feedback` and/or `project`) once this session's redesign work is further along, capturing at minimum: (a) the user's zero-tolerance for AI-slop aesthetics and low-poly geometry, (b) the "verify kinematics empirically via window.__pause + setJointValue, never guess" rule, (c) the Bruno-Simon-style "small dense composed scene, not big empty hall" principle, since these will very likely be relevant again in future sessions on this repo.

---

## 9. Immediate next steps checklist (for the new chat to execute in order)

1. [ ] Read this document fully.
2. [ ] `cd ~/portfolio && git status` and `git log --oneline -5` to confirm still on `scene-rebuild` at (or after) `4f264f3`, clean tree.
3. [ ] Start the dev server via the preview tool, load the scene, confirm current state matches this document's description (screenshot it).
4. [ ] Delete `src/landing/lab/HoloTable.tsx` and remove its import/usage in `MegaLab.tsx`.
5. [ ] Remove `<OrbitControls>` interactivity (or replace with a completely static camera — no drag, no zoom) and remove `<IdleDrift>` from `LandingScene.tsx`. Zoom the fixed camera in slightly from current framing (`[0, 4.0, 17]` fov 44 → try something like `[0, 3.4, 13]` fov ~42 as a starting point, then eyeball-adjust).
6. [ ] **Before adding anything else, decide on paper (or in a plan) what the room's actual zones/composition are** — e.g., "control station wall behind-left, parts storage right, maintenance/charging nook back-right near drone dock, open work floor center with the arm+dais." Consider shrinking `EDGE` substantially (currently 16) so the room reads dense/tight rather than vast/empty, and rebuild wall/ceiling/floor tiling math to match (re-verify tile dimensions per §4/§5.1 rather than assuming old math still applies at a new scale).
7. [ ] Re-place existing kit props (crates, barrels, chest, item holder, cables, vents, computer consoles, rails if reintroduced thoughtfully) into those deliberate zones — remove ad hoc "scattered near walls" placement.
8. [ ] Update `DataStreams.tsx`'s hardcoded `LANES` positions and `Drone.tsx`'s dock `PAD` position to match the new, smaller room geometry.
9. [ ] Re-verify (screenshot, fresh reload, waited full load time, check `document.visibilityState==='visible'`) that: the arm is centered, not clipping, using full obtuse-V range of motion; no black box artifact on the dais; telemetry panels fully in frame; room reads dense/composed rather than empty.
10. [ ] Get explicit user sign-off on the static scene composition before touching boot sequence / arm choreography / sound (§6 steps 1, 3, 4, 5).
11. [ ] Commit + push to `origin/scene-rebuild` with a clear message, per the user's standing "push after major changes regularly" instruction.
