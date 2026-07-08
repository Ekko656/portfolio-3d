import { useEffect, useState } from 'react'
import Magnetic from './Magnetic'

const LINKS = [
  { label: 'about', href: '#about' },
  { label: 'projects', href: '#projects' },
  { label: 'contact', href: '#contact' },
]

export default function NavBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? window.scrollY / max : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="relative border-b border-hair bg-base/60 backdrop-blur-md">
        <nav className="shell flex h-16 items-center justify-between">
          <Magnetic strength={0.4}>
            <a
              href="#top"
              data-interactive
              className="font-sans text-sm font-medium tracking-tight text-ink"
            >
              <span className="text-accent">ekam</span>
              <span className="text-muted">.kooner</span>
            </a>
          </Magnetic>

          <ul className="flex items-center gap-1 md:gap-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Magnetic strength={0.3}>
                  <a
                    href={link.href}
                    data-interactive
                    className="block rounded-md px-3 py-2 font-sans text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </Magnetic>
              </li>
            ))}
            <li>
              <Magnetic strength={0.3}>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noreferrer"
                  data-interactive
                  className="ml-1 block rounded-md border border-hair px-3 py-2 font-sans text-xs uppercase tracking-[0.18em] text-ink transition-colors hover:border-accent/50 hover:text-accent"
                >
                  resume
                </a>
              </Magnetic>
            </li>
          </ul>
        </nav>

        {/* scroll progress hairline */}
        <div
          className="absolute bottom-0 left-0 h-px bg-gradient-to-r from-accent to-steel"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </header>
  )
}
