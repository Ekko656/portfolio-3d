import Marquee from '../components/Marquee'

const SKILLS = [
  'Rust',
  'C / C++',
  'Python',
  'PID Control',
  'Odometry',
  'PyO3',
  'STM32',
  'MuJoCo',
  'NumPy',
  'ROS-style kinematics',
  'EMG Signal Processing',
  'Spring Boot',
  'Fusion 360',
  'Altium',
]

export default function Skills() {
  return (
    <section aria-label="Tools and skills" className="relative py-6">
      <Marquee items={SKILLS} />
    </section>
  )
}
