# portfolio-3d — Handoff / Context Document

Everything a fresh chat needs to continue with zero context loss.
**Read this whole file before touching anything.** The owner (Ekam) is very
particular — skipping context here has repeatedly caused rework and real anger.
Last updated mid-session, right after the soldering-station rebuild and a
base-flip experiment, with a concrete un-done task list at the top (§0).

---

## 0. IMMEDIATE PENDING WORK (do these first, in this order)

These are Ekam's most recent instructions, **not yet done**. He was frustrated
about low-poly/clipping again. Verify EVERY item in the live preview.

1. **Mouse** — currently has "two giant ovals on it for no reason" (the L/R
   button spheres + an RGB accent sphere read as ovals). Make it a **real
   mouse**: one smooth tapered shell, a subtle centre button split line, a real
   scroll wheel, no giant ovals, no low-poly. In `Workstation.tsx` → `Mouse`.
2. **"Giant green box"** — get rid of it. LIKELY the 3D-printer's teal print on
   the bed OR the teal soldering-station body reading as a big green box. LOOK
   at the right side of the bench first to identify which, then remove/fix it.
3. **Soldering iron** — "looks like two cylinders with shit clipping into each
   other and completely wrong proportions." The `Stage.tsx` soldering-station
   rebuild (Weller-style, teal) he dislikes at scene scale. Fix proportions /
   the iron so it doesn't read as two clipping cylinders. (A close-up reference
   is saved — see §11.)
4. **Arm base — REVERT the flip.** I set `rotation={[-Math.PI/2,0,Math.PI]}` on
   the arm primitive (So101Arm.tsx line ~329, **uncommitted**). He said "rotate
   the arm back to how it was" → put it back to `rotation={[-Math.PI/2,0,0]}`.
5. **Arm feet** — "it's missing the two little feet stands like a regular SO-ARM
   101." The base feet meshes are currently HIDDEN (So101Arm.tsx ~line 165 hides
   `waveshare_mounting_plate`, `base_motor_holder`, `base_so101_v2`). Un-hide /
   add the two little foot stands the real SO-101 base has.
6. **Luxo movement** — do it now (this is Phase 1). Requirements: **NOT drooping
   whatsoever**, it should be "looking straight up," **natural**. The current
   idle (`ORG_REST=[0,-0.72,-0.66,-0.35,0,0.3]`) droops the head down — that's
   the opposite of what he wants. Rework so the arm carries itself upright/alert,
   gazing up, with flowy continuous life (see §5 + §6 for the full plan).
7. **Power deck (the dock) — still not visibly plugged in.** Make a **VISIBLE
   outlet ON THE WALL BENEATH THE TABLE** and have the deck plugged into it.
   (Prior attempt put an outlet under the desk but it doesn't read as connected.)
8. **Brick chargers on top of the deck** — the monitor's two-prong charging
   bricks should plug into **sockets on the TOP of the deck** (facing up), with
   the FIRST monitor's brick actually plugged into a top socket. So the dock
   needs top-facing sockets, not (only) front ones.

Uncommitted right now: only `src/components/arm/So101Arm.tsx` (the base flip that
must be reverted). Everything else is pushed (HEAD `2abc15c` before this doc).

---

## 1. Project / goal / owner

- **Owner:** Ekam Kooner — UBC Biomedical Engineering (Robotics) student, aiming
  at humanoid robotics (cites Tesla Optimus). Calgary → Vancouver. Likes
  basketball/NBA, Nike Dunks, volleyball, boxing, Drake, League.
- **Goal:** a personal portfolio (`ekamkooner.com`) that is unexpected and
  impressive — an interactive 3D scene, NOT a normal webpage with a 3D decoration
  bolted on. Wow-weighted but must stay **recruiter-credible** (Summer-2026
  internships).
- The 3D scene (a Big Hero 6 "garage") is the wordless hero; a separate clean 2D
  editorial site holds the readable content, reachable via a bottom button.

---

## 2. Repo, dev workflow, preview gotchas

- **Working dir:** `~/portfolio-3d`
- **Repo:** `git@github.com:Ekko656/portfolio-3d.git` (public), branch `main`.
  Commits authored `ekooner656@gmail.com` (greens Ekam's contribution graph).
  **He wants frequent commits + pushes — "always push."** End commit messages
  with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- **Stack:** Vite + React 18 + TypeScript + Tailwind + three 0.171 +
  @react-three/fiber 8 + @react-three/drei + @react-three/postprocessing +
  urdf-loader. Node 24. **Blender 5.1.2** installed (`/Applications/Blender.app/
  Contents/MacOS/Blender`, Metal GPU) for asset work.

### Preview / dev-server gotchas (these have wasted a LOT of time)
- Two preview tool families exist. This session used the **Browser pane**
  (`mcp__Claude_Browser__*`): `preview_start {name:"portfolio"}` starts the dev
  server AND opens tab `seed` at `localhost:5174`. Screenshot via
  `computer {action:"screenshot"}`, run JS via `javascript_tool`. There is also
  an older `mcp__Claude_Preview__*` family with `preview_screenshot`/`preview_eval`.
- The preview reads **`/Users/ekam/.claude/launch.json`** (NOT the repo one),
  which I set to `npm --prefix portfolio-3d run dev -- --port 5174 --strictPort`,
  port 5174, autoPort false. It serves portfolio-3d correctly.
- **WebGL context loss:** after ~a dozen `location.reload()`s the canvas goes
  black (a dark radial "blob" over the CSS bg) even though `document.querySelector
  ('canvas')` exists and `window.__robot` is set. **Fix = `preview_stop` then
  `preview_start`** (fresh browser context). Don't mistake this for a code crash.
- If the page shows a **navy dotted background with no 3D** and console has a
  `<Mouse>`/`<Canvas>` React error → a runtime error in a scene component blanked
  the Canvas via its ErrorBoundary. Read console, fix the component. (A dangling
  `geometry={cable}` ref after removing a variable caused exactly this once.)
- **Wait ~13–15s after a reload** before screenshotting (13 STL + 2 GLB load).
- **Debug/inspect hooks:** `window.__pause = true` freezes the arm idle (set it
  after load, before screenshotting, so poses are stable). `window.__robot` is
  the loaded URDF root; `window.__robot.joints['Rotation'].setJointValue(v)` to
  probe joints; `window.__robot.links['jaw'].getWorldPosition(...)` for FK.
- **To inspect a small prop up close, MOVE THE CAMERA** (edit the `camera` +
  `lookAt` in Stage.tsx, reload, screenshot, then restore). NEVER drop oversized
  inspection props into the live scene — a giant inspection-rig shoe once made
  him furious.
- **Verify every visual change in the live preview before claiming done.** He
  repeatedly catches claims that don't match the render. Check against each
  object's ACTUAL footprint (positions are in this doc / the code) — the
  recurring clipping bugs came from eyeballing coordinates instead.

---

## 3. ART DIRECTION (locked) — Big Hero 6 garage

**Stylized (NOT photoreal), dark, amber-lit, INDUSTRIAL GARAGE.** Reference:
Hiro Hamada's garage-lab. A robotics engineer's workbench at dawn.

Palette/mood rules (each learned by getting it wrong):
- Dark + amber, moody. NOT bright/daylight, NOT cozy "house," NOT fairy/LED
  string lights (rejected), NOT a tan/beige "sandcastle" palette. Cohesive DARK
  industrial tones + warm amber light + **teal tech-glow accents** (monitors, PC
  RGB). No glowing "hero" gimmick (an arc reactor was built and rejected).

### THE #1 RULE (restated many times, and again this session)
**NEVER low-polygon / simple solid-colour boxes/cylinders mushed together.**
Every element must be **extremely detailed, intentional, and REALISTIC.** When
he says a thing "looks like two cylinders" or "a giant box" that's the flashpoint.
For organic/branded/complex props, **use a real reference image** (he responds
well to that) and/or model them in **Blender** with subdivision surfaces and
export GLB — do NOT stack R3F primitives for shoes/balls/etc.

---

## 4. Scene as it stands (file-by-file)

Entry: `src/App.tsx` → `src/landing/Stage.tsx` (one `<Canvas>`, fixed cinematic
camera at `[8.4,4.2,13] lookAt(-0.2,1.5,-2.4)`, fov 42, ACESFilmic, exposure
1.08, Fog(BG,20,46), Bloom + Vignette).

Key constants (Stage.tsx): `DESK_Y=0.4` (benchtop), `DESK_W=9`, `DESK_D=3.4`,
`BENCH_Z=-2` (bench cluster group offset). Palette: `BG #0e0f11`.

**Coordinate note (critical for placing/routing):** the bench cluster is
`<group position={[0,0,BENCH_Z=-2]}>`. Inside it, `BenchClutter` and
`Workstation` render inside `<group position={[0,DESK_Y=0.4,0]}>`. So a
BenchClutter/Workstation LOCAL coord `[x,y,z]` → WORLD `[x, y+0.4, z-2]`. The arm
(`So101Arm`) is a direct child of the bench group (not the +0.4 inner group).

### `src/landing/Stage.tsx` (most of the scene) — components
- `Workbench`, `Shell` (concrete floor at world y=-2, OSB wall, joisted ceiling),
  `ShopLight` (amber fluorescent), `Lighting`, `WallDressing` (pegboard + tools +
  ledge shelf + the box level laid flat on the ledge), `Background` (wall shelves,
  poster, clock, notes), `ToolChest` (red, left; holds the résumé `PaperStack`),
  `PcTower` (code-built RGB gaming PC, under-desk left, world [-2.4,-2,-1.2]),
  `Printer3D` (right), `Basketball` + two `Sneaker`s (GLBs, under the bench),
  `So101Arm`.
- **Pegboard tools** (`Tools`, ~line 745): `ComboWrench`, `Screwdriver`, `Pliers`
  (jaws cross at a visible pivot), `ClawHammer`, `TapeMeasure`, `AdjustableWrench`,
  `Handsaw`, coiled cord w/ plug. Each wrapped in an `at(x,y,scale, <El/>)` scaler.
  Ledge shelf holds a spray can, a jar of screws, a cardboard box, + `LedgeLevel`.
- **BenchClutter** (~line 1000+): the dev board, the small servo, the parts bin,
  the soldering station, the far-left Arduino/breadboard cluster, the dock +
  cabling. Helpers: `tube(points,r,color,key)` (CatmullRom cable), `Plug`
  (chunky two-prong block), `ChargingBlock` (two-prong power brick, `PRONG_DX`
  =0.03, default dark `#24262d`, `color` prop), `Dock` (`DOCK_PORTS=[-0.17,0,0.17]`,
  front-facing charger sockets — **needs TOP sockets per §0.8**), `CanadianOutlet`
  (ivory duplex, faint self-lit plate), `PinHeader`, `Screw`/`Nut`/`Washer`,
  `makePcbTex` (green PCB w/ traces/pads/silkscreen "SO-DEV rev.C").
- **Dev board** (green PCB the arm works over): local `[0.98,0.02,0.55]` rot
  `[0,0.3,0]`, ~x[0.57,1.46] z[0.27,0.83]. Has QFP MCU w/ gold legs, seated pin
  headers, small blue/purple caps, banded resistors, crystal, reset button, LEDs.
- **Small servo:** local `[1.28,0.02,1.02]` rot `[0,-0.5,0]` (shrunk + moved
  clear of the board after it was a huge clipping box).
- **Parts bin:** local `[1.82,0.02,0.48]` rot `[0,-0.2,0]`. Open compartment tray
  with `Screw`/`Nut`/`Washer`/resistor/jumper hardware sorted in compartments.
- **Soldering station:** local `[2.62,0.02,0.82]` rot `[0,-0.4,0]` — teal Weller-
  style unit + black holder tray + iron. **He dislikes it (see §0.3).**
- **Cabling / dock (BenchClutter, ~line 1330):** `Dock` at local `[0.1,0,-0.72]`.
  Telemetry monitor's `ChargingBlock` seated at its front socket, cable draped
  behind the base. Off-monitor's `ChargingBlock` sits UNPLUGGED in the open near
  the arm at `[-0.42,0,0.92]` (this is the About plug-in target). `CanadianOutlet`
  at local `[-0.5,-1.0,-1.42]` (world ≈ [-0.5,-0.6,-3.42]) with a faint plate +
  two soft `pointLight`s so it reads in the under-desk shadow; the dock's
  `cbl_pwr` cord drops to a 3-prong plug in it. **§0.7/§0.8 change this whole
  power story: top sockets + a clearly-plugged wall outlet beneath the table.**
- **Keep-out footprints (for cable routing, LOCAL frame):** off-monitor base
  x[-1.76,-1.14] z[-0.64,-0.32]; telemetry base x[-3.36,-2.74] z[-0.64,-0.32];
  mouse x[-1.2,-1.0] z[0.54,0.86]; dock x[-0.18,0.38] z[-0.85,-0.59]. Route
  cables AROUND these; make them genuinely wavy (multi-undulation), not one arc.

### `src/landing/Workstation.tsx`
Dual monitors (telemetry "on" + a dark "off" one): telemetry `[-3.05,0,-0.5]`
rot `[0,0.16,0]`, off `[-1.45,0,-0.5]` rot `[0,-0.16,0]` — a real gap + toed IN
toward each other. `Keyboard`, `Mouse` (`[-1.1,0,0.7]`, **needs the §0.1 rebuild**),
and a `Connector` component (now unused). Each Monitor has a short cable stub out
its back; the full routing lives in BenchClutter.

### `src/landing/Printer3D.tsx`
Code-built Ender-3 (aluminium frame, heated bed, X-gantry). `gz=1.02` gantry
height; the print head glides x within the part's footprint; a **teal partial
print** (`PRINT='#39c6b6'`, brim + layer stack + half-finished top layer) sits on
the bed = "actually printing." **This teal print may be the "giant green box"
(§0.2) — check.**

### `src/landing/Outdoors.tsx` / `Window.tsx` / `textures.ts` / `armState.ts`
Rainy-dawn matte scene through a real 6-pane window (lightning sets
`weather.flash`). Procedural canvas textures. `armState` is the shared object the
arm writes each frame and the telemetry monitor reads.

### GLB assets — `public/models/` (built by `assets-src/blender/*.py`)
- `basketball.glb` ← `ball.py`. **Correct real seam layout:** a horizontal
  equator + a vertical centre line (both great circles → read straight) + TWO
  CONCAVE side seams that are OFFSET small circles tilted off the view axis, so
  each bows OUTWARD and pinches nearest the centre at the equator (NO pole
  convergence, NO wavy belt, NOT perfect circles on the outer two). Pebble via
  noise displace. Ekam iterated on this ~8 times — the current version is
  approved. Run: `Blender -b -P ball.py -- --render` (writes `_preview_ball.png`)
  and `--export`. **Export uses `export_yup=False`** (keeps the Y-up authoring).
- `sneaker.glb` ← `shoe.py`. Adidas Samba/Gazelle three-stripe: lofted subdivision
  upper (heel/collar, ankle throat dip, toe spring), gum sole, three side stripes,
  laces, tongue, dark ankle opening. Blue upper. Loaded via `useGLTF` + `Suspense`.
- `pc.glb`, `printer.glb` are UNUSED (rebuilt in R3F). Blender `pc.py`/`printer.py`/
  `workbench.py` are reference only.
- Load pattern in Stage.tsx: `useModel(url)` clones the GLB + enables shadows;
  `Basketball`/`Sneaker` are `<primitive>` wrappers with scale (ball 0.34,
  sneaker 0.4), wrapped in `<Suspense fallback={null}>`.

---

## 5. The arm — `src/components/arm/So101Arm.tsx`

- Real **SO-ARM101** from URDF + 13 STL (`public/so101/`) via `urdf-loader` +
  STLLoader. Re-skinned to `#dbe2ee` body + `#262b34` servos. `scale=4.8`,
  `position={[-0.026,0.168,-0.153]}`. **Currently** `rotation={[-Math.PI/2,0,Math.PI]}`
  (the base-flip experiment) — **REVERT to `[-Math.PI/2,0,0]`** per §0.4.
- The base feet meshes (`waveshare_mounting_plate`, `base_motor_holder`,
  `base_so101_v2`) are set `visible=false` (~line 165). §0.5: bring back the two
  little foot stands.
- **Kinematics ground-truth (VERIFIED live — do not re-derive):** joints
  `Rotation, Pitch, Elbow, Wrist_Pitch, Wrist_Roll, Jaw` (radians).
  - Rotation: + toward viewer/right, − toward window/left.
  - Pitch: 0 = upper-arm vertical, − leans it forward.
  - **Elbow: −1.7 = straight, 0 = fully folded** (negative extends).
  - Wrist_Pitch: − tilts head up, + down. Wrist_Roll: cocks head. Jaw: open amt.
  - Empirically after the flip, at Rotation≈0 + forward lean the gripper reaches
    forward over the dev board (gripZ≈-1.46 vs base z≈-2.15). FK varies a lot with
    pose — verify each target pose with `setJointValue` + `getWorldPosition`.
- **Current motion = continuous organic fBm noise** (`ORG_REST + ORG_AMP*energy*
  fbm + breathe`, plus a lightning `STARTLE` flinch and an exact-FK floor guard
  `CLEARANCE=0.48` that bisects toward `SAFE`). There is ALSO an unused keyframe
  scheduler (`BEHAVIORS`, `pickBehavior`, `nextSeg`) and an unused ignition
  choreography scaffold (`ignition.ts`, `IGN_POSE`).
- **Ekam dislikes the current motion.** The `ORG_REST` head-down pose = the
  "drooping" he hates. See §6.

---

## 6. Luxo motion + idle plan (Phase 1 — the current big task)

Decisions gathered from Ekam this session (all in the interaction-vision memory):
- **Personality:** a MIX, mostly *balanced*, some *subtle/professional*, only a
  little *playful/curious* (that one is the gimmick risk — keep it restrained).
- **Never drooping. Carry upright / "looking straight up." Natural. Flowy —
  never snap-move-hold.** Continuous life so it's never frozen (breathe/drift/
  gaze underlay), plus REAL purposeful idle tasks, plus a lightning startle.
- **Real idle tasks he approved (must be BIG + clearly visible, not tiny/vague):**
  (a) **inspect a part** — grab a board/part off the bench, lift it near the
  "head", slowly rotate to examine, set it back; (b) **plug/unplug the connector**;
  (c) **press/poke the board** + react to an LED. He rejected "turn the servo
  horn" (servo far too tiny). "Tinker" must be genuine grab/press/place, not
  hovering above the board. Take time, double-check every motion in preview
  (`__pause` + `setJointValue`).
- Suggested tech approach (not yet built): a spring/IK-driven target system with
  an action scheduler that BLENDS smoothly between an upright idle underlay and
  discrete task "clips" (eased, no snapping). Keep the exact-FK floor guard.

---

## 7. Interaction & experience plan (decided, NOT built yet)

- **Two modes, same origin:** the 3D scene is default; a persistent **"Skip to
  site" button at the bottom** swaps to a fast **2D editorial site** (dark navy +
  muted white/grey, subtly robotic, subtle life, simple/cohesive), which has a
  "Back to scene" toggle.
- **5 clickable hotspots → dark frosted-glass OVERLAY PANELS** (over a dimmed/
  blurred scene). The old "everything dives into the monitor" plan is SCRAPPED.
  - **Projects = dev board** → arm FULL manipulation (plug/press) then overlay.
  - **About = the dark monitor** → arm picks up the loose charging cable/brick and
    plugs it into the deck to "boot," then overlay. (Arm does NOT reach the
    monitor itself — it plugs into the deck.)
  - **Résumé = papers on the tool chest** → camera push-in + highlight (no arm,
    out of reach).
  - **Hobbies = ball + Dunks** → camera push-in + highlight (no arm).
  - **Contact = a taped "open to internships" note on the pegboard** → camera +
    highlight.
- **Affordance:** an understated custom scene cursor; hovering a hotspot = teal
  rim-glow + a game-style sparkle + cursor change.
- Build order: (1) arm base-revert + feet + Luxo motion + idle life [current],
  (2) interaction plumbing (raycast hotspots, cursor, hover glow, click→sequence
  →overlay, dark-glass panel), (3) fill 5 overlays w/ content + the Contact note,
  (4) 2D editorial site + switch button, (5) polish/sound/mobile.

---

## 8. Original site content (for the editorial site later)

- **Identity:** Ekam Kooner · Calgary → Vancouver · ekooner656@gmail.com ·
  linkedin.com/in/ekam-kooner/ · github.com/Ekko656 · devpost.com/ekooner656 ·
  ekamkooner.com. Assets in `public/` (headshot.jpg, resume.pdf, projects/*).
- **About (validated copy, reuse):** "Who is engineering for? … Most of what gets
  built today is built for the people who need it least… the older person who
  can't reach the top shelf… the hospital short on night staff… the parent who
  needs an extra set of hands. This is why I'm in Biomedical Engineering at UBC.
  This is why I'm aiming at humanoid robotics — Tesla Optimus specifically. Not
  for the technology. For who the technology is able to serve." Interests: 🏐
  Volleyball, 🏀 NBA, 🎮 League, 🎵 Drake, 🥊 Boxing.
- **Projects (keep order):** 1) Arm Sim (7-DOF MuJoCo, NumPy FK/Jacobian/DLS IK,
  verified 1e-6m; github.com/Ekko656/arm-sim). 2) Barrage (concurrent API load
  tester; Java/Spring Boot). 3) HoneyKey (honeypot API + attacker classification;
  nwHacks Best Cybersecurity finalist; Python/FastAPI/MITRE ATT&CK). 4) UBC
  Bionics (trans-radial prosthetic, Rust/PyO3/STM32/I²C, CYBATHLON 2028). 5) VEX
  Robotics (autonomous nav, Alberta #1, Worlds; C++/PID/Pure Pursuit). 6)
  Ultrasonic Claw (Arduino). 7) Arduino RC Car.
- **Résumé highlights:** Embedded SWE @ UBC Bionics (Rust↔Python via PyO3, −97.5%
  latency, I²C BMS). Robotics SWE @ WCHS VEX (odometry/PID/pure-pursuit, lead,
  Worlds). Skills: Rust/C/C++/Python/Java/JS-TS, PID, EMG, Fusion360.
- **Contact:** "Let's talk." · "Open to internships, Summer 2026."

---

## 9. Working-style / feedback patterns (READ — Ekam is exacting)

- **NEVER low-poly / boxes+cylinders mushed together.** Extremely detailed +
  intentional + realistic. Use real reference images (he responds to it) and/or
  Blender for organic/complex props. This is THE recurring flashpoint.
- **Clipping is a recurring anger source.** Nothing may intersect anything. Route
  cables/props against each object's ACTUAL footprint (documented in §4), not by
  eye. Verify in-preview from close angles every time.
- **Go in the exact order he lists things.** Refine what exists before adding.
- **Always commit AND push** after meaningful changes.
- Concrete opinionated options over vague questions; when he says "you decide,"
  decide and show a result. Don't re-litigate rejected directions (§10).
- He iterates HARD; matching jesse-zhou / bruno-simon intentional cohesion is the
  bar. Verify in-preview before claiming anything is done.

---

## 10. Rejected directions — DO NOT re-propose

Stock sci-fi kit ("MegaLab"); cozy/tan "house" palette; fairy/LED string lights;
a glowing arc-reactor hero; low-poly primitive-built shoes/ball/props; the arm
moving move-to-pose-then-hold (rigid) OR drooping head-down; blind full-machine
Blender assembly ("mash of parts"); leaving temp/oversized inspection props in
the live scene; the "single gateway = dive into the monitor" interaction.

---

## 11. Reference materials

- **Downloaded references (this session)** in the scratchpad
  `/private/tmp/claude-501/-Users-ekam/7882187d-8baa-4d42-a235-20e3f05f9238/scratchpad/`:
  `ball_ref.png` (real basketball, Wikimedia), `shoe_ref.png` (Meshy "Blue Adidas
  Three-Stripe Sneaker" grey render), `solder_station.jpg` + `solder_iron.jpg`
  (Wikimedia Weller station + iron). Re-fetch from Wikimedia/Meshy if the
  scratchpad is gone.
- **jesse-zhou.com** (Kowloon ramen diorama) + **bruno-simon.com** — the craft
  bar (cohesive, intentional, baked-lit, small-payload).
- **Big Hero 6 "Hiro's garage"** — the art direction.
- Blender renders `_preview_ball.png` / `_preview_shoe.png` in `assets-src/blender/`.

---

## 12. Memory files (persist across chats, `~/.claude/projects/-Users-ekam/memory/`)

- `portfolio-3d-rebuild.md` — project: concept, pipeline, repo, locked decisions.
- `portfolio-3d-working-style.md` — the aesthetic bar + process rules (NEVER
  low-poly, use real meshes/Blender for organic props, verify-in-preview, never
  leave temp props, always push).
- `portfolio-3d-interaction-vision.md` — the full dual-experience + arm-life +
  hotspot decisions (§6/§7 here summarize it; that file has every Q&A decision).
- `portfolio-3d-active-tasklist.md`, `humanoid-arm-portfolio.md` — older / the
  separate MuJoCo Arm-Sim project. Index: `MEMORY.md`.
- Treat THIS HANDOFF.md as source of truth where older notes conflict.

---

## 13. Git history (high level, newest first)

`2abc15c` soldering station (Weller-style) → `89a8971` fix cable clipping + remove
mouse wire + under-desk outlet → `11f5e8a` power hub + wall outlet + wavy cables +
parts bin + mouse → `8b169b2` small servo + clean parts bin + tiny caps +
Apple-style charger → `1b2970f` dock + two-prong plugs + detailed dev board →
`cf88eec`/`c33ad41`/`de95210` basketball seam iterations + level + monitors gap →
`134f3af` ball+sneakers rebuilt as Blender GLBs + real pegboard tools + printer
prints → earlier: PC/printer/electronics/window/outdoors. `git log --oneline` for
the rest. **The base-flip in So101Arm.tsx is uncommitted and should be reverted.**
