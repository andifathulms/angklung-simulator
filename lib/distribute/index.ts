import type { AngklungInSet } from '@/lib/set'
import type { TimedNote } from '@/lib/melody'

/**
 * Distribution: melody + players → who holds what, and when they come in.
 *
 * This is the whole point of the project. One angklung is one note, so a song has
 * to be spread across a room, and the spreading is a small constraint problem:
 * every note needs a player who holds that angklung and is free at that moment.
 *
 * It never silently drops a note. A note outside the set, or a player needed in
 * two places at once, comes back as a named infeasibility (invariant 9).
 */

export const DEFAULT_MAX_ANGKLUNG_PER_PLAYER = 2

/** Why an arrangement cannot be played. Keyed on `type` for exhaustive handling. */
export type Infeasibility =
  | {
      readonly type: 'nada-di-luar-set'
      readonly pitchId: string
      readonly noteIndexes: readonly number[]
    }
  | {
      readonly type: 'nada-bertumpuk-sendiri'
      readonly pitchId: string
      readonly noteIndexes: readonly number[]
    }
  | {
      readonly type: 'pemain-kurang'
      readonly needed: number
      readonly available: number
    }

export interface PlayerPart {
  readonly playerIndex: number
  /** The one or two angklung this player holds for the whole piece. */
  readonly angklung: readonly AngklungInSet[]
  readonly notes: readonly TimedNote[]
}

export interface NoteAssignment {
  readonly note: TimedNote
  readonly playerIndex: number
  readonly angklung: AngklungInSet
}

export type DistributionResult =
  | {
      readonly type: 'feasible'
      readonly players: readonly PlayerPart[]
      readonly assignments: readonly NoteAssignment[]
      /** Most angklung sounding at once — the floor on how many people are needed. */
      readonly maxSimultaneous: number
      readonly minimumPlayers: number
    }
  | {
      readonly type: 'infeasible'
      readonly reasons: readonly Infeasibility[]
      readonly maxSimultaneous: number
    }

export interface DistributeOptions {
  readonly notes: readonly TimedNote[]
  readonly set: readonly AngklungInSet[]
  /** Fixed ensemble size. Omit to ask for the smallest ensemble that can play it. */
  readonly playerCount?: number
  readonly maxAngklungPerPlayer?: number
}

/** Two notes collide if their sounding intervals overlap at all. */
function overlaps(a: TimedNote, b: TimedNote): boolean {
  return a.startSec < b.startSec + b.durationSec && b.startSec < a.startSec + a.durationSec
}

/** The largest number of notes sounding at the same instant. */
export function maxSimultaneousNotes(notes: readonly TimedNote[]): number {
  const edges = notes
    .flatMap((note) => [
      { timeSec: note.startSec, delta: 1 },
      { timeSec: note.startSec + note.durationSec, delta: -1 },
    ])
    // Ends before starts at the same instant: a note that stops exactly when the
    // next begins does not need a second player.
    .sort((a, b) => a.timeSec - b.timeSec || a.delta - b.delta)

  let current = 0
  let peak = 0
  for (const edge of edges) {
    current += edge.delta
    peak = Math.max(peak, current)
  }
  return peak
}

export function distribute(options: DistributeOptions): DistributionResult {
  const { notes, set } = options
  const maxPerPlayer = options.maxAngklungPerPlayer ?? DEFAULT_MAX_ANGKLUNG_PER_PLAYER
  const maxSimultaneous = maxSimultaneousNotes(notes)
  const reasons: Infeasibility[] = []

  // 1. Every note needs an angklung that exists in the set.
  const byPitchId = new Map<string, AngklungInSet>()
  for (const angklung of set) byPitchId.set(angklung.pitchId, angklung)

  const notesByPitch = new Map<string, TimedNote[]>()
  for (const note of notes) {
    const existing = notesByPitch.get(note.pitchId)
    if (existing === undefined) notesByPitch.set(note.pitchId, [note])
    else existing.push(note)
  }

  for (const [pitchId, pitchNotes] of notesByPitch) {
    if (!byPitchId.has(pitchId)) {
      reasons.push({
        type: 'nada-di-luar-set',
        pitchId,
        noteIndexes: pitchNotes.map((note) => note.index),
      })
    }
  }

  // 2. One angklung cannot sound twice at once, however many players there are.
  for (const [pitchId, pitchNotes] of notesByPitch) {
    const clashing = new Set<number>()
    for (let i = 0; i < pitchNotes.length; i += 1) {
      for (let j = i + 1; j < pitchNotes.length; j += 1) {
        const a = pitchNotes[i]
        const b = pitchNotes[j]
        if (a !== undefined && b !== undefined && overlaps(a, b)) {
          clashing.add(a.index)
          clashing.add(b.index)
        }
      }
    }
    if (clashing.size > 0) {
      reasons.push({
        type: 'nada-bertumpuk-sendiri',
        pitchId,
        noteIndexes: [...clashing].sort((a, b) => a - b),
      })
    }
  }

  if (reasons.length > 0) return { type: 'infeasible', reasons, maxSimultaneous }

  // 3. Two pitches cannot go to one player if they are ever needed together.
  const pitchIds = [...notesByPitch.keys()]
  const conflicts = buildConflictGraph(pitchIds, notesByPitch)

  const lowerBound = Math.max(
    maxSimultaneous,
    Math.ceil(pitchIds.length / maxPerPlayer),
    pitchIds.length === 0 ? 0 : 1,
  )

  const requested = options.playerCount
  const grouping =
    requested === undefined
      ? searchFromLowerBound(pitchIds, conflicts, maxPerPlayer, lowerBound)
      : groupPitches(pitchIds, conflicts, maxPerPlayer, requested)

  if (grouping === null) {
    // Only reachable with a fixed ensemble size: the melody is playable, but not
    // by this many people. Reported, never resolved by truncating the melody.
    const minimum = searchFromLowerBound(pitchIds, conflicts, maxPerPlayer, lowerBound)
    return {
      type: 'infeasible',
      reasons: [
        {
          type: 'pemain-kurang',
          needed: minimum === null ? lowerBound : minimum.length,
          available: requested ?? 0,
        },
      ],
      maxSimultaneous,
    }
  }

  // Pad out to the requested ensemble size: a player holding nothing is still a
  // person standing there, and the ensemble view should show them.
  const groups = [...grouping]
  while (requested !== undefined && groups.length < requested) groups.push([])

  const players: PlayerPart[] = groups.map((group, playerIndex) => {
    const held = group.flatMap((pitchId) => {
      const angklung = byPitchId.get(pitchId)
      return angklung === undefined ? [] : [angklung]
    })
    const playerNotes = group
      .flatMap((pitchId) => notesByPitch.get(pitchId) ?? [])
      .sort((a, b) => a.startSec - b.startSec)
    return { playerIndex, angklung: held, notes: playerNotes }
  })

  const assignments: NoteAssignment[] = []
  players.forEach((player) => {
    for (const note of player.notes) {
      const angklung = byPitchId.get(note.pitchId)
      if (angklung === undefined) continue
      assignments.push({ note, playerIndex: player.playerIndex, angklung })
    }
  })
  assignments.sort((a, b) => a.note.index - b.note.index)

  return {
    type: 'feasible',
    players,
    assignments,
    maxSimultaneous,
    minimumPlayers: grouping.length,
  }
}

function buildConflictGraph(
  pitchIds: readonly string[],
  notesByPitch: ReadonlyMap<string, readonly TimedNote[]>,
): boolean[][] {
  const size = pitchIds.length
  const conflicts: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false))

  for (let i = 0; i < size; i += 1) {
    for (let j = i + 1; j < size; j += 1) {
      const left = notesByPitch.get(pitchIds[i] as string) ?? []
      const right = notesByPitch.get(pitchIds[j] as string) ?? []
      const clash = left.some((a) => right.some((b) => overlaps(a, b)))
      if (clash) {
        ;(conflicts[i] as boolean[])[j] = true
        ;(conflicts[j] as boolean[])[i] = true
      }
    }
  }
  return conflicts
}

function searchFromLowerBound(
  pitchIds: readonly string[],
  conflicts: readonly boolean[][],
  maxPerPlayer: number,
  lowerBound: number,
): string[][] | null {
  for (let count = lowerBound; count <= pitchIds.length; count += 1) {
    const grouping = groupPitches(pitchIds, conflicts, maxPerPlayer, count)
    if (grouping !== null) return grouping
  }
  return pitchIds.length === 0 ? [] : null
}

/**
 * Exact search: can these pitches be split among `playerCount` players, at most
 * `maxPerPlayer` each, with no player holding two pitches that are ever needed at
 * the same time?
 *
 * Graph colouring with bounded colour classes — NP-hard in general, trivial at the
 * size of a real angklung set. Hardest pitches first, and only ever opening one
 * fresh group at each step, which removes the symmetry between empty groups.
 */
function groupPitches(
  pitchIds: readonly string[],
  conflicts: readonly boolean[][],
  maxPerPlayer: number,
  playerCount: number,
): string[][] | null {
  if (pitchIds.length === 0) return []
  if (playerCount <= 0) return null
  if (playerCount * maxPerPlayer < pitchIds.length) return null

  const order = pitchIds
    .map((_, index) => index)
    .sort((a, b) => degreeOf(conflicts, b) - degreeOf(conflicts, a))

  const groups: number[][] = []

  const place = (position: number): boolean => {
    if (position === order.length) return true
    const pitchIndex = order[position] as number

    for (const group of groups) {
      if (group.length >= maxPerPlayer) continue
      if (group.some((member) => (conflicts[pitchIndex] as boolean[])[member])) continue
      group.push(pitchIndex)
      if (place(position + 1)) return true
      group.pop()
    }

    if (groups.length < playerCount) {
      groups.push([pitchIndex])
      if (place(position + 1)) return true
      groups.pop()
    }

    return false
  }

  if (!place(0)) return null
  return groups.map((group) => group.map((index) => pitchIds[index] as string))
}

function degreeOf(conflicts: readonly boolean[][], index: number): number {
  return (conflicts[index] as boolean[]).reduce((sum, isConflict) => sum + (isConflict ? 1 : 0), 0)
}

/** One player's part, for the play-your-part view. */
export function partFor(result: DistributionResult, playerIndex: number): PlayerPart | null {
  if (result.type !== 'feasible') return null
  return result.players.find((player) => player.playerIndex === playerIndex) ?? null
}

/** Human-readable, Indonesian-first. The UI never invents its own wording for these. */
export function describeInfeasibility(reason: Infeasibility): string {
  switch (reason.type) {
    case 'nada-di-luar-set':
      return `Nada ${reason.pitchId} tidak ada dalam set ini — ${reason.noteIndexes.length} nada tidak bisa dimainkan. Ganti set, atau ubah aransemennya.`
    case 'nada-bertumpuk-sendiri':
      return `Nada ${reason.pitchId} harus berbunyi dua kali sekaligus. Satu angklung hanya bisa berbunyi sekali — dibutuhkan angklung kedua dengan nada yang sama.`
    case 'pemain-kurang':
      return `Butuh ${reason.needed} pemain, tersedia ${reason.available}. Lagu ini tidak dipotong agar muat.`
    default: {
      const exhaustive: never = reason
      throw new Error(`Alasan tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}
