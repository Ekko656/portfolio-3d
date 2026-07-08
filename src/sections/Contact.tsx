import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'
import Magnetic from '../components/Magnetic'

const LINKS = [
  { label: 'Email', href: 'mailto:ekooner656@gmail.com', handle: 'ekooner656@gmail.com' },
  { label: 'GitHub', href: 'https://github.com/Ekko656', handle: 'github.com/Ekko656' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/ekam-kooner/', handle: 'in/ekam-kooner' },
]

export default function Contact() {
  return (
    <section id="contact" className="shell scroll-mt-20 py-28 md:py-36">
      <Reveal>
        <SectionHeader eyebrow="Contact" title="Let's build something" />
      </Reveal>

      <Reveal stagger className="panel overflow-hidden p-8 md:p-12">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <p className="max-w-md font-display text-xl leading-snug text-ink md:text-2xl">
            Reach out about robotics, embedded systems, internships, or whatever
            you're building.
          </p>
          <Magnetic>
            <a
              href="mailto:ekooner656@gmail.com"
              data-interactive
              className="inline-flex items-center gap-2 rounded-md bg-ink px-6 py-3 font-sans text-xs uppercase tracking-[0.18em] text-base transition-opacity hover:opacity-90"
            >
              say hello →
            </a>
          </Magnetic>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-lg border border-hair sm:grid-cols-3">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              data-interactive
              className="group bg-surface/40 p-5 transition-colors hover:bg-surface-2/60"
            >
              <div className="label mb-2 transition-colors group-hover:text-accent">
                {l.label}
              </div>
              <div className="font-sans text-sm text-ink">{l.handle}</div>
            </a>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-2 font-sans text-xs text-muted">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          Open to internships · Summer 2026
        </div>
      </Reveal>

      <footer className="mt-16 flex items-center justify-between border-t border-hair pt-6 font-sans text-xs text-muted">
        <span>© 2026 Ekam Kooner</span>
        <span>Calgary → Vancouver</span>
      </footer>
    </section>
  )
}
