import type { MelodyNote } from './index'

/**
 * Melody entry: one note per line, `pitch startBeat lengthBeats`.
 *
 * Parsing reports every bad line rather than skipping it. Silently dropping a line
 * the user typed is the same failure as silently dropping a note from an
 * arrangement, and this project does not do either.
 */
export interface ParseProblem {
  readonly line: number
  readonly text: string
  readonly message: string
}

export interface ParseResult {
  readonly notes: readonly MelodyNote[]
  readonly problems: readonly ParseProblem[]
}

export function parseMelodyText(text: string): ParseResult {
  const notes: MelodyNote[] = []
  const problems: ParseProblem[] = []

  text.split('\n').forEach((raw, index) => {
    const line = index + 1
    // Blank lines and # comments are structure, not errors.
    const trimmed = raw.split('#')[0]?.trim() ?? ''
    if (trimmed === '') return

    const parts = trimmed.split(/[\s,]+/)
    const [pitchId, startText, lengthText] = parts

    if (parts.length !== 3 || pitchId === undefined) {
      problems.push({
        line,
        text: raw,
        message: 'Butuh tiga bagian: nama nada, ketukan mulai, panjang ketukan.',
      })
      return
    }

    const startBeat = Number(startText)
    const durationBeats = Number(lengthText)

    if (!Number.isFinite(startBeat) || startBeat < 0) {
      problems.push({ line, text: raw, message: `Ketukan mulai tidak sah: "${startText}".` })
      return
    }
    if (!Number.isFinite(durationBeats) || durationBeats <= 0) {
      problems.push({ line, text: raw, message: `Panjang ketukan tidak sah: "${lengthText}".` })
      return
    }

    notes.push({ pitchId, startBeat, durationBeats })
  })

  return { notes, problems }
}

/** The inverse, so a distribution can be handed back as text. */
export function formatMelodyText(notes: readonly MelodyNote[]): string {
  return notes
    .map((note) => `${note.pitchId} ${trimNumber(note.startBeat)} ${trimNumber(note.durationBeats)}`)
    .join('\n')
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}
