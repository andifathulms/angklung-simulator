'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button } from '@/components/ui'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { compatibilityWith, distribute } from '@/lib/distribute'
import type { TimedNote } from '@/lib/melody'
import { buildSet, findByPitchId, getSet } from '@/lib/set'
import type { AngklungInSet } from '@/lib/set'
import { fill } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

/**
 * One case, worked end to end, before the reader touches a control.
 *
 * The site could demonstrate its claim — press play, hear eight angklung — and
 * could not explain it. A visitor who wanted to know *how* the split is decided
 * had only the roster to stare at. This is the missing four sentences: four
 * notes, three pitches, one comparison per pair, an answer.
 *
 * Everything numeric here comes from `distribute` and `compatibilityWith`, the
 * same functions the ensemble page runs. Nothing is written by hand, so the
 * worked example cannot drift away from the thing it claims to explain — if the
 * solver ever changed, this page would change with it.
 */

/**
 * Deliberately the smallest phrase that still shows the rule doing something
 * non-obvious: C4 collides with both of the others, while E4 and G4 never meet
 * and so travel together. Two people, not three.
 */
const EXAMPLE: readonly TimedNote[] = [
  { pitchId: 'C4', startSec: 0, durationSec: 1, index: 0 },
  { pitchId: 'E4', startSec: 0.5, durationSec: 1, index: 1 },
  { pitchId: 'G4', startSec: 2, durationSec: 1, index: 2 },
  { pitchId: 'C4', startSec: 2.5, durationSec: 1, index: 3 },
]

const TOTAL_SEC = 3.5
const PX_PER_SEC = 92

export function WorkedExample({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [playing, setPlaying] = useState(false)
  const schedulerRef = useRef<Scheduler<AngklungInSet> | null>(null)

  const set = useMemo(() => buildSet(getSet('melodi-diatonis')), [])
  const result = useMemo(() => distribute({ notes: EXAMPLE, set }), [set])
  const pitchIds = useMemo(() => [...new Set(EXAMPLE.map((note) => note.pitchId))], [])

  /** Every unordered pair, each compared once, with the instant of any collision. */
  const pairs = useMemo(
    () =>
      pitchIds.flatMap((pitchId, index) =>
        compatibilityWith(EXAMPLE, pitchId)
          .filter((entry) => pitchIds.indexOf(entry.pitchId) > index)
          .map((entry) => ({ a: pitchId, ...entry })),
      ),
    [pitchIds],
  )

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    setPlaying(false)
    releaseAll()
  }, [releaseAll])

  const listen = useCallback(() => {
    if (engine === null) return
    stop()
    setPlaying(true)
    const scheduler = createScheduler<AngklungInSet>({
      clock: audioClock(engine.context),
      timer: intervalTimer(),
      onEvent: (event, audioTimeSec) => {
        play({
          angklung: event.payload.spec,
          techniqueType: 'kurulung',
          atSec: audioTimeSec,
          durationSec: 1,
          gain: 0.5,
        })
      },
      onFinished: () => {
        schedulerRef.current = null
        setPlaying(false)
      },
    })
    schedulerRef.current = scheduler
    scheduler.start(
      EXAMPLE.flatMap((note) => {
        const angklung = findByPitchId(set, note.pitchId)
        return angklung === null ? [] : [{ timeSec: note.startSec, payload: angklung }]
      }),
    )
  }, [engine, play, set, stop])

  const players = result.type === 'feasible' ? result.minimumPlayers : null

  return (
    <section className="space-y-6 rounded-card border border-stage-line bg-stage-raised/40 p-6 sm:p-8">
      <div className="space-y-2">
        <h2 className="text-step-3">{dict.contoh.title}</h2>
        <p className="max-w-readable text-step-0 leading-relaxed text-ink-muted">
          {dict.contoh.lede}
        </p>
      </div>

      {/* Step one: the notes in time. Drawn to the same scale as the real
          timeline, so the shape a reader learns here is the shape they meet
          again on the ensemble page. */}
      <div className="space-y-2">
        <p className="text-step-0 text-ink">{dict.contoh.step1}</p>
        <div className="overflow-x-auto">
          <ul className="relative min-w-max space-y-1" style={{ width: TOTAL_SEC * PX_PER_SEC }}>
            {pitchIds.map((pitchId) => (
              <li key={pitchId} className="relative h-8">
                <span className="absolute -left-0 top-1 z-10 font-mono text-step--1 text-ink-faint">
                  {pitchId}
                </span>
                {EXAMPLE.filter((note) => note.pitchId === pitchId).map((note) => (
                  <span
                    key={note.index}
                    className="absolute top-0 flex h-7 items-center justify-end rounded-sm bg-bamboo/70 pr-1.5 font-mono text-step--2 text-ink-inverse"
                    style={{
                      left: note.startSec * PX_PER_SEC,
                      width: note.durationSec * PX_PER_SEC - 3,
                    }}
                  >
                    {note.startSec}–{note.startSec + note.durationSec}s
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </div>
        <p className="font-mono text-step--2 text-ink-faint">
          {dict.contoh.pitchesLabel}: {pitchIds.join(' · ')}
        </p>
      </div>

      {/* Step two: the comparison, one line per pair — the intermediate value
          the ensemble page never used to show. */}
      <div className="space-y-2">
        <p className="text-step-0 text-ink">{dict.contoh.step2}</p>
        <ul className="space-y-1">
          {pairs.map((pair) => (
            <li
              key={`${pair.a}-${pair.pitchId}`}
              className={[
                'rounded border px-3 py-1.5 font-mono text-step--1',
                pair.compatible
                  ? 'border-yourPart/40 text-yourPart-light'
                  : 'border-stage-strong text-ink-muted',
              ].join(' ')}
            >
              {pair.compatible
                ? fill(dict.contoh.clearLine, { a: pair.a, b: pair.pitchId })
                : fill(dict.contoh.clashLine, {
                    a: pair.a,
                    b: pair.pitchId,
                    atSec: (pair.clashAtSec ?? 0).toFixed(1),
                  })}
            </li>
          ))}
        </ul>
      </div>

      {/* Step three, and the answer. */}
      <div className="space-y-3">
        <p className="max-w-readable text-step-0 leading-relaxed text-ink">{dict.contoh.step3}</p>
        <p className="font-display text-step-3 text-sounding">
          {fill(dict.contoh.answer, { players: players ?? '—' })}
        </p>
        <ul className="flex flex-wrap gap-2">
          {(result.type === 'feasible' ? result.players : []).map((player) => (
            <li
              key={player.playerIndex}
              className="rounded-full border border-stage-strong px-3 py-1 font-mono text-step--1 text-ink-muted"
            >
              {dict.ansambel.player} {player.playerIndex + 1} ·{' '}
              {player.angklung.map((angklung) => angklung.pitchId).join(' + ')}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          tone="secondary"
          size="md"
          disabled={status !== 'siap'}
          onClick={() => (playing ? stop() : listen())}
        >
          <span aria-hidden="true">{playing ? '■' : '▶'}</span>
          {playing ? dict.ansambel.stop : dict.contoh.listen}
        </Button>
      </div>

      <p className="max-w-readable border-l-2 border-stage-strong pl-4 text-step--1 leading-relaxed text-ink-faint">
        {dict.contoh.caveat}
      </p>
    </section>
  )
}
