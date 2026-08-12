import type { Strike } from '@/lib/synth'

/**
 * The strike train, drawn. This is the same array the resonators are driven with —
 * the audible version of the trace view, and the reason the lab is not a set of
 * knobs attached to a black box (PRD §5.7).
 */
const WIDTH = 900
const HEIGHT = 70

export function ExcitationTrace({
  strikes,
  durationSec,
  label,
}: {
  strikes: readonly Strike[]
  durationSec: number
  label: string
}) {
  return (
    <figure className="space-y-2">
      <figcaption className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-faint">
        {label} · {strikes.length}
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full rounded border border-stage-line bg-stage-raised/70"
        role="img"
        aria-label={label}
      >
        <line x1={0} y1={HEIGHT - 8} x2={WIDTH} y2={HEIGHT - 8} className="stroke-stage-strong" />
        {Array.from({ length: Math.floor(durationSec) + 1 }, (_, second) => (
          <line
            key={second}
            x1={(second / durationSec) * WIDTH}
            y1={HEIGHT - 12}
            x2={(second / durationSec) * WIDTH}
            y2={HEIGHT - 4}
            className="stroke-stage-strong"
          />
        ))}
        {strikes.map((strike, index) => {
          const x = (strike.timeSec / durationSec) * WIDTH
          // Height is strength, so the settling of the shake is visible.
          const height = 6 + strike.strength * (HEIGHT - 22)
          return (
            <line
              key={index}
              x1={x}
              y1={HEIGHT - 8}
              x2={x}
              y2={HEIGHT - 8 - height}
              strokeWidth={2}
              className="stroke-sounding"
            />
          )
        })}
      </svg>
    </figure>
  )
}

/** Peak envelope of a rendered buffer. Shows what the strike train turned into. */
export function WaveformTrace({
  peaks,
  label,
}: {
  peaks: readonly number[]
  label: string
}) {
  const height = 90
  const middle = height / 2

  return (
    <figure className="space-y-2">
      <figcaption className="font-mono text-[0.68rem] uppercase tracking-widest text-ink-faint">
        {label}
      </figcaption>
      <svg
        viewBox={`0 0 ${peaks.length} ${height}`}
        preserveAspectRatio="none"
        className="h-24 w-full rounded border border-stage-line bg-stage-raised/70"
        role="img"
        aria-label={label}
      >
        {peaks.map((peak, index) => (
          <line
            key={index}
            x1={index + 0.5}
            y1={middle - peak * middle}
            x2={index + 0.5}
            y2={middle + peak * middle}
            className="stroke-bamboo"
            strokeWidth={1}
          />
        ))}
      </svg>
    </figure>
  )
}
