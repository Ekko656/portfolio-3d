# portfolio-3d — Plan

The ground-up rebuild of Ekam Kooner's interactive 3D portfolio. Replaces the
abandoned stock-kit "MegaLab" direction (kept only as reference in the old
`Ekko656/portfolio` repo). Benchmarked against **jesse-zhou.com** and
**bruno-simon.com**: cohesive, intentional, crafted — not stock files mushed
together with gimmicks.

## The concept (locked)

- An **intimate, cinematic, warm dim workshop at night** — a jewel-box diorama,
  not a big explorable hall. Fixed camera (optional gentle drift). Film-lit,
  moody, atmospheric.
- The **real SO-101 arm is the centerpiece**, ambiently "working" via prebaked
  idle choreography. Rich-but-composed surround: every element intentional and
  custom, nothing scattered.
- **One interaction:** a single clickable object. Clicking it, the arm reaches
  over and plugs it in → the room/site **"charges up"** with a grand animation →
  hands off into a clean editorial content site.
- **Two-part structure:** wordless 3D landing → fast, readable editorial site
  (About / Projects / Résumé / Contact).
- Goal: wow-weighted, but credible for Summer-2026 internship recruiters.

## The technique (from Jesse Zhou / Bruno Simon research)

The reference look = **baked lighting**, not lots of models:
1. Model + light the scene in Blender (Cycles, warm-night).
2. **Bake** lighting+shadow into a texture atlas (combined bake, UV unwrap).
3. In-browser, render **unlit** (`meshBasicMaterial`) — film-quality light at
   ~zero GPU cost. Keep it small (Bruno's whole site is 2.8MB; Draco compress).
4. **Selective bloom** on emissives + **ACESFilmic** tone mapping for cinema.
5. Bruno's tricks: **matcaps** (fake shading, no lights) + faked floor bounce.
6. **Performance tiers** (Jesse): drop bloom/reflections, matcap fallback,
   target ~45fps on mobile.

Hero model: pull clean SO-101 from official **`TheRobotStudio/SO-ARM100`**
(`Simulation/SO101/` URDF + `STL/SO101/`), not the current third-party fork.

## Pipeline: hybrid (chosen)

Build a **code-built vertical slice in R3F first** to lock composition, mood, and
arm choreography fast in-browser; **then script Blender headlessly** (installed:
5.1.2, Cycles OK) to bake the environment for final fidelity, re-importing unlit.

## Phases

- **P0 — Foundation:** strip stock kit + dead experiments; pull clean SO-101;
  minimal buildable R3F canvas, arm on a bench, fixed camera; lock palette/identity.
- **P1 — Vertical slice (code-built):** the one gorgeous hero frame — arm +
  workbench + tight surround, warm practical lamp, emissive practicals, bloom,
  tone mapping, fog, soft contact shadows; arm idle choreography (reuse verified
  kinematics). **Gate: Ekam sign-off on composition + mood.**
- **P2 — Interaction + charge-up:** the single clickable object; arm
  reach→grab→plug choreography; grand charge-up transition → editorial handoff.
- **P3 — Bake for fidelity:** move locked composition into scripted Blender,
  Cycles warm-night lighting, bake combined textures, re-import unlit; keep
  whichever reads best per element.
- **P4 — Editorial site:** fast/clean, cohesive with landing identity — About
  (mission narrative), Projects (7 real), Résumé (embed pdf), Contact.
- **P5 — Polish:** boot/loader sequence, sound (servo whirs + ambient pad, ON by
  default w/ mute), perf tiers + mobile fallback, QA.

## Working rules

- **No AI-slop aesthetics, no gimmicks.** Craft and cohesion over quantity.
- **Verify every visual change in live preview** (fresh reload, full asset load)
  before claiming it's done. Never rely on code inspection alone.
- **Verify robot kinematics empirically** (`window.__pause` + `setJointValue`,
  screenshot) — never guess joint sign conventions.
- **Commit + push frequently** to `github.com/Ekko656/portfolio-3d` (public).

## Kinematics ground-truth (verified, do not re-derive)

Joints: `Rotation, Pitch, Elbow, Wrist_Pitch, Wrist_Roll, Jaw` (radians).
- **Elbow: −1.7 ≈ straight/extended, 0 ≈ folded** (negative extends).
- **Pitch: 0 ≈ upper arm vertical; negative leans forward.**
- Good obtuse-V pose: `Rotation=1.2, Pitch=−1.65, Elbow=−0.95, Wrist_Pitch=−0.2,
  Wrist_Roll=0.4, Jaw=0.9`.
