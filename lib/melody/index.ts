import bintangKecil from '@/data/melodies/bintang-kecil.json'
import frereJacques from '@/data/melodies/frere-jacques.json'
import latihanPelogDegung from '@/data/melodies/latihan-pelog-degung.json'
import latihanSalendro from '@/data/melodies/latihan-salendro.json'
import ujiKoordinasi from '@/data/melodies/uji-koordinasi.json'
import type { Laras, TuningSource } from '@/lib/tuning'

/**
 * Melodies ship only if public domain or own composition, cited either way
 * (invariant 15). Nothing here is an approximation of a repertoire piece — a
 * half-remembered folk melody presented under its real name would be a worse
 * misrepresentation than shipping no folk melody at all.
 */
export type Provenance = 'domain-publik' | 'ciptaan-sendiri'

/**
 * Positions are in beats, not seconds. The conversion happens once, when a melody
 * meets a tempo — see `toTimedNotes`.
 */
export interface MelodyNote {
  readonly pitchId: string
  readonly startBeat: number
  readonly durationBeats: number
}

export interface Melody {
  readonly id: string
  readonly title: string
  readonly subtitle: string
  readonly setId: string
  readonly laras: Laras
  readonly provenance: Provenance
  readonly source: TuningSource
  readonly bpm: number
  readonly beatsPerBar: number
  readonly notes: readonly MelodyNote[]
}

export const MELODIES: readonly Melody[] = [
  bintangKecil as Melody,
  frereJacques as Melody,
  ujiKoordinasi as Melody,
  latihanSalendro as Melody,
  latihanPelogDegung as Melody,
]

export function getMelody(id: string): Melody {
  const found = MELODIES.find((melody) => melody.id === id)
  if (found === undefined) throw new RangeError(`Melodi tidak dikenal: ${id}`)
  return found
}

export function melodiesForSet(setId: string): readonly Melody[] {
  return MELODIES.filter((melody) => melody.setId === setId)
}

/** A note placed in time. Seconds only past this point. */
export interface TimedNote {
  readonly pitchId: string
  readonly startSec: number
  readonly durationSec: number
  readonly index: number
}

export function toTimedNotes(melody: Melody, bpm: number = melody.bpm): readonly TimedNote[] {
  const secPerBeat = 60 / bpm
  return melody.notes.map((note, index) => ({
    pitchId: note.pitchId,
    startSec: note.startBeat * secPerBeat,
    durationSec: note.durationBeats * secPerBeat,
    index,
  }))
}

export function melodyDurationSec(melody: Melody, bpm: number = melody.bpm): number {
  const secPerBeat = 60 / bpm
  return Math.max(...melody.notes.map((note) => (note.startBeat + note.durationBeats) * secPerBeat))
}

/** Distinct pitches the melody needs — the size of the instrument it demands. */
export function pitchesUsed(melody: Melody): readonly string[] {
  return [...new Set(melody.notes.map((note) => note.pitchId))]
}
