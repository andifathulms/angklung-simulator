'use client'

import type { NoteAssignment } from '@/lib/distribute'
import type { Dictionary } from '@/lib/i18n'

/**
 * The conductor's lane. An angklung conductor signals numbers with their hands, so
 * the cue is a number arriving a beat ahead — cue amber, and nothing else in the
 * interface uses that colour (PRD §5.5, §8).
 */
export interface CueLaneProps {
  readonly upcoming: readonly { assignment: NoteAssignment; inSec: number }[]
  readonly beatSec: number
  readonly dict: Dictionary
}

export function CueLane({ upcoming, beatSec, dict }: CueLaneProps) {
  return (
    <div className="rounded-lg border border-rattan/50 bg-rattan/5 p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
        {dict.ansambel.cueLane}
      </p>
      <ol className="mt-3 flex min-h-[3.5rem] items-baseline gap-4">
        {upcoming.length === 0 ? (
          <li className="font-mono text-sm text-bamboo/35">—</li>
        ) : (
          upcoming.map(({ assignment, inSec }, index) => {
            // Within one beat, the conductor's hand is already up.
            const imminent = inSec <= beatSec
            return (
              <li
                key={`${assignment.note.index}-${index}`}
                className={[
                  'font-mono tabular-nums transition-colors',
                  imminent ? 'text-4xl text-cue' : 'text-2xl text-bamboo/45',
                ].join(' ')}
              >
                {assignment.angklung.spec.nomor}
                <span className="ml-1 text-[11px] text-bamboo/40">{inSec.toFixed(1)}s</span>
              </li>
            )
          })
        )}
      </ol>
    </div>
  )
}
