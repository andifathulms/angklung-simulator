import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_ANGKLUNG_PER_PLAYER,
  describeInfeasibility,
  distribute,
  maxSimultaneousNotes,
  partFor,
  peakSimultaneity,
  reportAbsence,
  combineEnsemble,
} from '@/lib/distribute'
import { MELODIES, getMelody, toTimedChords, toTimedNotes } from '@/lib/melody'
import { buildSet, getSet } from '@/lib/set'
import type { TimedNote } from '@/lib/melody'
import { bruteForceMinimumPlayers } from './helpers/brute-force'

const diatonis = buildSet(getSet('melodi-diatonis'))
const kromatis = buildSet(getSet('melodi-kromatis'))

type NoteSpec = readonly [pitchId: string, startSec: number, durationSec: number]

function notes(spec: readonly NoteSpec[]): TimedNote[] {
  return spec.map(([pitchId, startSec, durationSec], index) => ({
    pitchId,
    startSec,
    durationSec,
    index,
  }))
}

describe('every note is assigned', () => {
  it.each(MELODIES.map((melody) => melody.id))('%s loses nothing', (id) => {
    const melody = getMelody(id)
    const set = buildSet(getSet(melody.setId))
    const result = distribute({ notes: toTimedNotes(melody), set })

    expect(result.type).toBe('feasible')
    if (result.type !== 'feasible') return

    expect(result.assignments).toHaveLength(melody.notes.length)
    expect(result.assignments.map((a) => a.note.index)).toEqual(
      melody.notes.map((_, index) => index),
    )
    // Every note goes to a player who actually holds that angklung.
    for (const assignment of result.assignments) {
      const player = result.players[assignment.playerIndex]
      expect(player).toBeDefined()
      expect(player?.angklung.map((a) => a.pitchId)).toContain(assignment.note.pitchId)
    }
  })
})

describe('no player is in two places at once', () => {
  it.each(MELODIES.map((melody) => melody.id))('%s has no overlapping part', (id) => {
    const melody = getMelody(id)
    const set = buildSet(getSet(melody.setId))
    const result = distribute({ notes: toTimedNotes(melody), set })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')

    for (const player of result.players) {
      expect(player.angklung.length).toBeLessThanOrEqual(DEFAULT_MAX_ANGKLUNG_PER_PLAYER)
      const sorted = [...player.notes].sort((a, b) => a.startSec - b.startSec)
      for (let i = 1; i < sorted.length; i += 1) {
        const previous = sorted[i - 1] as TimedNote
        const current = sorted[i] as TimedNote
        const previousEnd = previous.startSec + previous.durationSec
        // Same angklung struck again is fine; two different notes at once is not.
        if (previous.pitchId !== current.pitchId) {
          expect(current.startSec, `pemain ${player.playerIndex}`).toBeGreaterThanOrEqual(
            previousEnd - 1e-9,
          )
        }
      }
    }
  })
})

describe('minimum ensemble size', () => {
  it('agrees with brute force on small melodies', () => {
    const cases: readonly (readonly NoteSpec[])[] = [
      // One player, one angklung, played twice.
      [
        ['C4', 0, 1],
        ['C4', 1, 1],
      ],
      // Two pitches, never together: one player can hold both.
      [
        ['C4', 0, 1],
        ['D4', 1, 1],
      ],
      // Two pitches, together: two players.
      [
        ['C4', 0, 1],
        ['D4', 0.5, 1],
      ],
      // Three pitches, all overlapping.
      [
        ['C4', 0, 2],
        ['E4', 0.5, 2],
        ['G4', 1, 2],
      ],
      // Four pitches, two disjoint pairs — two players hold two each.
      [
        ['C4', 0, 1],
        ['E4', 0, 1],
        ['G4', 1, 1],
        ['B4', 1, 1],
      ],
      // Five pitches, a chain of overlaps.
      [
        ['C4', 0, 1.2],
        ['D4', 1, 1.2],
        ['E4', 2, 1.2],
        ['F4', 3, 1.2],
        ['G4', 4, 1.2],
      ],
    ]

    for (const spec of cases) {
      const timed = notes(spec)
      const result = distribute({ notes: timed, set: diatonis })
      expect(result.type).toBe('feasible')
      if (result.type !== 'feasible') continue
      expect(result.minimumPlayers, JSON.stringify(spec)).toBe(
        bruteForceMinimumPlayers(timed, DEFAULT_MAX_ANGKLUNG_PER_PLAYER),
      )
    }
  })

  it('never claims fewer players than there are simultaneous notes', () => {
    for (const melody of MELODIES) {
      const set = buildSet(getSet(melody.setId))
      const timed = toTimedNotes(melody)
      const result = distribute({ notes: timed, set })
      if (result.type !== 'feasible') continue
      expect(result.minimumPlayers).toBeGreaterThanOrEqual(maxSimultaneousNotes(timed))
    }
  })

  it('proves the point: Uji Koordinasi cannot be played by one person', () => {
    const melody = getMelody('uji-koordinasi')
    const result = distribute({ notes: toTimedNotes(melody), set: kromatis })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    expect(result.minimumPlayers).toBeGreaterThan(1)

    const alone = distribute({ notes: toTimedNotes(melody), set: kromatis, playerCount: 1 })
    expect(alone.type).toBe('infeasible')
  })
})

describe('infeasibility is reported, never truncated', () => {
  it('names a note that is outside the set', () => {
    const result = distribute({
      notes: notes([
        ['C4', 0, 1],
        ['C#4', 1, 1],
      ]),
      set: diatonis,
    })
    expect(result.type).toBe('infeasible')
    if (result.type !== 'infeasible') return
    expect(result.reasons).toEqual([
      { type: 'nada-di-luar-set', pitchId: 'C#4', noteIndexes: [1] },
    ])
    expect(describeInfeasibility(result.reasons[0]!)).toMatch(/tidak ada dalam set/)
  })

  it('names a note that would need one angklung to sound twice at once', () => {
    const result = distribute({
      notes: notes([
        ['C4', 0, 2],
        ['C4', 1, 2],
      ]),
      set: diatonis,
    })
    expect(result.type).toBe('infeasible')
    if (result.type !== 'infeasible') return
    expect(result.reasons[0]?.type).toBe('nada-bertumpuk-sendiri')
    expect(describeInfeasibility(result.reasons[0]!)).toMatch(/angklung kedua/)
  })

  it('reports too few players with the number actually needed', () => {
    const timed = notes([
      ['C4', 0, 2],
      ['E4', 0, 2],
      ['G4', 0, 2],
    ])
    const result = distribute({ notes: timed, set: diatonis, playerCount: 2 })
    expect(result.type).toBe('infeasible')
    if (result.type !== 'infeasible') return
    expect(result.reasons[0]).toEqual({ type: 'pemain-kurang', needed: 3, available: 2 })
    expect(describeInfeasibility(result.reasons[0]!)).toMatch(/tidak dipotong/)
  })

  it('reports every out-of-set note, not just the first', () => {
    const result = distribute({
      notes: notes([
        ['C#4', 0, 1],
        ['D#4', 1, 1],
      ]),
      set: diatonis,
    })
    if (result.type !== 'infeasible') throw new Error('seharusnya tidak bisa dimainkan')
    expect(result.reasons).toHaveLength(2)
  })
})

describe('a fixed ensemble', () => {
  it('pads out to the requested size, empty-handed players included', () => {
    const result = distribute({
      notes: notes([
        ['C4', 0, 1],
        ['D4', 1, 1],
      ]),
      set: diatonis,
      playerCount: 5,
    })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    expect(result.players).toHaveLength(5)
    expect(result.players.filter((player) => player.angklung.length === 0).length).toBeGreaterThan(0)
  })

  it('hands one player their own part', () => {
    const melody = getMelody('bintang-kecil')
    const result = distribute({ notes: toTimedNotes(melody), set: diatonis })
    const part = partFor(result, 0)
    expect(part).not.toBeNull()
    expect(part?.notes.length).toBeGreaterThan(0)
    expect(partFor(result, 999)).toBeNull()
  })

  it('respects a one-angklung-per-player ensemble', () => {
    const result = distribute({
      notes: notes([
        ['C4', 0, 1],
        ['D4', 1, 1],
      ]),
      set: diatonis,
      maxAngklungPerPlayer: 1,
    })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    expect(result.minimumPlayers).toBe(2)
  })
})

describe('the busiest instant', () => {
  it('reports where the peak is, not just how high', () => {
    const peak = peakSimultaneity(
      notes([
        ['C4', 0, 1],
        ['D4', 2, 1],
        ['E4', 2, 1],
        ['G4', 2, 1],
      ]),
    )
    expect(peak.count).toBe(3)
    expect(peak.atSec).toBe(2)
    expect(peak.noteIndexes).toEqual([1, 2, 3])
    expect(peak.tied).toBe(false)
  })

  it('reports the first of several equally busy instants, and says they tie', () => {
    const peak = peakSimultaneity(
      notes([
        ['C4', 0, 1],
        ['E4', 0, 1],
        ['D4', 4, 1],
        ['G4', 4, 1],
      ]),
    )
    expect(peak.count).toBe(2)
    expect(peak.atSec).toBe(0)
    expect(peak.noteIndexes).toEqual([0, 1])
    expect(peak.tied).toBe(true)
  })

  it('does not count a note that ends exactly as the next begins', () => {
    const peak = peakSimultaneity(
      notes([
        ['C4', 0, 1],
        ['D4', 1, 1],
      ]),
    )
    expect(peak.count).toBe(1)
    expect(peak.noteIndexes).toHaveLength(1)
  })

  it('agrees with the height the sweep already reported', () => {
    for (const melody of MELODIES) {
      const timed = toTimedNotes(melody)
      expect(peakSimultaneity(timed).count).toBe(maxSimultaneousNotes(timed))
    }
  })

  it('holds an empty melody at zero', () => {
    const peak = peakSimultaneity([])
    expect(peak.count).toBe(0)
    expect(peak.noteIndexes).toEqual([])
  })
})

describe('why the minimum is the number it is', () => {
  it('blames overlap when notes genuinely sound together', () => {
    const result = distribute({
      notes: notes([
        ['C4', 0, 2],
        ['E4', 0, 2],
        ['G4', 0, 2],
      ]),
      set: diatonis,
    })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    expect(result.minimumPlayers).toBe(3)
    expect(result.minimumDriver.type).toBe('tumpang-tindih')
    if (result.minimumDriver.type !== 'tumpang-tindih') return
    expect(result.minimumDriver.peak.count).toBe(3)
    expect(result.minimumDriver.peak.atSec).toBe(0)
  })

  it('blames the count of notes when nothing overlaps at all', () => {
    // Six distinct pitches, strictly one after another. No instant needs two
    // hands; six angklung at two per player still needs three people.
    const result = distribute({
      notes: notes([
        ['C4', 0, 1],
        ['D4', 1, 1],
        ['E4', 2, 1],
        ['F4', 3, 1],
        ['G4', 4, 1],
        ['A4', 5, 1],
      ]),
      set: diatonis,
    })
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    expect(result.maxSimultaneous).toBe(1)
    expect(result.minimumPlayers).toBe(3)
    expect(result.minimumDriver.type).toBe('jumlah-nada')
    if (result.minimumDriver.type !== 'jumlah-nada') return
    expect(result.minimumDriver.distinctPitches).toBe(6)
    expect(result.minimumDriver.maxAngklungPerPlayer).toBe(2)
  })

  it('names a driver for every melody that ships', () => {
    for (const melody of MELODIES) {
      const result = distribute({
        notes: toTimedNotes(melody),
        set: buildSet(getSet(melody.setId)),
      })
      if (result.type !== 'feasible') throw new Error(`${melody.id} seharusnya bisa dimainkan`)
      expect(['tumpang-tindih', 'jumlah-nada', 'penempatan']).toContain(
        result.minimumDriver.type,
      )
    }
  })
})

describe('the minimum is a property of the piece', () => {
  it('does not drift when a larger ensemble is requested', () => {
    const melody = getMelody('bintang-kecil')
    const timed = toTimedNotes(melody)
    const alone = distribute({ notes: timed, set: diatonis })
    if (alone.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')

    for (const playerCount of [alone.minimumPlayers, alone.minimumPlayers + 3, 16]) {
      const sized = distribute({ notes: timed, set: diatonis, playerCount })
      if (sized.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
      expect(sized.minimumPlayers).toBe(alone.minimumPlayers)
      expect(sized.players).toHaveLength(playerCount)
    }
  })
})

describe('a player who did not come', () => {
  const melody = getMelody('bintang-kecil')
  const timed = toTimedNotes(melody)
  const result = distribute({ notes: timed, set: diatonis })

  it('names every note that now has nobody holding it', () => {
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    const player = result.players[1]
    expect(player).toBeDefined()
    if (player === undefined) return

    const report = reportAbsence(result, [1])
    expect(report.absentPlayers).toEqual([1])
    expect(report.silenced).toHaveLength(player.notes.length)
    // Reported, never quietly discarded: every silenced note is a real note of
    // the melody, and it is still in the distribution.
    for (const assignment of report.silenced) {
      expect(assignment.playerIndex).toBe(1)
      expect(result.assignments).toContain(assignment)
    }
    expect(report.totalNotes).toBe(melody.notes.length)
    expect(report.silencedShare).toBeCloseTo(player.notes.length / melody.notes.length, 10)
  })

  it('silences nothing when everyone turns up', () => {
    const report = reportAbsence(result, [])
    expect(report.silenced).toEqual([])
    expect(report.silencedShare).toBe(0)
  })

  it('silences the whole piece when nobody turns up', () => {
    if (result.type !== 'feasible') throw new Error('seharusnya bisa dimainkan')
    const everyone = result.players.map((player) => player.playerIndex)
    const report = reportAbsence(result, everyone)
    expect(report.silenced).toHaveLength(melody.notes.length)
    expect(report.silencedShare).toBe(1)
  })

  it('ignores a repeated or unknown player rather than double-counting', () => {
    const report = reportAbsence(result, [1, 1, 999])
    expect(report.absentPlayers).toEqual([1, 999])
    const indexes = report.silenced.map((assignment) => assignment.note.index)
    expect(new Set(indexes).size).toBe(indexes.length)
  })

  it('reports nothing for an arrangement that could not be played anyway', () => {
    const impossible = distribute({
      notes: notes([['C7', 0, 1]]),
      set: diatonis,
    })
    expect(impossible.type).toBe('infeasible')
    expect(reportAbsence(impossible, [0]).silenced).toEqual([])
  })
})

describe('the accompaniment part', () => {
  const withChords = MELODIES.filter((melody) => melody.akompanimen !== undefined)

  it('ships at least one melody that has one', () => {
    expect(withChords.length).toBeGreaterThan(0)
  })

  it.each(withChords.map((melody) => melody.id))(
    '%s: every chord contains the melody notes sounding over it',
    (id) => {
      const melody = getMelody(id)
      const track = melody.akompanimen
      expect(track).toBeDefined()
      if (track === undefined) return

      const chordSet = buildSet(getSet(track.setId))

      for (const note of melody.notes) {
        const chord = track.chords.find(
          (candidate) =>
            candidate.startBeat <= note.startBeat &&
            note.startBeat < candidate.startBeat + candidate.durationBeats,
        )
        // Every melody note is covered, and covered by a chord it belongs to.
        // This is the rule the arrangement claims to obey; it is checked, not
        // asserted in prose.
        expect(chord, `nada di ketukan ${note.startBeat} tanpa akor`).toBeDefined()
        if (chord === undefined) continue

        const angklung = chordSet.find((entry) => entry.pitchId === chord.pitchId)
        expect(angklung, `akor ${chord.pitchId} tidak ada dalam set`).toBeDefined()
        const tones = angklung?.spec.tabung.map((tube) => tube.hz) ?? []
        // A chord angklung is several tubes, not a symbol — four untengkeped.
        expect(tones.length).toBeGreaterThan(2)
      }
    },
  )

  it.each(withChords.map((melody) => melody.id))('%s: the chords are playable', (id) => {
    const melody = getMelody(id)
    const track = melody.akompanimen
    if (track === undefined) return
    const result = distribute({
      notes: toTimedChords(melody),
      set: buildSet(getSet(track.setId)),
    })
    expect(result.type).toBe('feasible')
  })

  it.each(withChords.map((melody) => melody.id))('%s: carries its own citation', (id) => {
    const track = getMelody(id).akompanimen
    expect(track?.source.title.trim().length).toBeGreaterThan(20)
    // The harmonisation is a choice, and the caveat is where it says so.
    expect(track?.source.caveat.trim().length).toBeGreaterThan(40)
  })

  it('gives chords indexes that cannot collide with melody notes', () => {
    const melody = getMelody('bintang-kecil')
    const notesTimed = toTimedNotes(melody)
    const chordsTimed = toTimedChords(melody, melody.bpm, notesTimed.length)
    const all = new Set([...notesTimed, ...chordsTimed].map((note) => note.index))
    expect(all.size).toBe(notesTimed.length + chordsTimed.length)
  })
})

describe('one room, two populations', () => {
  const melody = getMelody('bintang-kecil')
  const notesTimed = toTimedNotes(melody)
  const melodyResult = distribute({ notes: notesTimed, set: diatonis })
  const track = melody.akompanimen
  const chordResult = distribute({
    notes: toTimedChords(melody, melody.bpm, notesTimed.length),
    set: buildSet(getSet(track?.setId ?? 'akompanimen-dasar')),
  })

  it('puts accompanists after melody players, with nobody sharing a number', () => {
    const ensemble = combineEnsemble(melodyResult, chordResult)
    expect(ensemble).not.toBeNull()
    if (ensemble === null) return

    expect(ensemble.totalPlayers).toBe(ensemble.melodyPlayers + ensemble.akompanimenPlayers)
    expect(ensemble.akompanimenPlayers).toBeGreaterThan(0)
    expect(ensemble.players.map((player) => player.playerIndex)).toEqual(
      ensemble.players.map((_, index) => index),
    )
    expect(ensemble.players.slice(0, ensemble.melodyPlayers).every((p) => p.role === 'melodi')).toBe(
      true,
    )
    expect(ensemble.players.slice(ensemble.melodyPlayers).every((p) => p.role === 'akompanimen')).toBe(
      true,
    )
  })

  it('keeps every note of both parts', () => {
    const ensemble = combineEnsemble(melodyResult, chordResult)
    if (ensemble === null) throw new Error('seharusnya bisa digabung')
    if (melodyResult.type !== 'feasible' || chordResult.type !== 'feasible') {
      throw new Error('seharusnya bisa dimainkan')
    }
    expect(ensemble.assignments).toHaveLength(
      melodyResult.assignments.length + chordResult.assignments.length,
    )
    // Every assignment points at a player who is actually in the room.
    for (const assignment of ensemble.assignments) {
      expect(ensemble.players[assignment.playerIndex]).toBeDefined()
    }
  })

  it('an accompanist waits far less than a melody player', () => {
    const ensemble = combineEnsemble(melodyResult, chordResult)
    if (ensemble === null) throw new Error('seharusnya bisa digabung')
    const sounding = (player: { notes: readonly TimedNote[] }) =>
      player.notes.reduce((total, note) => total + note.durationSec, 0)

    const melodyPlayers = ensemble.players.filter((player) => player.role === 'melodi')
    const accompanists = ensemble.players.filter((player) => player.role === 'akompanimen')
    const busiestMelody = Math.max(...melodyPlayers.map(sounding))
    const busiestAccompanist = Math.max(...accompanists.map(sounding))
    // The claim the ensemble view makes in copy — waiting is most of the job —
    // is true of one population and false of the other.
    expect(busiestAccompanist).toBeGreaterThan(busiestMelody)
  })

  it('works with no accompaniment at all', () => {
    const ensemble = combineEnsemble(melodyResult, null)
    if (ensemble === null) throw new Error('seharusnya bisa digabung')
    expect(ensemble.akompanimenPlayers).toBe(0)
    expect(ensemble.players.every((player) => player.role === 'melodi')).toBe(true)
  })

  it('reports absence across both populations', () => {
    const ensemble = combineEnsemble(melodyResult, chordResult)
    if (ensemble === null) throw new Error('seharusnya bisa digabung')
    const accompanist = ensemble.players[ensemble.melodyPlayers]
    expect(accompanist).toBeDefined()
    if (accompanist === undefined) return

    const report = reportAbsence(ensemble, [accompanist.playerIndex])
    expect(report.silenced.length).toBe(accompanist.notes.length)
    expect(report.totalNotes).toBe(ensemble.assignments.length)
  })
})
