export type Project = {
  id: string
  title: string
  tag: string
  blurb: string
  stack: string[]
  media?: { type: 'image' | 'video'; src: string }
  links: { label: string; href: string }[]
}

export const PROJECTS: Project[] = [
  {
    id: 'arm-sim',
    title: 'Arm Sim',
    tag: 'Simulation',
    blurb:
      'A 7-DOF humanoid arm in MuJoCo with forward kinematics, the Jacobian, and damped least-squares IK written from scratch in NumPy — verified against MuJoCo to within 1e-6 m across 50+ random poses.',
    stack: ['Python', 'NumPy', 'MuJoCo', 'MJCF'],
    media: { type: 'video', src: '/projects/arm-sim.webm' },
    links: [{ label: 'GitHub', href: 'https://github.com/Ekko656/arm-sim' }],
  },
  {
    id: 'ubc-bionics',
    title: 'UBC Bionics',
    tag: 'Embedded',
    blurb:
      'Embedded software for a trans-radial prosthetic arm — the Rust codebase handling the lower-level systems work, in preparation for CYBATHLON 2028.',
    stack: ['Rust', 'PyO3', 'STM32', 'I²C'],
    media: { type: 'image', src: '/projects/ubcbionics.png' },
    links: [
      { label: 'BEAR UBC', href: 'https://github.com/BEARUBC' },
      { label: 'Website', href: 'https://www.ubcbionics.com/' },
    ],
  },
  {
    id: 'honeykey',
    title: 'HoneyKey',
    tag: 'Security',
    blurb:
      'A honeypot API that logs and classifies attacker behavior in real time, then generates SOC-style reports. Built in a weekend at nwHacks — Best Cybersecurity Hack finalist.',
    stack: ['Python', 'FastAPI', 'SQLite', 'MITRE ATT&CK'],
    media: { type: 'image', src: '/projects/honeykey.png' },
    links: [
      { label: 'GitHub', href: 'https://github.com/Ekko656/HoneyKey' },
      { label: 'Devpost', href: 'https://devpost.com/software/honeykey' },
    ],
  },
  {
    id: 'barrage',
    title: 'Barrage',
    tag: 'Backend',
    blurb:
      'A concurrent API load tester that fires thousands of simultaneous requests and visualizes response times in a live dashboard — useful for finding the exact point an API starts to break.',
    stack: ['Java', 'Spring Boot', 'JUnit 5', 'jQuery'],
    media: { type: 'image', src: '/projects/barrage.png' },
    links: [
      { label: 'GitHub', href: 'https://github.com/Ekko656/barrage' },
      { label: 'Live Demo', href: 'https://barrage-0ajs.onrender.com/' },
    ],
  },
  {
    id: 'vex',
    title: 'VEX Robotics',
    tag: 'Robotics',
    blurb:
      "Autonomous navigation for my high school's VEX team across two years — Alberta's top-ranked team, competing at the World Championship in Dallas.",
    stack: ['C++', 'PID', 'Pure Pursuit', 'Odometry'],
    media: { type: 'image', src: '/projects/vex.png' },
    links: [
      { label: 'GitHub', href: 'https://github.com/dependra123/3300F2023-2024-code' },
    ],
  },
  {
    id: 'claw',
    title: 'Ultrasonic Claw',
    tag: 'Hardware',
    blurb:
      'An Arduino-powered metal claw that uses an ultrasonic sensor to detect nearby objects, clamps for a few seconds, then releases — hand-modeled CAD and a custom control loop.',
    stack: ['Arduino', 'C++', 'HC-SR04', 'Fusion 360'],
    media: { type: 'image', src: '/projects/claw.jpg' },
    links: [],
  },
  {
    id: 'rc-car',
    title: 'Arduino RC Car',
    tag: 'Hardware',
    blurb:
      'A Bluetooth-controlled RC car with dual drive servos and a phone controller app. Won first place in a high-school battlebot competition and set the school item-collection record.',
    stack: ['Arduino', 'C++', 'HC-05', 'Servos'],
    media: { type: 'image', src: '/projects/rc-car.jpg' },
    links: [],
  },
]
