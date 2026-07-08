import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'

const FACTS: [string, string][] = [
  ['Focus', 'Humanoid robotics'],
  ['Now', 'Embedded SWE at UBC Bionics'],
  ['Studying', 'Biomedical Eng. (Robotics), UBC'],
  ['Based', 'Calgary → Vancouver'],
  ['Open to', 'Internships, Summer 2026'],
]

export default function About() {
  return (
    <section id="about" className="shell scroll-mt-20 py-28 md:py-36">
      <Reveal>
        <SectionHeader eyebrow="Profile" title="About" />
      </Reveal>

      <div className="grid gap-14 md:grid-cols-[220px_1fr]">
        {/* Portrait */}
        <Reveal className="order-1">
          <div className="relative mx-auto w-40 md:mx-0 md:w-full md:max-w-[220px]">
            <div className="absolute -inset-3 -z-10 rounded-2xl bg-steel/15 blur-2xl" />
            <img
              src="/headshot.jpg"
              alt="Ekam Kooner"
              className="aspect-square w-full rounded-2xl border border-hair object-cover shadow-panel"
              loading="lazy"
            />
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              Available — Summer 2026
            </div>
          </div>
        </Reveal>

        <div className="order-2 space-y-10">
          <Reveal stagger className="max-w-2xl space-y-6">
            <p className="font-display text-2xl leading-snug text-ink md:text-[2rem] md:leading-[1.25]">
              Most of what gets built today is built for the people who need it
              least. I want to point my work{' '}
              <span className="text-sheen">somewhere else.</span>
            </p>
            <p className="text-base leading-relaxed text-muted">
              At the person who can't reach the top shelf anymore. At the
              hospital short on night staff. At the parent who needs an extra
              set of hands. That's why I'm in Biomedical Engineering at UBC, and
              why I'm aiming at humanoid robotics.
            </p>
            <p className="text-base leading-relaxed text-muted">
              Not for the technology — for who the technology is able to serve.
              Everything I build comes back to that:{' '}
              <span className="text-ink">engineering with purpose.</span>
            </p>
          </Reveal>

          <Reveal className="max-w-xl">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {FACTS.map(([k, v]) => (
                <div key={k} className="hair-rule flex flex-col pt-3">
                  <dt className="label mb-1">{k}</dt>
                  <dd className="text-sm text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
