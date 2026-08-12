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
  readonly dict: Dictionary
}

export function Timeline({
  players,
  durationSec,
  positionSec,
  yourPlayerIndex,
  dict,
}: TimelineProps) {
  const width = Math.max(320, durationSec * PX_PER_SEC + 24)

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-max" style={{ width }}>
        {/* One tick per second. The grid is the only thing behind a rest. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {Array.from({ length: Math.ceil(durationSec) + 1 }, (_, second) => (
            <div
              key={second}
              className="absolute top-0 h-full border-l border-rattan/25"
              style={{ left: second * PX_PER_SEC }}
            />
          ))}
        </div>

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
            return (
              <li
                key={player.playerIndex}
                className="relative border-b border-rattan/20"
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
                      isYours ? 'bg-yourPart' : 'bg-bamboo/70',
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
