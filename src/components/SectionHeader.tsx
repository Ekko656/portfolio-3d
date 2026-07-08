type Props = {
  eyebrow: string
  title: string
}

/** Section heading: an accent-node eyebrow over a large title — no slash motifs. */
export default function SectionHeader({ eyebrow, title }: Props) {
  return (
    <div className="mb-12">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-5 inline-block font-display text-3xl font-bold tracking-tightest text-ink md:text-5xl">
        {title}
        <span className="mt-3 block h-px w-full origin-left bg-gradient-to-r from-accent to-transparent" />
      </h2>
    </div>
  )
}
