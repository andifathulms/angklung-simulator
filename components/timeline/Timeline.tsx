'use client'

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

  return (
    <div className="overflow-x-auto">
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
                <span className="sr-only">
                  {dict.ansambel.player} {player.playerIndex + 1}
                </span>
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
  )
}
