'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AngklungFigure } from '@/components/rack/AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, Stat } from '@/components/ui'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { distribute } from '@/lib/distribute'
import type { NoteAssignment } from '@/lib/distribute'
import { getMelody, melodyDurationSec, pitchesUsed, toTimedNotes } from '@/lib/melody'
import { buildSet, getSet, relativeTubeLength } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

/**
 * The first thing a visitor meets, and it has one job: PRD §11 asks that someone
 * can hear why one person cannot play a melody alone within two interactions.
 *
 * Interaction one sounds an angklung. Interaction two plays a whole song across
 * eight of them and puts the number of people it takes on the screen. Everything
 * else on the home page is elaboration on those two taps.
 */
export function HeroDemo({ dict }: { dict: Dictionary }) {
  const { status, start, play, releaseAll, engine, warm } = useAudio()
  const [touched, setTouched] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [litNumbers, setLitNumbers] = useState<readonly number[]>([])
  const schedulerRef = useRef<Scheduler<NoteAssignment> | null>(null)

  const set = useMemo(() => buildSet(getSet('melodi-diatonis')), [])
  const melody = useMemo(() => getMelody('bintang-kecil'), [])

  const result = useMemo(
    () => distribute({ notes: toTimedNotes(melody), set }),
    [melody, set],
  )
  const players = result.type === 'feasible' ? result.minimumPlayers : null

  useEffect(() => {
    if (status !== 'siap') return
    warm(set.map((entry) => entry.spec))
  }, [set, status, warm])

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    setPlaying(false)
    setLitNumbers([])
    releaseAll()
  }, [releaseAll])

  useEffect(() => stop, [stop])

  /**
   * Sound one angklung of the set.
   *
   * Reached from a pointer and from the keyboard, and it has to be both: a
   * `<button>` activated with Enter or Space fires `click`, never `pointerdown`,
   * so wiring only `onPointerDown` — which is what this did — left eight
   * focusable controls on the landing page that visibly took focus and then made
   * no sound. AngklungButton has always handled both; this was a copy of it that
   * dropped the keyboard half.
   */
  const soundOne = useCallback(
    async (index: number) => {
      if (status !== 'siap') await start()
      setTouched(true)
      const entry = set[index]
      if (entry === undefined) return
      play({ angklung: entry.spec, techniqueType: 'kurulung', durationSec: 1.1, gain: 0.6 })
    },
    [play, set, start, status],
  )

  /** Interaction two: the whole song, and the count of people it takes. */
  const playMelody = useCallback(() => {
    if (engine === null || result.type !== 'feasible') return
    stop()
    setPlaying(true)

    const scheduler = createScheduler<NoteAssignment>({
      clock: audioClock(engine.context),
      timer: intervalTimer(),
      onEvent: (event, audioTimeSec) => {
        const assignment = event.payload
        play({
          angklung: assignment.angklung.spec,
          techniqueType: 'kurulung',
          atSec: audioTimeSec,
          durationSec: assignment.note.durationSec,
          gain: 0.5,
        })
      },
      onFinished: () => {
        schedulerRef.current = null
        setPlaying(false)
        setLitNumbers([])
      },
    })

    schedulerRef.current = scheduler
    scheduler.start(
      result.assignments.map((assignment) => ({
        timeSec: assignment.note.startSec,
        payload: assignment,
      })),
    )

    // Which angklung are sounding right now, read off the audio clock so the
    // lights cannot drift away from the notes.
    const follow = () => {
      const current = schedulerRef.current
      if (current === null) return
      const at = current.positionSec()
      if (at !== null) {
        setLitNumbers(
          result.assignments
            .filter(
              (assignment) =>
                at >= assignment.note.startSec &&
                at < assignment.note.startSec + assignment.note.durationSec,
            )
            .map((assignment) => assignment.angklung.spec.nomor),
        )
      }
      requestAnimationFrame(follow)
    }
    requestAnimationFrame(follow)
  }, [engine, play, result, stop])

  const durationSec = melodyDurationSec(melody)
  const lit = new Set(litNumbers)

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-stage-line bg-stage-raised/70 p-5 shadow-lifted sm:p-7">
        {/* The instrument, drawn to scale. Tube length goes as 1/f, so this is the
            physical logic of the set and not a decorative ramp. */}
        <div className="flex items-start justify-center gap-[2px] sm:gap-2">
          {set.map((entry, index) => {
            const sounding = lit.has(entry.spec.nomor)
            return (
              <button
                key={entry.spec.id}
                type="button"
                // Pointer first, because latency on a percussion instrument is
                // the whole feel of it; keys separately, because a button
                // activated from the keyboard never emits a pointer event.
                onPointerDown={(event) => {
                  event.preventDefault()
                  void soundOne(index)
                }}
                onKeyDown={(event) => {
                  if (event.key !== ' ' && event.key !== 'Enter') return
                  if (event.repeat) return
                  event.preventDefault()
                  void soundOne(index)
                }}
                aria-label={`${dict.rak.nomor} ${entry.spec.nomor} — ${entry.spec.label}`}
                className="group flex min-w-0 flex-1 flex-col items-center gap-2 rounded-lg p-0.5 transition-transform duration-200 ease-physical hover:-translate-y-0.5 sm:p-1"
              >
                <span
                  className={
                    sounding
                      ? 'angklung-sway block w-full max-w-[3.375rem]'
                      : 'block w-full max-w-[3.375rem]'
                  }
                  style={{ ['--sway-period' as string]: '400ms' }}
                >
                  <AngklungFigure
                    angklung={entry.spec}
                    relativeLength={relativeTubeLength(entry.spec.rootHz, set)}
                    sounding={sounding}
                    tengkep={false}
                    className="h-auto w-full"
                  />
                </span>
                <span
                  className={
                    sounding
                      ? 'font-mono text-step--1 text-sounding'
                      : 'font-mono text-step--1 text-ink-faint group-hover:text-ink-muted'
                  }
                >
                  {entry.spec.nomor}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {!touched ? (
            <Button tone="primary" size="lg" onClick={() => void soundOne(4)}>
              <span aria-hidden="true">♪</span>
              {status === 'menyalakan' ? dict.hero.starting : dict.hero.try}
            </Button>
          ) : (
            <Button
              tone={playing ? 'secondary' : 'primary'}
              size="lg"
              onClick={() => (playing ? stop() : playMelody())}
            >
              <span aria-hidden="true">{playing ? '■' : '▶'}</span>
              {playing ? dict.hero.stop : dict.hero.playMelody}
            </Button>
          )}
        </div>

        {/*
          * The line under the button used to explain the browser's autoplay
          * policy to someone who had not yet formed the intention to play
          * anything, and only offered the invitation — "tap any angklung" —
          * after they had already worked out that the tubes were tappable.
          * Inverted. The invitation comes first at reading weight; the policy
          * note drops to label size beneath it, and only until sound is on.
          */}
        <p className="mt-3 text-center text-step--1 text-ink-muted">
          {touched ? dict.hero.tapHint : dict.hero.tapInvite}
        </p>
        {!touched && status !== 'siap' ? (
          <p className="mx-auto mt-1.5 max-w-prose text-center text-step--2 text-ink-faint">
            {dict.audio.hint}
          </p>
        ) : null}
      </div>

      {/*
        * The answer, revealed only once they have heard the song. Stating it up
        * front would be a claim; stating it after is a demonstration.
        *
        * But the panel itself is now here from the start, with its figures held
        * at em dashes. Withholding the answer is the point; withholding the
        * question meant a visitor who never tapped never learned there was one,
        * and that is most visitors. The labels ask it — this song needs _
        * people — and playing it answers.
        *
        * Keyed so the reveal remounts and `rise-in` actually plays, rather than
        * animating on load as decoration.
        */}
      <div
        key={touched ? 'resolved' : 'pending'}
        /*
         * The figures fill in when the melody finishes, which is the whole
         * demonstration — and it happened silently. Polite, so it waits for the
         * music rather than interrupting it (WCAG 4.1.3).
         */
        aria-live="polite"
        className={
          touched
            ? 'rise-in rounded-card border border-bamboo/30 bg-bamboo/[0.06] p-5 sm:p-6'
            : 'rounded-card border border-stage-line bg-stage-raised/40 p-5 sm:p-6'
        }
      >
        <p className="eyebrow">{dict.hero.step2Title}</p>
        <div className="mt-4 flex flex-wrap items-end gap-8">
          <Stat
            value={touched ? String(players ?? '—') : '—'}
            label={`${dict.hero.needs} ${dict.hero.people}`}
            tone={touched ? 'sounding' : 'pending'}
          />
          <Stat
            value={touched ? String(pitchesUsed(melody).length) : '—'}
            label={dict.hero.distinctNotes}
            tone={touched ? 'default' : 'pending'}
          />
          <Stat
            value={touched ? `${durationSec.toFixed(0)}s` : '—'}
            label={melody.title}
            tone={touched ? 'default' : 'pending'}
          />
        </div>
        <p className="mt-4 max-w-prose text-step-0 leading-relaxed text-ink-muted">
          {touched ? dict.hero.punchline : dict.hero.awaiting}
        </p>
      </div>
    </div>
  )
}
