import { fill } from '@/lib/i18n/fill'
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

/**
 * The busiest instant in the piece: how many notes sound together, when, and
 * which ones. The count alone was already the floor on ensemble size; the
 * instant is what makes that floor checkable instead of merely asserted.
 */
export interface Peak {
  readonly count: number
  readonly atSec: number
  readonly noteIndexes: readonly number[]
  /** True when some other instant reaches the same count. The first is reported. */
  readonly tied: boolean
}

/**
 * Why the minimum is the number it is. Three different things can force it, and
 * conflating them is how "you need eight people" becomes a fact to memorise
 * rather than a mechanism to understand.
 *
 * `tumpang-tindih` — notes sound together, so that many hands must be in the air
 *   at once. This is the concept the project exists to demonstrate.
 * `jumlah-nada` — nothing overlaps much, but there are more distinct pitches than
 *   the ensemble can hold at two angklung each. Hands, not simultaneity.
 * `penempatan` — neither bound is reached: the pitches cannot be packed into that
 *   many players without two of them colliding somewhere. The rarest case, and
 *   the only one that is a property of the whole piece rather than one instant.
 */
export type MinimumDriver =
  | { readonly type: 'tumpang-tindih'; readonly peak: Peak }
  | {
      readonly type: 'jumlah-nada'
      readonly distinctPitches: number
      readonly maxAngklungPerPlayer: number
    }
  | { readonly type: 'penempatan'; readonly distinctPitches: number }

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
      /** The busiest instant, and why the minimum is what it is. */
      readonly peak: Peak
      readonly minimumDriver: MinimumDriver
    }
  | {
      readonly type: 'infeasible'
      readonly reasons: readonly Infeasibility[]
      readonly maxSimultaneous: number
      readonly peak: Peak
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

/** Which notes are sounding at an instant. A note ending exactly here has stopped. */
function soundingAt(notes: readonly TimedNote[], atSec: number): number[] {
  return notes
    .filter((note) => note.startSec <= atSec && atSec < note.startSec + note.durationSec)
    .map((note) => note.index)
    .sort((a, b) => a - b)
}

/**
 * The busiest instant: how many notes sound together, and where.
 *
 * The sweep already knew when the peak occurred and threw it away, returning only
 * the height. The height is the floor on ensemble size; the instant is the
 * evidence for it, and without the evidence the number is just a number.
 *
 * The first instant reaching the peak is the one reported — deterministically,
 * since ties are common in a regular melody and picking one arbitrarily would
 * make the same input answer differently on different runs. `tied` says so.
 */
export function peakSimultaneity(notes: readonly TimedNote[]): Peak {
  const edges = notes
    .flatMap((note) => [
      { timeSec: note.startSec, delta: 1 },
      { timeSec: note.startSec + note.durationSec, delta: -1 },
    ])
    // Ends before starts at the same instant: a note that stops exactly when the
    // next begins does not need a second player.
    .sort((a, b) => a.timeSec - b.timeSec || a.delta - b.delta)

  let current = 0
  let count = 0
  let atSec = 0
  let occurrences = 0

  for (const edge of edges) {
    current += edge.delta
    if (current > count) {
      count = current
      atSec = edge.timeSec
      occurrences = 1
    } else if (current === count && edge.delta === 1) {
      // Reached the same height again after dropping away from it.
      occurrences += 1
    }
  }

  return {
    count,
    atSec,
    noteIndexes: count === 0 ? [] : soundingAt(notes, atSec),
    tied: occurrences > 1,
  }
}

/** The largest number of notes sounding at the same instant. */
export function maxSimultaneousNotes(notes: readonly TimedNote[]): number {
  return peakSimultaneity(notes).count
}

export function distribute(options: DistributeOptions): DistributionResult {
  const { notes, set } = options
  const maxPerPlayer = options.maxAngklungPerPlayer ?? DEFAULT_MAX_ANGKLUNG_PER_PLAYER
  const peak = peakSimultaneity(notes)
  const maxSimultaneous = peak.count
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

  if (reasons.length > 0) return { type: 'infeasible', reasons, maxSimultaneous, peak }

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
      peak,
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

  /*
   * The minimum is a property of the piece, not of what was asked for. When a
   * fixed ensemble size is requested, `grouping` is a valid packing into that
   * many players and its length is not necessarily the smallest — so the
   * reported minimum comes from its own search either way. Otherwise asking for
   * twelve players could make the headline number drift upward, which would be
   * the one number on the page changing for a reason the visitor cannot see.
   */
  const smallest =
    requested === undefined
      ? grouping
      : (searchFromLowerBound(pitchIds, conflicts, maxPerPlayer, lowerBound) ?? grouping)
  const minimumPlayers = smallest.length

  return {
    type: 'feasible',
    players,
    assignments,
    maxSimultaneous,
    minimumPlayers,
    peak,
    minimumDriver: driverFor(minimumPlayers, peak, pitchIds.length, maxPerPlayer),
  }
}

/**
 * Which of the three bounds actually forced the minimum.
 *
 * Overlap is checked first and reported when it alone is enough, because it is
 * the honest answer whenever it is true — the notes really do sound together and
 * really do need that many hands. The other two are what remain when they don't.
 */
function driverFor(
  minimumPlayers: number,
  peak: Peak,
  distinctPitches: number,
  maxAngklungPerPlayer: number,
): MinimumDriver {
  if (peak.count >= minimumPlayers && peak.count > 0) {
    return { type: 'tumpang-tindih', peak }
  }
  if (Math.ceil(distinctPitches / maxAngklungPerPlayer) >= minimumPlayers) {
    return { type: 'jumlah-nada', distinctPitches, maxAngklungPerPlayer }
  }
  return { type: 'penempatan', distinctPitches }
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

/**
 * Which population a player belongs to.
 *
 * A real angklung ensemble is two kinds of job. A melody player holds one or two
 * notes and spends most of the piece waiting. An accompanist holds one chord and
 * plays almost continuously — and their little finger is a chord-quality switch
 * (PRD §2). "Waiting is most of the job" is true of the first and false of the
 * second, and an ensemble view with only melody players teaches half a room.
 */
export type PlayerRole = 'melodi' | 'akompanimen'

export interface RosterPlayer extends PlayerPart {
  readonly role: PlayerRole
}

/**
 * Two distributions standing in one room.
 *
 * The accompaniment is solved by the same `distribute` as the melody, because it
 * is the same constraint problem — one instrument, one thing at a time, one pair
 * of hands that has to be free. Combining is only re-indexing: accompanists sit
 * after melody players so the roster is one list and one person is one number.
 */
export interface Ensemble {
  readonly players: readonly RosterPlayer[]
  readonly assignments: readonly NoteAssignment[]
  readonly melodyPlayers: number
  readonly akompanimenPlayers: number
  readonly totalPlayers: number
}

export function combineEnsemble(
  melody: DistributionResult,
  akompanimen: DistributionResult | null,
): Ensemble | null {
  if (melody.type !== 'feasible') return null
  if (akompanimen !== null && akompanimen.type !== 'feasible') return null

  const melodyPlayers: RosterPlayer[] = melody.players.map((player) => ({
    ...player,
    role: 'melodi',
  }))

  if (akompanimen === null) {
    return {
      players: melodyPlayers,
      assignments: melody.assignments,
      melodyPlayers: melodyPlayers.length,
      akompanimenPlayers: 0,
      totalPlayers: melodyPlayers.length,
    }
  }

  const offset = melodyPlayers.length
  const akompanimenPlayers: RosterPlayer[] = akompanimen.players.map((player) => ({
    ...player,
    playerIndex: player.playerIndex + offset,
    role: 'akompanimen',
  }))
  const akompanimenAssignments = akompanimen.assignments.map((assignment) => ({
    ...assignment,
    playerIndex: assignment.playerIndex + offset,
  }))

  return {
    players: [...melodyPlayers, ...akompanimenPlayers],
    assignments: [...melody.assignments, ...akompanimenAssignments],
    melodyPlayers: melodyPlayers.length,
    akompanimenPlayers: akompanimenPlayers.length,
    totalPlayers: melodyPlayers.length + akompanimenPlayers.length,
  }
}

/**
 * What an absent player costs.
 *
 * A rehearsal is not a full room. Someone is ill, someone is late, and the piece
 * still has to be attempted — so the ensemble view can take a player out and hear
 * the result. The notes they were holding do not vanish quietly: they come back
 * here, named, in the same spirit as invariant 9. The solver never drops a note,
 * and neither does this. It reports one that has nobody to play it.
 */
export interface AbsenceReport {
  readonly absentPlayers: readonly number[]
  /** The assignments that now have nobody holding them, in melody order. */
  readonly silenced: readonly NoteAssignment[]
  readonly totalNotes: number
  /** Fraction of the piece that goes unplayed, 0–1. */
  readonly silencedShare: number
}

export function reportAbsence(
  source: DistributionResult | Ensemble,
  absentPlayers: Iterable<number>,
): AbsenceReport {
  const absent = [...new Set(absentPlayers)].sort((a, b) => a - b)
  // An Ensemble is always feasible by construction; a DistributionResult is not.
  if ('type' in source && source.type !== 'feasible') {
    return { absentPlayers: absent, silenced: [], totalNotes: 0, silencedShare: 0 }
  }

  const missing = new Set(absent)
  const silenced = source.assignments.filter((assignment) => missing.has(assignment.playerIndex))
  const totalNotes = source.assignments.length

  return {
    absentPlayers: absent,
    silenced,
    totalNotes,
    silencedShare: totalNotes === 0 ? 0 : silenced.length / totalNotes,
  }
}

/**
 * Whether one pitch could share a pair of hands with another, and if not, where
 * the two collide.
 *
 * This is the rule the whole distribution turns on, stated once (PRD §6): two
 * angklung can go to one person exactly when their notes never sound at the same
 * time. `distribute` has always applied it — `buildConflictGraph` below is
 * nothing else — but it applied it privately, so the interface could show a
 * roster without ever showing why that roster.
 *
 * `clashAtSec` is the evidence: the first instant at which the two are needed
 * together. A rule with a worked instance beside it is a rule someone can check.
 */
export interface PitchCompatibility {
  readonly pitchId: string
  readonly compatible: boolean
  readonly clashAtSec: number | null
}

export function compatibilityWith(
  notes: readonly TimedNote[],
  pitchId: string,
): readonly PitchCompatibility[] {
  const mine = notes.filter((note) => note.pitchId === pitchId)
  const others = [...new Set(notes.map((note) => note.pitchId))].filter((id) => id !== pitchId)

  return others.map((other) => {
    const theirs = notes.filter((note) => note.pitchId === other)
    let clashAtSec: number | null = null
    for (const a of mine) {
      for (const b of theirs) {
        if (!overlaps(a, b)) continue
        const at = Math.max(a.startSec, b.startSec)
        if (clashAtSec === null || at < clashAtSec) clashAtSec = at
      }
    }
    return { pitchId: other, compatible: clashAtSec === null, clashAtSec }
  })
}

/** One player's part, for the play-your-part view. */
export function partFor(result: DistributionResult, playerIndex: number): PlayerPart | null {
  if (result.type !== 'feasible') return null
  return result.players.find((player) => player.playerIndex === playerIndex) ?? null
}

/**
 * The three sentences that explain an infeasibility, as `{placeholder}` templates.
 *
 * The wording used to be hardcoded Indonesian here, so an English visitor who
 * asked for too few players was told `Butuh 8 pemain, tersedia 3`. Invariant 9
 * exists so that infeasibility is *reported* rather than resolved by truncation,
 * and a report in a language the reader may not have is most of the way back to
 * not reporting it.
 *
 * The templates are passed in rather than imported, so this file still knows
 * nothing about locales — the UI supplies the strings, and the mapping from
 * reason to sentence stays here where the union is.
 */
export interface InfeasibilityCopy {
  readonly infeasibleOutsideSet: string
  readonly infeasibleSelfOverlap: string
  readonly infeasibleTooFewPlayers: string
}

/** Human-readable. The UI never invents its own wording for these. */
export function describeInfeasibility(reason: Infeasibility, copy: InfeasibilityCopy): string {
  switch (reason.type) {
    case 'nada-di-luar-set':
      return fill(copy.infeasibleOutsideSet, {
        pitchId: reason.pitchId,
        count: reason.noteIndexes.length,
      })
    case 'nada-bertumpuk-sendiri':
      return fill(copy.infeasibleSelfOverlap, { pitchId: reason.pitchId })
    case 'pemain-kurang':
      return fill(copy.infeasibleTooFewPlayers, {
        needed: reason.needed,
        available: reason.available,
      })
    default: {
      const exhaustive: never = reason
      throw new Error(`Alasan tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}
