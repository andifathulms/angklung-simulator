import { centsBetween } from './cents'
import { pitchToHz } from './pitch'
import type { Laras, TuningDefinition } from './types'

/**
 * Comparing two laras degree-for-degree.
 *
 * The five-degree reading of each laras, so the same phrase can be written once
 * and played in any of them. Padaeng is diatonic-chromatic, so its five degrees
 * are the pentatonic subset C-D-E-G-A — a choice made for comparability, and one
 * the interface states rather than implies. It is not a claim that padaeng's
 * third degree and salendro's third degree are the same note. The whole point of
 * comparing them is that they are not.
 */
export const PENTATONIC_DEGREE_INDEX: Record<Laras, readonly number[]> = {
  padaeng: [0, 2, 4, 7, 9],
  salendro: [0, 1, 2, 3, 4],
  'pelog-degung': [0, 1, 2, 3, 4],
}

export interface DegreeComparison {
  /** Position in the five-degree reading, 0-based. */
  readonly slot: number
  readonly nameA: string
  readonly nameB: string
  readonly hzA: number
  readonly hzB: number
  /** How far apart, signed, B relative to A. */
  readonly centsApart: number
  /**
   * Beats per second when both sound together — the difference of the two
   * frequencies, which is what the ear hears as roughness. Arithmetic on the two
   * modelled pitches, not a measurement of any physical instrument.
   */
  readonly beatHz: number
}

/**
 * The two laras, slot by slot, at one octave.
 *
 * This is the arithmetic behind the claim that a set tuned one way cannot simply
 * join an ensemble tuned another: every figure here follows from the cents in
 * `data/tunings/`, and those ship as documented interval sets rather than as
 * measurements. The roughness is real; its exact rate is a property of the model.
 */
export function compareTunings(
  a: TuningDefinition,
  b: TuningDefinition,
  octave = 4,
): readonly DegreeComparison[] {
  const slotsA = PENTATONIC_DEGREE_INDEX[a.laras]
  const slotsB = PENTATONIC_DEGREE_INDEX[b.laras]
  const slots = Math.min(slotsA.length, slotsB.length)

  return Array.from({ length: slots }, (_, slot) => {
    const degreeIndexA = slotsA[slot] ?? 0
    const degreeIndexB = slotsB[slot] ?? 0
    const hzA = pitchToHz(a, { degreeIndex: degreeIndexA, octave })
    const hzB = pitchToHz(b, { degreeIndex: degreeIndexB, octave })

    return {
      slot,
      nameA: a.degrees[degreeIndexA]?.name ?? '',
      nameB: b.degrees[degreeIndexB]?.name ?? '',
      hzA,
      hzB,
      centsApart: centsBetween(hzA, hzB),
      beatHz: Math.abs(hzA - hzB),
    }
  })
}

/** The widest gap between the two, which is where the collision is most audible. */
export function widestGap(comparisons: readonly DegreeComparison[]): DegreeComparison | null {
  return comparisons.reduce<DegreeComparison | null>(
    (worst, entry) =>
      worst === null || Math.abs(entry.centsApart) > Math.abs(worst.centsApart) ? entry : worst,
    null,
  )
}
