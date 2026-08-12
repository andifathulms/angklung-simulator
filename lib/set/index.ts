import akompanimenDasar from '@/data/sets/akompanimen-dasar.json'
import melodiDiatonis from '@/data/sets/melodi-diatonis.json'
import melodiKromatis from '@/data/sets/melodi-kromatis.json'
import pelogDegungPentatonis from '@/data/sets/pelog-degung-pentatonis.json'
import salendroPentatonis from '@/data/sets/salendro-pentatonis.json'
import { angklungAkompanimen, angklungMelodi } from '@/lib/synth/angklung'
import type { AkorKualitas, AngklungKind, AngklungSpec } from '@/lib/synth/types'
import { getTuning, pitchId, pitchToHz } from '@/lib/tuning'
import type { Laras, Pitch, TuningDefinition, TuningSource } from '@/lib/tuning'

/**
 * Angklung sets: which instruments exist, and what number each one carries.
 *
 * The padaeng number is the user-facing identity (invariant: keep it stable) —
 * a conductor signals numbers with their hands, not note names.
 */

export interface SetEntry {
  readonly degree: string
  readonly octave: number
  readonly kualitas?: AkorKualitas
}

export interface SetDefinition {
  readonly id: string
  readonly name: string
  readonly laras: Laras
  readonly kind: AngklungKind
  readonly description: string
  readonly numberingNote: string
  readonly source: TuningSource
  readonly entries: readonly SetEntry[]
}

export const SETS: readonly SetDefinition[] = [
  melodiDiatonis as SetDefinition,
  melodiKromatis as SetDefinition,
  akompanimenDasar as SetDefinition,
  salendroPentatonis as SetDefinition,
  pelogDegungPentatonis as SetDefinition,
]

export function getSet(id: string): SetDefinition {
  const found = SETS.find((set) => set.id === id)
  if (found === undefined) throw new RangeError(`Set angklung tidak dikenal: ${id}`)
  return found
}

export function setsForLaras(laras: Laras): readonly SetDefinition[] {
  return SETS.filter((set) => set.laras === laras)
}

/** One angklung in a built set: the instrument, its number, and the pitch it holds. */
export interface AngklungInSet {
  readonly spec: AngklungSpec
  readonly pitch: Pitch
  readonly pitchId: string
}

/**
 * Build the playable set. Numbers run from the lowest tube upward, in entry order,
 * so `nomor` is 1-based and stable for a given set definition.
 */
export function buildSet(
  definition: SetDefinition,
  tuning: TuningDefinition = getTuning(definition.laras),
): readonly AngklungInSet[] {
  return definition.entries.map((entry, index) => {
    const degreeIndex = tuning.degrees.findIndex((degree) => degree.name === entry.degree)
    if (degreeIndex < 0) {
      throw new RangeError(
        `Derajat "${entry.degree}" tidak ada dalam laras ${tuning.id} (set ${definition.id}).`,
      )
    }
    const pitch: Pitch = { degreeIndex, octave: entry.octave }
    const rootHz = pitchToHz(tuning, pitch)
    const id = pitchId(tuning, pitch)
    const nomor = index + 1

    const spec =
      definition.kind === 'melodi'
        ? angklungMelodi({ id: `${definition.id}-${id}`, nomor, rootHz, label: id })
        : angklungAkompanimen({
            id: `${definition.id}-${id}`,
            nomor,
            rootHz,
            label: `${id} ${entry.kualitas ?? 'mayor'}`,
            kualitas: entry.kualitas ?? 'mayor',
          })

    return { spec, pitch, pitchId: id }
  })
}

/** Look up the angklung that holds a pitch, or null — never a silent substitution. */
export function findByPitchId(
  set: readonly AngklungInSet[],
  wantedPitchId: string,
): AngklungInSet | null {
  return set.find((angklung) => angklung.pitchId === wantedPitchId) ?? null
}

/**
 * Relative tube length, 0–1, for drawing the rack to scale. Length goes as 1/f for
 * a pipe, so the rack's graduation is the instrument's physics, not a visual ramp.
 */
export function relativeTubeLength(rootHz: number, set: readonly AngklungInSet[]): number {
  const lengths = set.map((angklung) => 1 / angklung.spec.rootHz)
  const shortest = Math.min(...lengths)
  const longest = Math.max(...lengths)
  if (longest === shortest) return 1
  return (1 / rootHz - shortest) / (longest - shortest)
}
