# Ekam Kooner — Portfolio Site Context

This file collects all the public content on the portfolio site
(`ekamkooner.com` / `github.com/Ekko656/portfolio`) in one place — every page,
every project, the résumé, contact info, etc.

---

## Identity

- **Name:** Ekam Kooner
- **Location:** Calgary → Vancouver
- **Email:** ekooner656@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/ekam-kooner/
- **GitHub:** https://github.com/Ekko656
- **Devpost:** https://devpost.com/ekooner656
- **Site:** https://ekamkooner.com
- **Repo:** https://github.com/Ekko656/portfolio

---

## Landing page

- Greeting (Indie Flower): **"Hey, I'm Ekam"** (last word in violet)
- Bio: *Biomedical Engineering (Robotics) student at UBC.*
- Headshot photo in a circular frame
- Nav pills (each with its own animated SVG underline on hover):
  - **about** — wave underline
  - **projects** — zigzag underline
  - **resume** — straight line that grows from center
  - **contact** — double swoosh
- Bobbing chevron down to scroll to the rest

---

## About page

A scroll journey through 11 "moments" (mostly centered, a few gently asymmetric)
with reveal animations, hand-drawn underlines, and an orb-trail connector
between moments.

### Moment 1 — center, hand 96, plum, with hand-drawn underline
> Who is engineering for?

### Moment 2 — left
> It's a question I keep coming back to.

### Moment 3 — right
> Most of what gets built today
> is built for **the people who need it least.**

### Moment 4 — left, muted
> Faster trading algorithms.
> Sharper ad targeting.
> Another delivery app.
>
> *Sharp minds, pointed at the easiest problems with the loudest payouts.*

### Moment 5 — center, hand 80, with underline
> I want to spend my life
> pointed **somewhere else.**

### Moment 6 — left
> At the **older person** who can't reach the top shelf anymore.
> At the **hospital** running short on night staff.
> At the **parent** who needs an extra set of hands.

### Moment 7 — right
> This is why I'm in *Biomedical Engineering* at *UBC*.
> This is why I'm aiming at **humanoid robotics.**
> ***Tesla Optimus,*** *specifically.*

### Moment 8 — center
> Not for the technology.
> For who the technology is **able to serve.**

### Moment 9 — center, hand 104, plum, with hand-drawn underline (closing thesis)
> Everything I build comes back to that.
> **Engineering with purpose.**

### Moment 10 — center, small
> If you read this far, *thank you.*

### Interests aside ("off the clock — When I'm not building")
Big gradient card with chips, each with an emoji:
- 🏐 Volleyball
- 🏀 NBA
- 🎮 League of Legends
- 🎵 Drake
- 🥊 Boxing

### CTA at the bottom of About
- Pill button: **"Let's talk →"** routing to `/contact`

---

## Projects (grid order — row 1, row 2, row 3)

### Row 1

#### 1. Arm Sim — tag: Simulation
- **Description:** A 7-DOF humanoid arm simulated in MuJoCo, with the forward
  kinematics, Jacobian, and damped least-squares IK written from scratch in
  NumPy. Cross-verified against MuJoCo to within 1e-6 m across 50+ random poses.
- **Stack:** Python, NumPy, MuJoCo, MJCF
- **Media:** Demo video (`arm-sim.webm`) used as both the card preview poster
  and the modal media.
- **Links:** GitHub — https://github.com/Ekko656/arm-sim

#### 2. Barrage — tag: Backend
- **Description:** A concurrent API load tester that fires thousands of
  simultaneous requests and visualizes response times in a live dashboard.
  Useful for finding the exact point an API starts to break.
- **Stack:** Java, Spring Boot, JUnit 5, jQuery
- **Media:** Dashboard screenshot (`barrage.png`).
- **Links:**
  - GitHub — https://github.com/Ekko656/barrage
  - Live Demo — https://barrage-0ajs.onrender.com/

#### 3. HoneyKey — tag: Security
- **Description:** A honeypot API that logs and classifies attacker behavior in
  real time, then generates SOC-style reports. Built in a weekend at nwHacks,
  finished as a Best Cybersecurity Hack finalist.
- **Stack:** Python, FastAPI, SQLite, MITRE ATT&CK
- **Media:** Dashboard screenshot (`honeykey.png`) on the card; embedded YouTube
  demo in the modal (`https://www.youtube.com/embed/37EOq--P9oo`).
- **Links:**
  - GitHub — https://github.com/Ekko656/HoneyKey
  - Devpost — https://devpost.com/software/honeykey

### Row 2

#### 4. UBC Bionics — tag: Embedded
- **Description:** Embedded software for a trans-radial prosthetic arm. Working
  on the Rust codebase that handles the lower-level systems work.
- **Stack:** Rust, PyO3, STM32, I²C
- **Media:** Prosthetic arm photo (`ubcbionics.png`) on the card; local demo
  video (`ubc-bionics.mp4`) in the modal.
- **Links:**
  - GitHub (BEAR UBC org) — https://github.com/BEARUBC
  - Website — https://www.ubcbionics.com/

#### 5. VEX Robotics — tag: Robotics
- **Description:** Built autonomous navigation for my high school's VEX team
  across two years. We finished as Alberta's top-ranked team and competed at
  the World Championship in Dallas.
- **Stack:** C++, PID, Pure Pursuit, Odometry
- **Media:** Robot photo (`vex.png`) framed on the robot + award plates.
- **Awards (shown in modal):**
  - **VEX Robotics Tournament Champion** — Awarded for excellence in robot
    design, programming, and competition strategy. Contributed to both
    technical development and team collaboration to achieve first place.
  - **VEX Robotics Judges Award** — Effectively showcased perseverance,
    creativity, and collaboration as a team. Recognized for our well-rounded
    and complex robot by a team of qualified judges in the engineering field.
  - **VEX Robotics Design Award** — Recognized for engineering skills and
    innovations that led to having the best-designed robot at a local
    competition open to teams throughout Alberta & Saskatchewan.
  - **Top 15 Mecha Mayhem Finalist** — Top 15 finalist at Mecha Mayhem,
    Canada's largest international competition involving over 260 teams from
    China, Australia, UK, Brazil and more. A Robotics World Championship
    qualifying tournament. Showcased exceptional team dynamics and personally
    applied complex autonomous functions to lead the team to a top 15 spot.
- **Links:** GitHub — https://github.com/dependra123/3300F2023-2024-code

#### 6. Ultrasonic Claw — tag: Hardware
- **Description:** A small Arduino-powered metal claw that uses an ultrasonic
  sensor to detect nearby objects, clamps onto them for a few seconds, then
  releases. A class project built with a hand-modeled CAD design and a custom
  control loop on the Arduino.
- **Stack:** Arduino, C++, Ultrasonic (HC-SR04), Fusion 360
- **Media:** Fusion 360 CAD render (`claw.jpg`) on a white card; demo video
  (`claw.mp4`) in the modal.
- **Links:** *(none — class project)*

### Row 3

#### 7. Arduino RC Car — tag: Hardware
- **Description:** An Arduino-driven RC car with a Bluetooth module paired to
  a phone controller app and dual servos for drive. Won first place in a high
  school battlebot competition and set the school record for item collection
  during the event.
- **Stack:** Arduino, C++, Bluetooth HC-05, Servos
- **Media:** Photo (`rc-car.jpg`).
- **Links:** *(none — older high-school project)*

---

## Résumé (`/resume.pdf` — embedded on the Résumé page)

Header: **Ekam Kooner** · ekooner656@gmail.com · linkedin.com/in/ekam-kooner ·
github.com/Ekko656 · devpost.com/ekooner656

### Skills
- **Languages:** Rust, C, C++, Python, Java, Javascript/Typescript
- **Tools:** Matlab, Git, Fusion360, Solidworks, Altium, STM32CubeIDE, Spring
  Boot, RESTful APIs
- **Embedded Systems:** PID control, Odometry, EMG Signal Processing

### Experience

**Embedded Software Engineer, UBC Bionics** — September 2025 – Present
- Aided development of EMG-controlled trans-radial prosthetic arm in
  preparation for CYBATHLON 2028 as a member of the Electrical/Embedded
  subteam.
- Implemented a complete Rust-to-Python interface using PyO3 and maturin,
  enabling the core Rust codebase to be referenced directly from Python.
- Reduced inter-layer communication latency by 97.5% from 2 ms to 50 ns by
  migrating from an SGCP protobuf over MPSC channels to direct Python bindings
  using PyO3.
- Engineered Rust-based I²C multiplexing and fault-detection modules for a
  custom BMS, integrating a TCA9548A switch and dual MAX17049 fuel gauges to
  enforce strict safety cutoffs across a 2S2P lithium-ion array.

**Robotics Software Engineer, WCHS VEX Robotics** — April 2023 – May 2025
- Developed autonomous C++ routines using odometry, IMU, and gyroscope data to
  achieve high-precision navigation and reliable pose estimation.
- Implemented and tuned PID controllers and holonomic drive algorithms to
  stabilize drivetrain motion and improve trajectory accuracy.
- Optimized carrot-curve pathfinding for autonomous routines using a custom
  pure-pursuit algorithm.
- Technical Team Lead for Alberta's #1 VEX Robotics team, overseeing 10
  members & leading autonomous programming while competing internationally at
  the VEX World Championship in Dallas, Texas.

### Projects (résumé writeups)

**HoneyKey — Honeypot API Security System** *(Best Cybersecurity Hack Finalist @ nwHacks)*
- Built FastAPI backend with 24 REST endpoints, implementing middleware for
  request interception and structured telemetry logging.
- Designed SQLite schema (4 tables) and optimized queries to transform raw
  HTTP traffic into incidents.
- Developed SOC-style report generation pipeline producing structured outputs
  (severity, evidence, actions) from aggregated request telemetry.
- Mapped attacker behavior to 5+ MITRE ATT&CK techniques using request pattern
  analysis (enumeration, credential access, scanning) for standardized threat
  classification.

**Barrage — API Load Testing & Performance Monitor**
- Built a concurrent API load tester in Java 17 and Spring Boot, using
  ExecutorService thread pools and RESTful endpoints to fire and measure
  simultaneous requests.
- Implemented a JUnit 5 test suite for QA validation, covering failure
  handling, thread-safety, and edge cases across concurrent execution
  scenarios.
- Developed a real-time dashboard in HTML5, CSS, and jQuery visualizing
  response timelines, status codes, and pass/fail rates against a Spring Boot
  backend.
- Ensured thread-safe orchestration using AtomicInteger and CountDownLatch,
  computing throughput and failure rates across configurable concurrency
  levels.

### Education

**University of British Columbia — Bachelor of Applied Science** — September 2025 – Present

---

## Contact page

- Title (Indie Flower, plum) with hand-drawn animated underline: **"Let's talk."**
- Intro line: *Reach out about robotics, embedded systems, internships, or
  whatever you're building.*
- Availability badge with a pulsing dot: **"Open to internships, Summer 2026"**
- Links (each with a brand icon + left-to-right grow underline on hover):
  - ✉ ekooner656@gmail.com — `mailto:ekooner656@gmail.com`
  - 💼 LinkedIn — https://www.linkedin.com/in/ekam-kooner/
  - 🐙 GitHub — https://github.com/Ekko656
- Footer line: **© 2025 Ekam Kooner · Calgary → Vancouver**

---

## Honors (from LinkedIn, shown inside the VEX modal)

- VEX Robotics Tournament Champion
- VEX Robotics Judges Award
- VEX Robotics Design Award
- Top 15 Mecha Mayhem Finalist
- *(HSEC is on LinkedIn but is not VEX-related and not shown here)*

---

## Site stack / visual identity

- **Framework:** React 18 + Vite + React Router (multi-page).
- **Pages:** `/` (Landing), `/about`, `/projects`, `/resume`, `/contact`. Vercel
  SPA rewrite in `vercel.json` routes deep links to `index.html`.
- **Fonts:** Indie Flower (display), Nunito (body), Caveat (accent), JetBrains
  Mono (code/chips).
- **Palette:** soft lavender background dominant, white as the secondary
  surface (cards), violet `#7e60b0` / plum `#5a4684` for emphasis, blush
  accent.
- **Background:** four slow-drifting blurred lavender/blush blobs (`Backdrop`)
  plus a field of small floating orbs (`Sparkles`) on every page; orbs travel
  small closed loops at constant speed for a calm consistent drift.
- **Cursor:** small lavender orb with a tiny faint glow halo; a
  `mix-blend-mode: color` disc recolors text it passes over to deep purple.
- **Logo:** sparkle in a lavender→violet gradient rounded square, used in the
  nav and as the favicon.
