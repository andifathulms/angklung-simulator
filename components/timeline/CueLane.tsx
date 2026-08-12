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
    <div className="rounded-lg border border-stage-line bg-stage-raised/70 p-4">
      <p className="font-mono text-step--2 uppercase tracking-widest text-ink-faint">
        {dict.ansambel.cueLane}
      </p>
      <ol className="mt-3 flex min-h-[3.5rem] items-baseline gap-4">
        {upcoming.length === 0 ? (
          <li className="font-mono text-step-0 text-ink-faint">—</li>
        ) : (
          upcoming.map(({ assignment, inSec }, index) => {
            // Within one beat, the conductor's hand is already up.
            const imminent = inSec <= beatSec
            return (
              <li
                key={`${assignment.note.index}-${index}`}
                className={[
                  'font-mono tabular-nums transition-colors',
                  imminent ? 'text-step-4 text-cue-light' : 'text-step-2 text-ink-faint',
                ].join(' ')}
              >
                {assignment.angklung.spec.nomor}
                <span className="ml-1 text-step--2 text-ink-faint">{inSec.toFixed(1)}s</span>
              </li>
            )
          })
        )}
      </ol>
    </div>
  )
}
