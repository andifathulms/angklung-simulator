'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Rack } from '@/components/rack/Rack'
import { Timeline } from '@/components/timeline/Timeline'
import { useAudio } from '@/components/audio/AudioProvider'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { describeInfeasibility, distribute } from '@/lib/distribute'
import type { NoteAssignment } from '@/lib/distribute'
import { MELODIES, getMelody, melodyDurationSec, toTimedNotes } from '@/lib/melody'
import { buildSet, getSet } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

type Mode = 'dengar' | 'bagian-anda' | 'semua-bagian'

const MODES: readonly Mode[] = ['dengar', 'bagian-anda', 'semua-bagian']

export function EnsembleView({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [melodyId, setMelodyId] = useState('bintang-kecil')
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('dengar')
  const [yourPlayerIndex, setYourPlayerIndex] = useState(0)
  const [positionSec, setPositionSec] = useState<number | null>(null)

  const schedulerRef = useRef<Scheduler<NoteAssignment> | null>(null)
  const frameRef = useRef<number | null>(null)

  const melody = useMemo(() => getMelody(melodyId), [melodyId])
  const set = useMemo(() => buildSet(getSet(melody.setId)), [melody.setId])
  const notes = useMemo(() => toTimedNotes(melody), [melody])
  const durationSec = useMemo(() => melodyDurationSec(melody), [melody])

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
  }, [melodyId, playerCount, mode, stop])

  const start = useCallback(() => {
    if (engine === null || result.type !== 'feasible') return
    stop()

    const scheduler = createScheduler<NoteAssignment>({
      clock: audioClock(engine.context),
      timer: intervalTimer(),
      onEvent: (event, audioTimeSec) => {
        const assignment = event.payload
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
    scheduler.start(
      result.assignments.map((assignment) => ({
        timeSec: assignment.note.startSec,
        payload: assignment,
      })),
    )

    // The playhead reads the audio clock too, so what you see is what you hear.
    const followPlayhead = () => {
      const current = schedulerRef.current
      if (current === null) return
      setPositionSec(current.positionSec())
      frameRef.current = requestAnimationFrame(followPlayhead)
    }
    frameRef.current = requestAnimationFrame(followPlayhead)
  }, [engine, mode, play, result, stop, yourPlayerIndex])

  const isPlaying = positionSec !== null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-1 text-xs text-bamboo/60">
          {dict.ansambel.melodyLabel}
          <select
            value={melodyId}
            onChange={(event) => setMelodyId(event.target.value)}
            className="rounded border border-rattan bg-stage px-3 py-1.5 text-sm text-sounding"
          >
            {MELODIES.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-bamboo/60">
          {dict.ansambel.playersLabel}
          <select
            value={playerCount === null ? 'min' : String(playerCount)}
            onChange={(event) =>
              setPlayerCount(event.target.value === 'min' ? null : Number(event.target.value))
            }
            className="rounded border border-rattan bg-stage px-3 py-1.5 text-sm text-sounding"
          >
            <option value="min">{dict.ansambel.minimum}</option>
            {Array.from({ length: 16 }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-xs text-bamboo/60">
          <legend className="mb-1">{dict.ansambel.mode}</legend>
          <div className="flex flex-wrap gap-1">
            {MODES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setMode(candidate)}
                aria-pressed={mode === candidate}
                className={
                  mode === candidate
                    ? 'rounded border border-sounding bg-sounding/15 px-3 py-1.5 text-sm text-sounding'
                    : 'rounded border border-rattan px-3 py-1.5 text-sm text-bamboo/70 hover:text-sounding'
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

        <button
          type="button"
          disabled={status !== 'siap' || result.type !== 'feasible'}
          onClick={() => (isPlaying ? stop() : start())}
          className="rounded-full bg-sounding px-5 py-2 text-sm font-medium text-stage transition hover:bg-bamboo disabled:opacity-40"
        >
          {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
        </button>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-bamboo/70">
        {mode === 'dengar'
          ? dict.ansambel.listenHint
          : mode === 'bagian-anda'
            ? dict.ansambel.yourPartHint
            : dict.ansambel.everyPartHint}
      </p>

      {result.type === 'infeasible' ? (
        <section className="space-y-2 rounded-lg border border-cue/60 bg-cue/10 p-5">
          <h2 className="font-display text-2xl text-cue">{dict.ansambel.infeasible}</h2>
          <ul className="space-y-1 text-sm text-bamboo/80">
            {result.reasons.map((reason, index) => (
              <li key={index}>{describeInfeasibility(reason)}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <p className="font-mono text-sm text-sounding">
            {dict.ansambel.needs} {minimumPlayers} {dict.ansambel.player.toLowerCase()} ·{' '}
            {result.players.length} {dict.ansambel.player.toLowerCase()} · {melody.notes.length}{' '}
            {dict.ansambel.notesCount}
          </p>

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
                        'flex w-full items-baseline justify-between gap-3 rounded border px-3 py-1.5 text-left text-sm transition',
                        isYours
                          ? 'border-yourPart bg-yourPart/10 text-yourPart'
                          : 'border-rattan/50 text-bamboo/75 hover:border-bamboo/60',
                      ].join(' ')}
                    >
                      <span className="font-mono">
                        {dict.ansambel.player} {player.playerIndex + 1}
                      </span>
                      <span className="font-mono text-xs">
                        {player.angklung.length === 0
                          ? dict.ansambel.holdsNothing
                          : player.angklung.map((angklung) => angklung.spec.nomor).join(' · ')}
                      </span>
                      <span className="font-mono text-xs text-bamboo/45">
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
              <h2 className="font-display text-2xl text-sounding">
                {mode === 'bagian-anda' ? dict.ansambel.yourPart : dict.ansambel.everyPart}
              </h2>
              {mode === 'semua-bagian' ? (
                <p className="max-w-2xl text-sm text-bamboo/70">{dict.ansambel.cannotAlone}</p>
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
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
