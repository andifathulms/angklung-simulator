'use client'

import { fill } from '@/lib/i18n'
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
  /*
   * The cue, in words, for anyone who cannot see it.
   *
   * This lane is the conductor, and it encoded its meaning entirely as size and
   * cue amber — so a screen reader user got nothing at all from the one view
   * whose whole subject is coming in on time (WCAG 4.1.3, and 1.4.1 since
   * "imminent" was colour and size only).
   *
   * Only the nearest cue is announced, and only in whole beats. The lane is
   * recomputed from the audio clock every frame; announcing six numbers at 60fps
   * would produce noise rather than information, whereas a number that changes
   * when the number changes is exactly what a conductor's hand is.
   */
  const next = upcoming[0]
  const announcement =
    next === undefined
      ? dict.ansambel.cueNone
      : fill(dict.ansambel.cueAnnounce, {
          nomor: next.assignment.angklung.spec.nomor,
          beats: Math.max(0, Math.round(next.inSec / beatSec)),
        })

  return (
    <div className="rounded-lg border border-stage-line bg-stage-raised/70 p-4">
      <p className="font-mono text-step--2 uppercase tracking-widest text-ink-faint">
        {dict.ansambel.cueLane}
      </p>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <ol aria-hidden="true" className="mt-3 flex min-h-[3.5rem] items-baseline gap-4">
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
