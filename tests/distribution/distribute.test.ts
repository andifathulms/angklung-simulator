import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAX_ANGKLUNG_PER_PLAYER,
  describeInfeasibility,
  distribute,
  maxSimultaneousNotes,
  partFor,
} from '@/lib/distribute'
import { MELODIES, getMelody, toTimedNotes } from '@/lib/melody'
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
