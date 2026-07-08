import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'
import ProjectCard from '../components/ProjectCard'
import { PROJECTS } from '../data/projects'

export default function Projects() {
  return (
    <section id="projects" className="shell scroll-mt-20 py-28 md:py-36">
      <Reveal>
        <SectionHeader eyebrow="Work" title="Things I've built" />
      </Reveal>
      <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </Reveal>
    </section>
  )
}
