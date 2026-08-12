'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Rack } from '@/components/rack/Rack'
import { CueLane } from '@/components/timeline/CueLane'
import { Timeline } from '@/components/timeline/Timeline'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, Card, Field, SegmentedControl, Select, Stat } from '@/components/ui'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { describeInfeasibility, distribute } from '@/lib/distribute'
import type { NoteAssignment } from '@/lib/distribute'
import { MELODIES, getMelody, melodyDurationSec, toTimedNotes } from '@/lib/melody'
import { buildSet, getSet } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

type Mode = 'dengar' | 'bagian-anda' | 'semua-bagian'

const MODES: readonly Mode[] = ['dengar', 'bagian-anda', 'semua-bagian']

/** How far ahead a cue lights, in beats. A conductor signals a number one beat early. */
const CUE_LEAD_BEATS = 1
const COUNT_IN_CHOICES = [0, 2, 4] as const

export function EnsembleView({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [melodyId, setMelodyId] = useState('bintang-kecil')
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('dengar')
  const [yourPlayerIndex, setYourPlayerIndex] = useState(0)
  const [positionSec, setPositionSec] = useState<number | null>(null)
  const [bpm, setBpm] = useState<number | null>(null)
  const [countInBeats, setCountInBeats] = useState<number>(4)

  const schedulerRef = useRef<Scheduler<NoteAssignment | null> | null>(null)
  const frameRef = useRef<number | null>(null)

  const melody = useMemo(() => getMelody(melodyId), [melodyId])
  const set = useMemo(() => buildSet(getSet(melody.setId)), [melody.setId])
  const tempo = bpm ?? melody.bpm
  const beatSec = 60 / tempo
  const countInSec = countInBeats * beatSec
  const notes = useMemo(() => toTimedNotes(melody, tempo), [melody, tempo])
  const durationSec = useMemo(() => melodyDurationSec(melody, tempo), [melody, tempo])

  const result = useMemo(
    () => distribute({ notes, set, ...(playerCount === null ? {} : { playerCount }) }),
    [notes, set, playerCount],
  )

  const minimumPlayers = result.type === 'feasible' ? result.minimumPlayers : null

  const yourPart =
    result.type === 'feasible'
      ? (result.players.find((player) => player.playerIndex === yourPlayerIndex) ?? null)
      : null

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    setPositionSec(null)
    releaseAll()
  }, [releaseAll])

  useEffect(() => stop, [stop])
  // Changing what is being played stops what is playing. Nothing continues under
  // a distribution it no longer matches.
  useEffect(() => {
    stop()
  }, [melodyId, playerCount, mode, tempo, countInBeats, stop])

  const start = useCallback(() => {
    if (engine === null || result.type !== 'feasible') return
    stop()

    const scheduler = createScheduler<NoteAssignment | null>({
      clock: audioClock(engine.context),
      timer: intervalTimer(),
      onEvent: (event, audioTimeSec) => {
        const assignment = event.payload
        if (assignment === null) {
          // Count-in. A centok on the lowest angklung in the set, quiet — the
          // conductor's beat, made of the same instrument as everything else.
          const lowest = set[0]
          if (lowest !== undefined) {
            play({
              angklung: lowest.spec,
              techniqueType: 'centok',
              atSec: audioTimeSec,
              hardness: 0.9,
              gain: 0.22,
            })
          }
          return
        }
        if (mode === 'semua-bagian') return
        if (mode === 'bagian-anda' && assignment.playerIndex === yourPlayerIndex) return
        play({
          angklung: assignment.angklung.spec,
          techniqueType: 'kurulung',
          atSec: audioTimeSec,
          durationSec: assignment.note.durationSec,
          gain: 0.55,
        })
      },
      onFinished: () => {
        schedulerRef.current = null
        setPositionSec(null)
      },
    })

    schedulerRef.current = scheduler
    scheduler.start([
      ...Array.from({ length: countInBeats }, (_, beat) => ({
        timeSec: beat * beatSec,
        payload: null,
      })),
      ...result.assignments.map((assignment) => ({
        timeSec: countInSec + assignment.note.startSec,
        payload: assignment,
      })),
    ])

    // The playhead reads the audio clock too, so what you see is what you hear.
    const followPlayhead = () => {
      const current = schedulerRef.current
      if (current === null) return
      setPositionSec(current.positionSec())
      frameRef.current = requestAnimationFrame(followPlayhead)
    }
    frameRef.current = requestAnimationFrame(followPlayhead)
  }, [beatSec, countInBeats, countInSec, engine, mode, play, result, set, stop, yourPlayerIndex])

  /** What the conductor is about to signal, from the audio clock's position. */
  const upcoming = useMemo(() => {
    if (result.type !== 'feasible' || positionSec === null) return []
    const relevant =
      mode === 'bagian-anda'
        ? result.assignments.filter(
            (assignment) => assignment.playerIndex === yourPlayerIndex,
          )
        : result.assignments
    return relevant
      .map((assignment) => ({
        assignment,
        inSec: countInSec + assignment.note.startSec - positionSec,
      }))
      .filter((entry) => entry.inSec >= -0.05 && entry.inSec < beatSec * 6)
      .slice(0, 6)
  }, [beatSec, countInSec, mode, positionSec, result, yourPlayerIndex])

  const cuedNumber =
    upcoming.find((entry) => entry.inSec <= beatSec * CUE_LEAD_BEATS)?.assignment.angklung.spec
      .nomor ?? null

  const isPlaying = positionSec !== null

  return (
    <div className="space-y-8">
      <Card className="flex flex-wrap items-end gap-x-7 gap-y-5">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow">{dict.ansambel.melodyLabel}</span>
          <select
            value={melodyId}
            onChange={(event) => setMelodyId(event.target.value)}
            className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
          >
            {MELODIES.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow">{dict.ansambel.playersLabel}</span>
          <select
            value={playerCount === null ? 'min' : String(playerCount)}
            onChange={(event) =>
              setPlayerCount(event.target.value === 'min' ? null : Number(event.target.value))
            }
            className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
          >
            <option value="min">{dict.ansambel.minimum}</option>
            {Array.from({ length: 16 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="min-w-0">
          <legend className="eyebrow mb-1.5">{dict.ansambel.mode}</legend>
          <div className="inline-flex flex-wrap gap-1 rounded-full border border-stage-line bg-stage p-1">
            {MODES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setMode(candidate)}
                aria-pressed={mode === candidate}
                className={
                  mode === candidate
                    ? 'rounded-full bg-bamboo px-3.5 py-1.5 text-step--1 text-ink-inverse shadow-raised'
                    : 'rounded-full px-3.5 py-1.5 text-step--1 text-ink-muted transition hover:text-ink'
                }
              >
                {candidate === 'dengar'
                  ? dict.ansambel.listen
                  : candidate === 'bagian-anda'
                    ? dict.ansambel.yourPart
                    : dict.ansambel.everyPart}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow">{dict.ansambel.tempo}</span>
          <span className="flex items-center gap-2">
            <input
              type="range"
              min={40}
              max={180}
              step={1}
              value={tempo}
              onChange={(event) => setBpm(Number(event.target.value))}
              className="w-32 accent-bamboo"
            />
            <span className="font-mono text-step-0 tabular-nums text-sounding">{tempo}</span>
          </span>
        </label>

        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="eyebrow">{dict.ansambel.countIn}</span>
          <select
            value={countInBeats}
            onChange={(event) => setCountInBeats(Number(event.target.value))}
            className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
          >
            {COUNT_IN_CHOICES.map((beats) => (
              <option key={beats} value={beats}>
                {beats}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={status !== 'siap' || result.type !== 'feasible'}
          onClick={() => (isPlaying ? stop() : start())}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sounding px-5 py-2.5 text-step-0 font-medium text-ink-inverse shadow-raised transition duration-200 ease-physical hover:bg-sounding-glow active:translate-y-px disabled:opacity-40"
        >
          <span aria-hidden="true">{isPlaying ? '■' : '▶'}</span>
          {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
        </button>
      </Card>

      <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
        {mode === 'dengar'
          ? dict.ansambel.listenHint
          : mode === 'bagian-anda'
            ? dict.ansambel.yourPartHint
            : dict.ansambel.everyPartHint}
      </p>

      {result.type === 'infeasible' ? (
        <section className="space-y-2 rounded-lg border border-cue/60 bg-cue/10 p-5">
          <h2 className="font-display text-step-2 text-cue-light">{dict.ansambel.infeasible}</h2>
          <ul className="space-y-1 text-step-0 text-ink-muted">
            {result.reasons.map((reason, index) => (
              <li key={index}>{describeInfeasibility(reason)}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-card border border-stage-line bg-stage-raised/60 px-6 py-5">
            <Stat
              value={String(minimumPlayers ?? '—')}
              label={`${dict.ansambel.needs} ${dict.ansambel.player.toLowerCase()}`}
              tone="sounding"
            />
            <Stat value={String(result.players.length)} label={dict.ansambel.playersLabel} />
            <Stat value={String(melody.notes.length)} label={dict.ansambel.notesCount} />
            <Stat value={`${Math.round(durationSec)}s`} label={melody.title} />
          </div>

          <CueLane upcoming={upcoming} beatSec={beatSec} dict={dict} />

          <section className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <ol className="space-y-1">
              {result.players.map((player) => {
                const isYours = player.playerIndex === yourPlayerIndex
                const restShare =
                  1 -
                  player.notes.reduce((total, note) => total + note.durationSec, 0) /
                    Math.max(durationSec, 0.001)
                return (
                  <li key={player.playerIndex}>
                    <button
                      type="button"
                      onClick={() => setYourPlayerIndex(player.playerIndex)}
                      aria-pressed={isYours}
                      className={[
                        'flex w-full items-baseline justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left text-step-0 transition duration-200 ease-physical',
                        isYours
                          ? 'border-yourPart bg-yourPart/10 text-yourPart-light'
                          : 'border-stage-line bg-stage-raised/50 text-ink-muted hover:border-bamboo/60 hover:bg-stage-hover',
                      ].join(' ')}
                    >
                      <span className="font-mono">
                        {dict.ansambel.player} {player.playerIndex + 1}
                      </span>
                      <span className="font-mono text-step--1">
                        {player.angklung.length === 0
                          ? dict.ansambel.holdsNothing
                          : player.angklung.map((angklung) => angklung.spec.nomor).join(' · ')}
                      </span>
                      <span className="font-mono text-step--1 text-ink-faint">
                        {Math.round(restShare * 100)}% {dict.ansambel.rests}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <Timeline
              players={result.players}
              durationSec={durationSec}
              positionSec={positionSec}
              yourPlayerIndex={yourPlayerIndex}
              dict={dict}
            />
          </section>

          {mode !== 'dengar' ? (
            <section className="space-y-3">
              <h2 className="font-display text-step-2 text-sounding">
                {mode === 'bagian-anda' ? dict.ansambel.yourPart : dict.ansambel.everyPart}
              </h2>
              {mode === 'semua-bagian' ? (
                <p className="max-w-2xl text-step-0 text-ink-muted">{dict.ansambel.cannotAlone}</p>
              ) : null}
              <Rack
                set={
                  mode === 'bagian-anda'
                    ? (yourPart?.angklung ?? [])
                    : set
                }
                technique="kurulung"
                numberLabel={dict.rak.nomor}
                yourPartNumbers={(yourPart?.angklung ?? []).map((angklung) => angklung.spec.nomor)}
                cuedNumber={cuedNumber}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
