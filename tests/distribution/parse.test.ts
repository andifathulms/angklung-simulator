import { describe, expect, it } from 'vitest'
import { formatMelodyText, parseMelodyText } from '@/lib/melody/parse'
import { getMelody } from '@/lib/melody'

describe('melody entry', () => {
  it('reads one note per line', () => {
    const result = parseMelodyText('C4 0 1\nD4 1 0.5\n')
    expect(result.problems).toEqual([])
    expect(result.notes).toEqual([
      { pitchId: 'C4', startBeat: 0, durationBeats: 1 },
      { pitchId: 'D4', startBeat: 1, durationBeats: 0.5 },
    ])
  })

  it('treats blank lines and comments as structure, not error', () => {
    const result = parseMelodyText('# bagian A\n\nC4 0 1\n')
    expect(result.problems).toEqual([])
    expect(result.notes).toHaveLength(1)
  })

  it('reports every bad line rather than skipping it', () => {
    const result = parseMelodyText('C4 0\nD4 x 1\nE4 0 -1\nF4 3 1')
    expect(result.notes).toEqual([{ pitchId: 'F4', startBeat: 3, durationBeats: 1 }])
    expect(result.problems.map((problem) => problem.line)).toEqual([1, 2, 3])
  })

  it('round-trips a shipped melody', () => {
    const melody = getMelody('bintang-kecil')
    const result = parseMelodyText(formatMelodyText(melody.notes))
    expect(result.problems).toEqual([])
    expect(result.notes).toEqual(melody.notes)
  })
})
