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

/**
 * A chord in the accompaniment part, identified by the root pitch of the
 * angklung akompanimen that plays it — the set entry carries the chord quality.
 */
export interface MelodyChord {
  readonly pitchId: string
  readonly startBeat: number
  readonly durationBeats: number
}

/**
 * The accompaniment part, when a melody has one.
 *
 * Optional on purpose. Harmonising a melody is an arrangement decision, not a
 * transcription, so a chord track is a claim this project is making rather than
 * one it is repeating — and it carries its own citation separate from the
 * melody's, because the melody may be beyond doubt while the harmonisation is a
 * choice. A melody with no defensible chord track ships without one.
 */
export interface AkompanimenTrack {
  readonly setId: string
  readonly source: TuningSource
  readonly chords: readonly MelodyChord[]
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
  readonly akompanimen?: AkompanimenTrack
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

/**
 * The accompaniment part placed in time.
 *
 * Chords come out as `TimedNote` — the same shape the melody uses — because they
 * are the same problem. An angklung akompanimen is one instrument sounding one
 * thing at a time, held by one person who must be free when it arrives, so the
 * distribution solver does not need to know it is looking at chords.
 *
 * `indexOffset` keeps chord indexes from colliding with melody indexes once the
 * two parts share a room.
 */
export function toTimedChords(
  melody: Melody,
  bpm: number = melody.bpm,
  indexOffset = 0,
): readonly TimedNote[] {
  const track = melody.akompanimen
  if (track === undefined) return []
  const secPerBeat = 60 / bpm
  return track.chords.map((chord, index) => ({
    pitchId: chord.pitchId,
    startSec: chord.startBeat * secPerBeat,
    durationSec: chord.durationBeats * secPerBeat,
    index: indexOffset + index,
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
