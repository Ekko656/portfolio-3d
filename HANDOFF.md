# portfolio-3d — Handoff / Context Document

Everything a fresh chat needs to continue this project with zero context loss.
**Read this whole file before touching anything.** The owner (Ekam) is very
particular; skipping context here has repeatedly caused rework and frustration.

---

## 0. TL;DR + immediate next steps

We are building an **interactive 3D portfolio landing scene**: a stylized
**Big Hero 6 "Hiro's garage"** — a dark, amber-lit, industrial robotics
engineer's **workbench at dawn**, with the real SO-101 robot arm alive on the
bench. It's a jewel-box diorama with a fixed cinematic camera. Later, a single
interaction (arm plugs a cable into a second monitor → boot → dive into the
screen) hands off to a clean **editorial content site** (About/Projects/Résumé/
Contact). Benchmarked against **jesse-zhou.com** and **bruno-simon.com**.

**Current state:** the garage environment is ~80% dressed and looking good
(dark amber industrial, bench against the wall, dual monitors, code-built PC +
3D printer, pegboard, tool chest, dev board + servo the arm works over,
basketball + Nike Dunks under the bench, rainy-dawn window, lots of detail).
The arm has continuous organic motion but **Ekam doesn't like the arm movement
yet** — explicitly deferred ("work on that later").

**What's NOT built yet:** the interaction (plug-in → boot → dolly into screen),
the editorial content site, sound, the loader/boot sequence.

**Likely next work (confirm with Ekam):**
1. Keep refining environment detail/density (his current focus — "get the
   environment and scene perfect first").
2. Then: redo the arm's movement to feel deliberate/creature-like (he wants
   fluid life but dislikes the current noise-drift).
3. Then: the plug-in → boot → editorial interaction.
4. Then: the editorial site.

---

## 1. Project / goal / owner

- **Owner:** Ekam Kooner — UBC Biomedical Engineering (Robotics) student, aiming
  at humanoid robotics (cites Tesla Optimus). Calgary → Vancouver. Likes
  basketball/NBA, Nike Dunks, volleyball, boxing, Drake, League.
- **Goal:** a personal portfolio (`ekamkooner.com`) that is unexpected and
  impressive — an interactive 3D scene, NOT a normal webpage with a 3D
  decoration bolted on. Wow-weighted but must stay **recruiter-credible**
  (Summer-2026 internships).
- The 3D scene is the wordless hero/landing; a **separate clean editorial site**
  holds the actual readable content, reached via one diegetic interaction.

---

## 2. Repo, dev workflow, preview gotchas

- **Working dir:** `~/portfolio-3d`
- **Repo:** `git@github.com:Ekko656/portfolio-3d.git` (public), branch `main`.
  Commits authored as `ekooner656@gmail.com` so they green Ekam's contribution
  graph. **He wants frequent commits + pushes.**
- **Stack:** Vite + React 18 + TypeScript + Tailwind + three 0.171 +
  @react-three/fiber 8 + @react-three/drei + @react-three/postprocessing +
  urdf-loader. Node 24. Blender 5.1.2 installed (Metal GPU) for asset work.
- **Old repo** `github.com/Ekko656/portfolio` (branch `scene-rebuild`) is the
  ABANDONED stock-kit "MegaLab" version — reference only, don't merge.

### Preview / dev-server gotchas (IMPORTANT — these wasted time)
- The **Claude Preview MCP is rooted at `/Users/ekam`**, so `preview_start`
  launches the WRONG project (an old `~/portfolio` server on **5173**).
- **Run this project's dev server manually on port 5174** and point the preview
  browser at it:
  ```
  cd ~/portfolio-3d && nohup npm run dev -- --port 5174 --strictPort >/tmp/p3d-dev.log 2>&1 &
  ```
  Then in a `preview_eval`: `location.href = 'http://localhost:5174/'`.
  The dev server sometimes dies between sessions — restart it (check
  `curl -s -o /dev/null -w "%{http_code}" http://localhost:5174/`).
- **Black screenshots are usually a false alarm:** the preview tab backgrounds
  itself (`document.visibilityState === 'hidden'`), pausing requestAnimationFrame.
  Take a second screenshot; it usually foregrounds. If truly black, run
  `npx vite build --mode development` to check for a real compile error.
- The scene is asset-heavy (13 STL for the arm + 2 GLB); **wait ~13s after a
  reload** before screenshotting.
- **Verify every visual change in the live preview** before claiming it's done.
  Ekam repeatedly catches claims that don't match the render.

---

## 3. ART DIRECTION (locked) — Big Hero 6 garage

**Stylized (NOT photoreal), dark, amber-lit, INDUSTRIAL GARAGE.** Reference:
Hiro Hamada's garage-lab, esp. the nanobot + Baymax-armor-upgrade scenes — an
"industrial genius working in his garage on Iron-Man-ish tech." A robotics
engineer's workbench area **at dawn**.

Hard-won palette/mood rules (each learned by getting it wrong):
- **Dark + amber**, moody. NOT a bright daylight "house/living room." NOT a
  cozy warm space with fairy lights/LED string lights (both rejected).
- **NOT a tan/beige "sandcastle" palette** — cohesive DARK industrial tones
  (dark concrete, dark metal, dark wood), warm amber lighting, with **teal tech
  glow accents** (monitors, PC RGB — the BH6 warm-orange + teal complement).
- NO glowing "hero" gimmick elements (an arc reactor was built and rejected as
  out-of-place).
- Everything reads as a real working garage: concrete floor, industrial
  workbench, tools, computers, robot parts, wires, clutter — lived-in.

### THE #1 RULE (he restated it many times — save it forever)
**NEVER use low-polygon elements / simple shapes / solid-colour boxes mushed
together.** Every element must be **extremely detailed and HEAVILY
INTENTIONAL**. When adding "parts," make them look like REAL robotics/
engineering parts (an Arduino, a breadboard with holes, a servo, a motor) — not
random rings and blocks. He's suggested sourcing real STL/GLB files ("they're
everywhere online"). Reality: the good detailed-model sites (Sketchfab/GrabCAD)
are auth-gated and can't be pulled directly; free direct-download ones are
low-poly. If Ekam drops `.stl`/`.glb` into `public/models/`, wire them in like
the SO-101 (he sourced the arm + an old kit himself before).

---

## 4. The scene as it stands (file-by-file)

Entry: `src/App.tsx` → `src/landing/Stage.tsx` (one `<Canvas>`).

### `src/landing/Stage.tsx` (the whole scene) — key constants
- `DESK_Y = 0.4` (benchtop height), `DESK_W = 9.0` (bench width), `DESK_D = 3.4`
  (bench depth), `BENCH_Z = -2.0` (the bench CLUSTER is wrapped in a group at
  this z so its back edge sits ~z-3.7 against the wall).
- Camera: `position [8.4, 4.2, 13.0], fov 42`, `lookAt(-0.2, 1.5, -2.4)`. Fixed
  (no OrbitControls). Fog `(BG, 20, 46)`, exposure `1.08`, ACESFilmic.
- Palette: `BG #0e0f11`, floor tint `#44423e`, walls dark, amber `KEY/PRACTICAL`,
  `RIM #9ec2ff` (cool dawn), teal accents `#2fe6d0`.
- **Components in Stage:**
  - `Workbench` — heavy industrial bench against the wall: steel-tube frame,
    worn dark-wood top (`workbenchTexture`) with steel edge banding, and a
    **3-drawer full-height cabinet** on the right (floor→benchtop, faces flush
    to front). Bench cluster group also holds Workstation, printer, BenchClutter,
    So101Arm.
  - `Shell` — dark concrete floor (`concreteTexture`), a left OSB wall
    (`plywoodTexture`), a dark board ceiling (`ceilingTexture`) + exposed
    wood joists + a conduit pipe.
  - `ShopLight` — hanging fluorescent fixture with **amber** tubes + amber
    point light (the motivated key), centered over the bench.
  - `Lighting` — low warm-amber ambient + hemisphere, amber directional key
    (shadows), cool dawn rim from the window, one amber work-lamp point.
  - `WallDressing` — the pegboard (right of window) with `Tools` hung on **real
    peg hooks**, 4 corner mounting screws, and a tool ledge/shelf (cans/jar/box).
  - `Tools` / `Hook` / `OpenWrench` / `Screwdriver` — the spread tool wall.
  - `Background` — narrow wall shelves with detailed `PartBin`s + a `ScrewJar`;
    a blueprint poster; taped photos/notes; a round wall clock; wall conduit; a
    shop stool.
  - `PartBin` / `ScrewJar` — detailed stackable louvered bins / glass jar.
  - `BenchClutter` — on the bench: a **dev board** (green PCB w/ IC, gold header
    pins, USB-C, caps, LEDs) the arm works over; a servo motor + ribbon cable; a
    parts tray with screws; a soldering iron in a stand; a **cluster of real
    robotics parts by the monitors** (Arduino-style board, breadboard with a
    hole-grid canvas texture, gearmotor, jumper wires); a power strip + routed
    cables. `tube()` helper builds cables. `makeBreadboardTex()` draws the
    breadboard top.
  - `PcTower` — **code-built** gaming PC: dark chassis panels, glass front,
    RGB interior (GPU + spinning fans, cooler, RAM, PSU) read through the glass.
    `PcFan` blades spin via useFrame ("whirring"). Sits UNDER the desk, under
    the monitors.
  - `ToolChest` — red rolling tool chest (left, against the wall).
  - `Basketball` (seamed) + `Sneaker` (Nike-Dunk-style, white/red) — under the
    bench beside the drawers (Ekam's personal touch).
  - `Printer3D` + `Workstation` + `So101Arm` are placed inside the bench group.
  - NOTE: `ArcReactor` is defined but UNUSED (removed from the scene — do NOT
    re-add; it was rejected).

### `src/landing/Printer3D.tsx`
Code-built, coherent Ender-3 (extrusion frame, posts + top bar, gold Z lead
screws, heated bed + half-print, X-gantry). The **print head glides side-to-side
+ a part-cooling fan spins** (useFrame). Scale ~0.6 on the bench right.
(Replaced the earlier Blender `printer.glb`, which looked like "a mash of parts.")

### `src/landing/Workstation.tsx`
**Dual-monitor setup** (side by side, slight inward toe-in) to the LEFT of the
arm so it never blocks them: left = live telemetry screen (canvas texture driven
by the real arm joints via `armState`), right = dark "off" doorway monitor
(the one the arm will plug in). Keyboard, mouse, and a `Connector` (neat cable +
plug) laying within the arm's reach. Monitors moved forward so they don't clip
the window.

### `src/components/arm/So101Arm.tsx` (the robot)
- Real **SO-ARM101** loaded from URDF + 13 STL meshes (`public/so101/`) via
  `urdf-loader` + `STLLoader`. Re-skinned to steel/charcoal PBR; hidden the boxy
  base enclosure meshes. `scale=4.8`, position `[-0.026, 0.168, -0.153]`
  (base seated on benchtop). Inside the bench group at `BENCH_Z`.
- **Kinematics ground-truth (VERIFIED live — do not re-derive):**
  joints `Rotation, Pitch, Elbow, Wrist_Pitch, Wrist_Roll, Jaw` (radians).
  - Rotation: + turns toward viewer/right, − toward window/left.
  - Pitch: 0 = upper-arm vertical, − leans forward.
  - **Elbow: −1.7 = straight, 0 = fully folded** (negative extends).
  - Wrist_Pitch: − tilts head up, + down. Wrist_Roll: head cock. Jaw: open amt.
  - Debug hooks in code: `window.__pause=true` freezes idle;
    `window.__robot.joints['X'].setJointValue(v)` to probe; screenshot; read off.
- **Current motion = continuous organic noise** (`fbm` = layered incommensurate
  sines per joint × a slow "energy" envelope + breathing). Always moving, never
  static, gaze wandering. Lightning (`weather.flash` from Outdoors) triggers a
  smooth startle flinch. **Ekam does NOT like this movement yet** — deferred.
  He wants "completely fluid movement, life, breathing," NOT move-hold-move, but
  the current noise-drift also isn't right to him. (Old keyframe scheduler code
  — BEHAVIORS, pickBehavior, nextSeg — is still in the file but UNUSED.)
- A **measured floor guard** (exact FK, bisects toward a SAFE pose) keeps the
  gripper from dipping through the benchtop; `CLEARANCE = 0.48`. Do not replace
  with analytic math.
- `src/landing/ignition.ts` — scaffold for the future plug-in choreography
  (phases reach/grab/lift/slot/release/surge). Present but the interaction isn't
  wired/used yet; the arm's IGN_POSE branch exists in So101Arm.

### `src/landing/Outdoors.tsx` (through the window)
Layered "lofi rainy dawn" matte scene: a canvas gradient dawn sky, hill bands, a
vertex-coloured meadow, a lone **normal fluffy tree** (off-centre in the left
pane so the mullion doesn't block it), instanced wispy grass, real petaled
flowers (rejection-sampled, non-overlapping) + one larger foreground bloom,
drifting mist, falling rain, and **lightning bolts that flash the sky** and set
`weather.flash`. All unlit (fog=false) and placed BEHIND the window wall (z<-4)
so nothing pokes into the room.

### `src/landing/Window.tsx`
A real 6-pane window (extruded casing molding, mullions, sill, glass) with a
genuine opening cut through a large back wall (`WALL` is 172 wide × 46 to fully
enclose the room; `WALL_COL #332619` dark warm). Only view outside is the window.

### `src/landing/textures.ts`
Procedural canvas textures (no external assets), rebuilt at proper colored
mid-tones so they READ: `concreteTexture`, `plywoodTexture` (OSB),
`workbenchTexture` (wood), `ceilingTexture`, `pegboardTexture`. In Stage the
mesh `color` prop tints these darker for the industrial look.

### `src/landing/armState.ts`
Shared object the arm writes each frame (joint values + `t`) and the telemetry
monitor reads. `JOINT_RANGE` for normalized bars.

### Blender assets — `assets-src/blender/*.py` (+ `public/models/*.glb`)
`printer.py`, `pc.py`, `workbench.py` build models headless (Cycles Metal GPU;
`--render` previews, `--export` writes GLB). **The Blender printer/PC looked like
a mash of parts** (blind coordinate assembly is unreliable), so both were
**rebuilt in R3F code instead** (Printer3D, PcTower) — the GLBs in
`public/models/` are now UNUSED. Keep the scripts as reference; do NOT put those
GLBs back in the scene. `BlenderPrinter.tsx` (a generic `GlbModel` loader) is
also currently unused.

---

## 5. Working-style rules / feedback patterns (READ — Ekam is exacting)

- **NEVER low-poly / solid-colour boxes.** Extremely detailed + intentional.
  (See §3.) This is the recurring flashpoint.
- **Go in the exact order he lists things.** He gets angry when tasks are
  skipped or reordered. When he gives a numbered list, do #1→#N in order.
- **Refine what exists before adding more** when he says so.
- **Verify framing in-preview** before claiming done; elements have repeatedly
  ended up off-frame or clipping (window, benchtop).
- He wants concrete, opinionated options over vague questions — but when he
  says "you decide," decide and show a result.
- He iterates hard on aesthetics; matching Jesse/Bruno's intentional cohesion is
  the bar. Their craft secret is **baked lighting** (Blender Cycles bake → unlit
  textures) + selective bloom + ACESFilmic + small payload. (We're currently
  doing live R3F lighting; baking is a future fidelity lever.)
- Do NOT re-litigate rejected directions (§6).

---

## 6. Rejected directions — DO NOT re-propose

- Stock sci-fi asset kit ("MegaLab"), scattered gimmick props.
- Cursor-controlled arm; humanoid point-cloud figure; primitive hand-built arm
  (use the real SO-101 only).
- Cozy warm "house/living room" look; tan/beige "sandcastle" palette; **fairy/
  LED string lights**; a glowing "arc reactor" hero element.
- The low-poly Blender printer/PC "mash of parts" — now rebuilt in code.
- Arm motion as rigid move-to-pose-then-hold routines.
- Blind full-machine assembly in Blender (unreliable) — assemble visually in
  code or source real models.

---

## 7. The interaction & experience plan (not built yet)

1. **Idle:** the arm is alive on the bench (working over the dev board, gazing,
   startling at lightning). Left monitor shows live telemetry; right monitor is
   dark/unplugged.
2. **Enter (the one interaction):** user clicks → the arm picks up the loose
   **cable/connector** and **plugs it into the dark monitor** → it boots (a
   boot sequence on screen) → **camera dollies INTO that screen** → becomes the
   editorial site. Diegetic — the portfolio is "what's on his machine." No
   whiteout gimmick. (A tiny Enter-key press was rejected — a cable plug is
   bigger/clearer.)
3. **Editorial site (separate, clean, fast, readable):** About / Projects /
   Résumé / Contact. Recruiter-scannable. Content in §8.
4. Later polish: boot/loader sequence, sound (servo whirs + ambient, ON by
   default with mute), performance tiers / mobile fallback.

---

## 8. Original site content (for the editorial site later)

- **Identity:** Ekam Kooner · Calgary → Vancouver · ekooner656@gmail.com ·
  linkedin.com/in/ekam-kooner/ · github.com/Ekko656 · devpost.com/ekooner656 ·
  ekamkooner.com. Assets already in `public/` (headshot.jpg, resume.pdf,
  projects/*.png|mp4|webm).
- **About narrative (validated copy, reuse):** "Who is engineering for? … Most
  of what gets built today is built for the people who need it least… I want to
  spend my life pointed somewhere else. At the older person who can't reach the
  top shelf… the hospital short on night staff… the parent who needs an extra
  set of hands. This is why I'm in Biomedical Engineering at UBC. This is why
  I'm aiming at humanoid robotics. Tesla Optimus, specifically. Not for the
  technology. For who the technology is able to serve. Engineering with purpose."
  Interests: 🏐 Volleyball, 🏀 NBA, 🎮 League, 🎵 Drake, 🥊 Boxing.
- **Projects (preserve order):** 1) Arm Sim (7-DOF MuJoCo arm, NumPy FK/Jacobian/
  DLS IK, verified 1e-6m; github.com/Ekko656/arm-sim). 2) Barrage (concurrent API
  load tester; Java/Spring Boot; barrage-0ajs.onrender.com). 3) HoneyKey
  (honeypot API + attacker classification; nwHacks Best Cybersecurity finalist;
  Python/FastAPI/MITRE ATT&CK). 4) UBC Bionics (trans-radial prosthetic, Rust/
  PyO3/STM32/I²C, CYBATHLON 2028). 5) VEX Robotics (autonomous nav, Alberta #1,
  Worlds; C++/PID/Pure Pursuit). 6) Ultrasonic Claw (Arduino). 7) Arduino RC Car.
- **Résumé highlights:** Embedded SWE @ UBC Bionics (Rust↔Python via PyO3,
  −97.5% latency, I²C BMS). Robotics SWE @ WCHS VEX (odometry/PID/pure-pursuit,
  team lead, Worlds). Skills: Rust/C/C++/Python/Java/JS-TS, PID, EMG, Fusion360.
- **Contact:** "Let's talk." · "Open to internships, Summer 2026" (pulsing dot).

---

## 9. Known issues / gotchas

- **Arm movement** is the open creative problem (Ekam dislikes the current
  noise-drift; wants fluid, deliberate, creature-like life — think Pixar Luxo).
- Unused code, harmless in dev but would fail a strict `tsc --noEmit`: the old
  keyframe behavior system in So101Arm, `ArcReactor` in Stage,
  `BlenderPrinter.tsx`/`GlbModel`, and the `public/models/*.glb`.
- Moving the CAMERA shifts the outdoor tree/parallax through the window — retune
  `Outdoors` tree x-position if you change the camera.
- Bench cluster is a `<group position={[0,0,BENCH_Z]}>` — anything meant to sit
  ON the bench must go inside it (local coords), floor props go outside (world).
- R3F: `rotation` goes on the `<mesh>`, never on a `<geometry>` (a repeated bug).

---

## 10. Memory files (persist across chats, at `~/.claude/.../memory/`)

- `portfolio-3d-rebuild.md` — project: concept, pipeline, repo, locked decisions.
- `portfolio-3d-working-style.md` — the aesthetic bar + process rules (the
  NEVER-low-poly rule, verify-in-preview, source real models, go-in-order).
- `portfolio-3d-active-tasklist.md` — a recent ordered task list + guardrails.
- `humanoid-arm-portfolio.md` — the SEPARATE MuJoCo Arm-Sim project (~/humanoid-arm).
- Index in `MEMORY.md`. Treat THIS HANDOFF.md as the current source of truth
  where older notes conflict.

---

## 11. Reference materials
- **jesse-zhou.com** (Kowloon ramen diorama) + **bruno-simon.com** — the craft
  bar: cohesive, intentional, baked-lit, small-payload 3D worlds.
- **Big Hero 6 "Hiro's garage"** (nanobot + Baymax-armor scenes) — the art
  direction for THIS scene.
- SO-101 arm source: `TheRobotStudio/SO-ARM100` (a working URDF+STL set is
  already in `public/so101/`).

---

## 12. Git history (high level)
`main` branch, ~30 commits. Arc of the project: baseline import → strip the old
33MB stock kit → warm-night workshop blockout → detailed rainy-dawn window/
outdoors → arm Luxo behavior v1 → scale reframe + garage shell → Big Hero 6
warm overhaul (then corrected off "cozy/tan" toward dark industrial) → dual
monitors + real tool wall → industrial workbench against the wall + amber light
→ code-built PC + printer (replacing the Blender "mash") → real electronics on
the bench → continuous-organic arm motion → basketball + Dunks + spinning fans +
3-drawer cabinet + real robotics parts. `git log --oneline` for the full list.
