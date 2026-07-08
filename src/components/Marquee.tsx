type Props = { items: string[] }

/**
 * Slim horizontal marquee that scrolls slowly and pauses on hover. The track is
 * duplicated so the -50% translate loops seamlessly. Static under reduced motion
 * (the animation utility is neutralized by the global media query).
 */
export default function Marquee({ items }: Props) {
  const track = [...items, ...items]
  return (
    <div className="group relative flex overflow-hidden border-y border-hair py-4">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-base to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-base to-transparent" />
      <div className="flex shrink-0 animate-marquee items-center group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-6 whitespace-nowrap px-6 font-sans text-sm text-muted"
          >
            {item}
            <span className="inline-block h-1 w-1 rounded-full bg-accent/60" />
          </span>
        ))}
      </div>
    </div>
  )
}
