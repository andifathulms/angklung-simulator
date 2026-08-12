import type { TimedNote } from '@/lib/melody'

/**
 * An independent, deliberately naive minimum-players calculation: enumerate every
 * way of splitting the distinct pitches into groups and take the smallest count
 * that works. Exponential, so it is only ever run on the small fixtures — its job
 * is to disagree with the real solver if the real solver is clever and wrong.
 */
export function bruteForceMinimumPlayers(
  notes: readonly TimedNote[],
  maxAngklungPerPlayer: number,
): number {
  const pitchIds = [...new Set(notes.map((note) => note.pitchId))]
  if (pitchIds.length === 0) return 0

  const notesFor = (pitchId: string) => notes.filter((note) => note.pitchId === pitchId)
  const overlaps = (a: TimedNote, b: TimedNote) =>
    a.startSec < b.startSec + b.durationSec && b.startSec < a.startSec + a.durationSec

  const compatible = (left: string, right: string) =>
    !notesFor(left).some((a) => notesFor(right).some((b) => overlaps(a, b)))

  let best = pitchIds.length

  const assign = (index: number, groups: string[][]): void => {
    if (groups.length >= best) return
    if (index === pitchIds.length) {
      best = Math.min(best, groups.length)
      return
    }
    const pitchId = pitchIds[index] as string

    for (const group of groups) {
      if (group.length >= maxAngklungPerPlayer) continue
      if (!group.every((member) => compatible(member, pitchId))) continue
      group.push(pitchId)
      assign(index + 1, groups)
      group.pop()
    }

    groups.push([pitchId])
    assign(index + 1, groups)
    groups.pop()
  }

  assign(0, [])
  return best
}
