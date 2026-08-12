'use client'

import { fill } from '@/lib/i18n'
import type { PlayerPart } from '@/lib/distribute'
import type { Dictionary } from '@/lib/i18n'

/**
 * Parts, notes, and rests. Rests are drawn as space rather than as marks, because
 * that is what waiting feels like — and for an angklung player the waiting is most
 * of the job (PRD §5.2).
 */
const PX_PER_SEC = 46
const ROW_HEIGHT = 34

export interface TimelineProps {
  readonly players: readonly PlayerPart[]
  readonly durationSec: number
  readonly positionSec: number | null
  readonly yourPlayerIndex: number | null
  /** The instant that forces the ensemble size, when the visitor asks to see it. */
  readonly peakSec?: number | null
  readonly peakNoteIndexes?: readonly number[]
  /** Players who are not in the room. Their notes are drawn as the space they leave. */
  readonly absentPlayers?: readonly number[]
  readonly dict: Dictionary
}

export function Timeline({
  players,
  durationSec,
  positionSec,
  yourPlayerIndex,
  peakSec = null,
  peakNoteIndexes = [],
  absentPlayers = [],
  dict,
}: TimelineProps) {
  const width = Math.max(320, durationSec * PX_PER_SEC + 24)
  const atPeak = new Set(peakNoteIndexes)
  const missing = new Set(absentPlayers)

  /*
   * Four encodings can be on this chart at once — jade fill, bamboo fill, dashed
   * outline, ink ring — and none of them was labelled anywhere. A visitor who
   * pressed "why this number?" watched a dashed rule appear with no way to learn
   * what it marked.
   *
   * Only the active ones are listed. A key to things that are not on screen is
   * its own kind of noise.
   */
  const keys: readonly { swatch: string; label: string }[] = [
    ...(yourPlayerIndex !== null
      ? [{ swatch: 'bg-yourPart', label: dict.ansambel.legendYours }]
      : []),
    { swatch: 'bg-bamboo/70', label: dict.ansambel.legendOthers },
    ...(missing.size > 0
      ? [
          {
            swatch: 'border border-dashed border-ink-faint',
            label: dict.ansambel.legendAbsent,
          },
        ]
      : []),
    ...(peakSec !== null
      ? [{ swatch: 'bg-bamboo/70 ring-1 ring-ink', label: dict.ansambel.legendPeak }]
      : []),
  ]

  return (
    <div className="space-y-2.5">
      <ul
        aria-label={dict.ansambel.legend}
        className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      >
        {keys.map((key) => (
          <li key={key.label} className="flex items-center gap-1.5 text-step--2 text-ink-faint">
            <span aria-hidden="true" className={`h-2.5 w-4 shrink-0 rounded-sm ${key.swatch}`} />
            {key.label}
          </li>
        ))}
      </ul>

      {/*
        * The chart in words, and the chart itself hidden from assistive tech.
        *
        * Every note used to be a non-focusable <span title="C4 · 2.00s">, so a
        * screen reader heard the row's player name and then silence, and a
        * keyboard user could not reach the tooltips at all (WCAG 1.3.1).
        *
        * The fix is not to make sixty-six spans focusable. A note-by-note
        * reading of a rhythm is worse than no reading; what the chart is *for*
        * is the shape — how many notes, when you come in, how much of the piece
        * you spend waiting — and that is three numbers per row, already
        * computed. So the picture is aria-hidden and the shape is a list.
        */}
      <ul className="sr-only">
        {players.map((player) => {
          const first = player.notes[0]
          const sounding = player.notes.reduce((total, note) => total + note.durationSec, 0)
          return (
            <li key={player.playerIndex}>
              {dict.ansambel.player} {player.playerIndex + 1}
              {missing.has(player.playerIndex) ? ` — ${dict.ansambel.legendAbsent}` : ''} —{' '}
              {fill(dict.ansambel.rowSummary, {
                notes: player.notes.length,
                first: first === undefined ? 0 : first.startSec.toFixed(1),
                rest: Math.round((1 - sounding / Math.max(durationSec, 0.001)) * 100),
              })}
            </li>
          )
        })}
      </ul>

      <div aria-hidden="true" className="overflow-x-auto">
        <div className="relative min-w-max" style={{ width }}>
          {/* One tick per second. The grid is the only thing behind a rest. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            {Array.from({ length: Math.ceil(durationSec) + 1 }, (_, second) => (
              <div
                key={second}
                className="absolute top-0 h-full border-l border-stage-line/70"
                style={{ left: second * PX_PER_SEC }}
              />
            ))}
          </div>

          {/*
            * The forcing instant, drawn in plain ink and dashed.
            *
            * Not cue amber, not sounding, not jade: those four colours carry one
            * meaning each (invariant 12) and this is none of them. It is an
            * annotation about the structure of the piece rather than a signal
            * about the state of an instrument, so it gets the neutral.
            */}
          {peakSec !== null ? (
            <div
              className="pointer-events-none absolute top-0 z-10 h-full border-l border-dashed border-ink/70"
              style={{ left: peakSec * PX_PER_SEC }}
              aria-hidden="true"
            />
          ) : null}

          {positionSec !== null && positionSec >= 0 ? (
            <div
              className="pointer-events-none absolute top-0 z-10 h-full w-px bg-sounding"
              style={{ left: positionSec * PX_PER_SEC }}
              aria-hidden="true"
            />
          ) : null}

          <ol className="relative">
            {players.map((player) => {
              const isYours = player.playerIndex === yourPlayerIndex
              /*
               * An absent player's notes are drawn as outlines: the shape of the
               * note with nothing in it. Not the muted colour, which means a tube
               * held silent under tengkep and nothing else (invariant 12) — this
               * is a note nobody is holding, which is a different fact.
               */
              const isAbsent = missing.has(player.playerIndex)
              return (
                <li
                  key={player.playerIndex}
                  className="relative border-b border-stage-line/60"
                  style={{ height: ROW_HEIGHT }}
                >
                  {player.notes.map((note) => (
                    <span
                      key={`${note.index}-${note.pitchId}`}
                      title={`${note.pitchId} · ${note.startSec.toFixed(2)}s`}
                      className={[
                        'absolute top-1.5 rounded-sm',
                        isAbsent
                          ? 'border border-dashed border-ink-faint bg-transparent'
                          : isYours
                            ? 'bg-yourPart'
                            : 'bg-bamboo/70',
                        atPeak.has(note.index) ? 'ring-1 ring-ink' : '',
                      ].join(' ')}
                      style={{
                        left: note.startSec * PX_PER_SEC,
                        width: Math.max(4, note.durationSec * PX_PER_SEC - 2),
                        height: ROW_HEIGHT - 12,
                      }}
                    />
                  ))}
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </div>
  )
}
