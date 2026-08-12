import padaengJson from '@/data/tunings/padaeng.json'
import salendroJson from '@/data/tunings/salendro.json'
import pelogDegungJson from '@/data/tunings/pelog-degung.json'
import type { Laras, TuningDefinition } from './types'

export * from './types'
export * from './cents'
export * from './pitch'
export * from './compare'

export const PADAENG = padaengJson as TuningDefinition
export const SALENDRO = salendroJson as TuningDefinition
export const PELOG_DEGUNG = pelogDegungJson as TuningDefinition

export const TUNINGS: readonly TuningDefinition[] = [PADAENG, SALENDRO, PELOG_DEGUNG]

export function getTuning(laras: Laras): TuningDefinition {
  const found = TUNINGS.find((t) => t.laras === laras)
  if (found === undefined) throw new RangeError(`Laras tidak dikenal: ${laras}`)
  return found
}

/**
 * Apply user edits to a tuning's cents. Tunings are editable by design (invariant 8):
 * salendro and pelog vary between sets, so the shipped numbers are a starting point.
 */
export function withEditedCents(
  tuning: TuningDefinition,
  centsByDegreeIndex: ReadonlyMap<number, number>,
): TuningDefinition {
  return {
    ...tuning,
    degrees: tuning.degrees.map((degree, index) => {
      const edited = centsByDegreeIndex.get(index)
      return edited === undefined ? degree : { ...degree, cents: edited }
    }),
  }
}
