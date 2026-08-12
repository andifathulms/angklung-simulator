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

  /** Interaction one: sound arrives, with no vocabulary required first. */
  const soundOne = useCallback(async () => {
    if (status !== 'siap') await start()
    setTouched(true)
    const entry = set[4]
    if (entry === undefined) return
    play({ angklung: entry.spec, techniqueType: 'kurulung', durationSec: 1.1, gain: 0.6 })
  }, [play, set, start, status])

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
          {set.map((entry) => {
            const sounding = lit.has(entry.spec.nomor)
            return (
              <button
                key={entry.spec.id}
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault()
                  void (async () => {
                    if (status !== 'siap') await start()
                    setTouched(true)
                    play({
                      angklung: entry.spec,
                      techniqueType: 'kurulung',
                      durationSec: 1.1,
                      gain: 0.6,
                    })
                  })()
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
            <Button tone="primary" size="lg" onClick={() => void soundOne()}>
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

        <p className="mt-3 text-center text-step--1 text-ink-faint">
          {touched ? dict.hero.tapHint : dict.audio.hint}
        </p>
      </div>

      {/* The answer, revealed only once they have heard the song. Stating it up
          front would be a claim; stating it after is a demonstration. */}
      {touched ? (
        <div className="rise-in rounded-card border border-bamboo/30 bg-bamboo/[0.06] p-5 sm:p-6">
          <p className="eyebrow">{dict.hero.step2Title}</p>
          <div className="mt-4 flex flex-wrap items-end gap-8">
            <Stat
              value={String(players ?? '—')}
              label={`${dict.hero.needs} ${dict.hero.people}`}
              tone="sounding"
            />
            <Stat value={String(pitchesUsed(melody).length)} label={dict.hero.distinctNotes} />
            <Stat value={`${durationSec.toFixed(0)}s`} label={melody.title} />
          </div>
          <p className="mt-4 max-w-prose text-step-0 leading-relaxed text-ink-muted">
            {dict.hero.punchline}
          </p>
        </div>
      ) : null}
    </div>
  )
}
