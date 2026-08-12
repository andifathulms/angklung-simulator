import { memo } from 'react'
import type { AngklungSpec } from '@/lib/synth'

/**
 * A drawn angklung. Tube lengths are genuinely graduated: a pipe's length goes as
 * 1/f, so the shape on screen is the instrument's physical logic rather than a
 * decorative ramp.
 *
 * Colour carries exactly one meaning each (PRD §8): bamboo is a tube at rest,
 * sounding is a tube ringing, muted is a tube held under tengkep — visibly present
 * and visibly silent.
 */

/** Longest tube in the whole set fills the frame; everything else is drawn against it. */
export const FRAME_HEIGHT = 160
const FRAME_WIDTH = 54
const TUBE_WIDTH = 13
const TUBE_GAP = 5

export interface AngklungFigureProps {
  readonly angklung: AngklungSpec
  /** 0–1 against the whole set, so the rack graduates across instruments too. */
  readonly relativeLength: number
  readonly sounding: boolean
  readonly tengkep: boolean
  /**
   * Let the parent size it. Without this the figure is a fixed 54px, and eight of
   * them overflow a narrow phone — which is exactly where the hero has to work.
   */
  readonly className?: string
}

function AngklungFigureBase({
  angklung,
  relativeLength,
  sounding,
  tengkep,
  className,
}: AngklungFigureProps) {
  // Within one angklung, tubes are drawn against each other by 1/f as well, so an
  // octave tube really is half the length of its tabung dasar.
  const longestHz = Math.min(...angklung.tabung.map((tabung) => tabung.hz))
  const overall = 0.42 + 0.58 * relativeLength

  const tubes = angklung.tabung.map((tabung, index) => ({
    tabung,
    height: FRAME_HEIGHT * overall * (longestHz / tabung.hz),
    x: index * (TUBE_WIDTH + TUBE_GAP),
  }))

  const totalWidth = tubes.length * TUBE_WIDTH + (tubes.length - 1) * TUBE_GAP
  const offsetX = (FRAME_WIDTH - totalWidth) / 2

  return (
    <svg
      viewBox={`0 0 ${FRAME_WIDTH} ${FRAME_HEIGHT + 14}`}
      {...(className === undefined ? { width: FRAME_WIDTH, height: FRAME_HEIGHT + 14 } : {})}
      aria-hidden="true"
      className={className === undefined ? 'overflow-visible' : `overflow-visible ${className}`}
    >
      {/* Rattan lashing across the top — what the tubes hang from. */}
      <rect x={2} y={0} width={FRAME_WIDTH - 4} height={5} rx={2} className="fill-rattan" />

      <g transform={`translate(${offsetX}, 5)`}>
        {tubes.map(({ tabung, height, x }, index) => {
          const held = tengkep && tabung.mutedByTengkep
          const fill = held ? 'fill-muted' : sounding ? 'fill-sounding' : 'fill-bamboo'
          return (
            <g key={`${tabung.role}-${index}`}>
              <rect
                x={x}
                y={0}
                width={TUBE_WIDTH}
                height={height}
                rx={TUBE_WIDTH / 2}
                className={`${fill} transition-[fill] duration-200`}
                opacity={held ? 1 : sounding ? 1 : 0.82}
              />
              {/* The cut at the top of the tube, where the air column opens. */}
              <path
                d={`M ${x} 5 L ${x + TUBE_WIDTH} 1 L ${x + TUBE_WIDTH} 8 L ${x} 12 Z`}
                className="fill-stage"
                opacity={0.55}
              />
              {/* The node the tube pivots on. */}
              <rect
                x={x - 1}
                y={height * 0.62}
                width={TUBE_WIDTH + 2}
                height={3}
                className="fill-rattan"
                opacity={0.8}
              />
            </g>
          )
        })}
      </g>

      {/* The base rail the tubes strike. This is where the sound comes from. */}
      <rect
        x={4}
        y={FRAME_HEIGHT + 6}
        width={FRAME_WIDTH - 8}
        height={5}
        rx={2}
        className={sounding ? 'fill-sounding' : 'fill-rattan'}
        opacity={sounding ? 0.9 : 1}
      />
    </svg>
  )
}

/*
 * Memoised because it is redrawn by things it does not depend on.
 *
 * Eight of these sit inside the hero and the rack, both of which re-render on
 * every animation frame while a melody plays — for the playhead, for the lit
 * set, for the position readout. The figure's props change only when a tube
 * starts or stops sounding, so without this it redraws eleven SVG elements
 * sixty times a second to produce an identical picture.
 *
 * All five props are primitives or a stable spec object, so the default shallow
 * comparison is exactly the right one.
 */
export const AngklungFigure = memo(AngklungFigureBase)
