import { centsToRatio } from './cents'
import type { Pitch, TuningDefinition } from './types'

/**
 * The one conversion from a tuning-relative pitch to Hz. Called at the boundary
 * into lib/synth, never inside it.
 */
export function pitchToHz(tuning: TuningDefinition, pitch: Pitch): number {
  const degree = tuning.degrees[pitch.degreeIndex]
  if (degree === undefined) {
    throw new RangeError(
      `Derajat ${pitch.degreeIndex} tidak ada dalam laras ${tuning.id} (${tuning.degrees.length} derajat).`,
    )
  }
  const octaveRatio = Math.pow(2, pitch.octave - tuning.referenceOctave)
  return tuning.referenceDegreeHz * octaveRatio * centsToRatio(degree.cents)
}

/** Stable, human-readable pitch id: degree name + octave, e.g. `C4`, `da5`. */
export function pitchId(tuning: TuningDefinition, pitch: Pitch): string {
  const degree = tuning.degrees[pitch.degreeIndex]
  if (degree === undefined) {
    throw new RangeError(`Derajat ${pitch.degreeIndex} tidak ada dalam laras ${tuning.id}.`)
  }
  return `${degree.name}${pitch.octave}`
}

/** Inverse of `pitchId`. Returns null rather than throwing — callers report it as infeasibility. */
export function parsePitchId(tuning: TuningDefinition, id: string): Pitch | null {
  const match = /^(.+?)(-?\d+)$/.exec(id)
  if (match === null) return null
  const [, name, octaveText] = match
  if (name === undefined || octaveText === undefined) return null
  const degreeIndex = tuning.degrees.findIndex((d) => d.name === name)
  if (degreeIndex < 0) return null
  return { degreeIndex, octave: Number.parseInt(octaveText, 10) }
}

/** Ordering by sounding pitch — used to graduate the rack by tube length. */
export function comparePitch(a: Pitch, b: Pitch): number {
  if (a.octave !== b.octave) return a.octave - b.octave
  return a.degreeIndex - b.degreeIndex
}

/** Pitch one octave up. An angklung's tubes are tuned in octaves, so this is load-bearing. */
export function octaveUp(pitch: Pitch): Pitch {
  return { degreeIndex: pitch.degreeIndex, octave: pitch.octave + 1 }
}
