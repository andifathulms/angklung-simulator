'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { getMelody, toTimedNotes } from '@/lib/melody'
import {
  PENTATONIC_DEGREE_INDEX,
  TUNINGS,
  compareTunings,
  pitchToHz,
  widestGap,
  withEditedCents,
} from '@/lib/tuning'
import type { TuningDefinition } from '@/lib/tuning'
import { angklungMelodi } from '@/lib/synth'
import type { AngklungSpec } from '@/lib/synth'
import { fill } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

/**
 * The same phrase, three laras. The phrase is written once as five scale degrees,
 * and each laras supplies its own cents — so the only thing that changes between
 * the three is the tuning, which is the whole comparison (PRD §5.8).
 *
 * The five-degree reading itself now lives in `lib/tuning/compare`, next to the
 * arithmetic that uses it.
 */
const TOGETHER_KEY = 'bersama'

const SEED = 20250812

export function LarasComparison({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [edits, setEdits] = useState<Record<string, Record<number, number>>>({})
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [firstLaras, setFirstLaras] = useState('padaeng')
  const [secondLaras, setSecondLaras] = useState('salendro')
  const schedulerRef = useRef<Scheduler<AngklungSpec> | null>(null)

  const phrase = useMemo(() => {
    // Written once, in salendro's degree names, and read as degree numbers.
    const melody = getMelody('latihan-salendro')
    const names = ['da', 'mi', 'na', 'ti', 'la']
    return toTimedNotes(melody).map((note) => {
      const match = /^(.+?)(-?\d+)$/.exec(note.pitchId)
      const degree = names.indexOf(match?.[1] ?? '')
      return {
        degree: degree < 0 ? 0 : degree,
        octave: Number.parseInt(match?.[2] ?? '4', 10),
        startSec: note.startSec,
        durationSec: note.durationSec,
      }
    })
  }, [])

  const tuned = useCallback(
    (tuning: TuningDefinition): TuningDefinition => {
      const edited = edits[tuning.id]
      if (edited === undefined) return tuning
      return withEditedCents(
        tuning,
        new Map(Object.entries(edited).map(([index, cents]) => [Number(index), cents])),
      )
    },
    [edits],
  )

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    setPlayingId(null)
    releaseAll()
  }, [releaseAll])

  /**
   * Play the phrase in one or more laras at once.
   *
   * One scheduler covers all of them, so two tunings sounding together are two
   * events on the same audio clock rather than two clocks that will drift apart —
   * and drift is exactly what would be mistaken for the beating this is meant to
   * demonstrate.
   */
  const playPhrases = useCallback(
    (tunings: readonly TuningDefinition[], playingKey: string) => {
      if (engine === null || tunings.length === 0) return
      stop()
      const definitions = tunings.map(tuned)
      // Two instruments in the same room are not twice as loud as one.
      const gain = 0.5 / Math.sqrt(definitions.length)

      const scheduler = createScheduler<AngklungSpec>({
        clock: audioClock(engine.context),
        timer: intervalTimer(),
        onEvent: (event, audioTimeSec) => {
          play({
            angklung: event.payload,
            techniqueType: 'kurulung',
            atSec: audioTimeSec,
            durationSec: 0.55,
            gain,
          })
        },
        onFinished: () => setPlayingId(null),
      })

      schedulerRef.current = scheduler
      setPlayingId(playingKey)
      scheduler.start(
        definitions.flatMap((definition) => {
          const degreeIndexes = PENTATONIC_DEGREE_INDEX[definition.laras]
          return phrase.map((note) => {
            const degreeIndex = degreeIndexes[note.degree] ?? 0
            const rootHz = pitchToHz(definition, { degreeIndex, octave: note.octave })
            return {
              timeSec: note.startSec,
              payload: angklungMelodi({
                id: `${definition.id}-${degreeIndex}-${note.octave}-${rootHz.toFixed(2)}`,
                nomor: note.degree + 1,
                rootHz,
                label: `${definition.degrees[degreeIndex]?.name ?? ''}${note.octave}`,
              }),
            }
          })
        }),
      )
    },
    [engine, phrase, play, stop, tuned],
  )

  const playPhrase = useCallback(
    (tuning: TuningDefinition) => playPhrases([tuning], tuning.id),
    [playPhrases],
  )

  const pair = useMemo(() => {
    const a = TUNINGS.find((tuning) => tuning.id === firstLaras) ?? TUNINGS[0]
    const b = TUNINGS.find((tuning) => tuning.id === secondLaras) ?? TUNINGS[1]
    if (a === undefined || b === undefined) return null
    const comparisons = compareTunings(tuned(a), tuned(b))
    return { a, b, comparisons, worst: widestGap(comparisons) }
  }, [firstLaras, secondLaras, tuned])

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-step-0 text-ink-muted">{dict.laras.samePhrase}</p>

      <div className="grid gap-5 lg:grid-cols-3">
        {TUNINGS.map((tuning) => {
          const definition = tuned(tuning)
          const isPlaying = playingId === tuning.id
          const degreeIndexes = PENTATONIC_DEGREE_INDEX[tuning.laras]

          return (
            <article
              key={tuning.id}
              className="flex flex-col gap-4 rounded-lg border border-stage-line bg-stage-raised/70 p-5"
            >
              <header className="space-y-2">
                <h2 className="font-display text-step-2 text-sounding">{tuning.name}</h2>
                <p className="text-step--1 leading-relaxed text-ink-muted">{tuning.description}</p>
              </header>

              <button
                type="button"
                disabled={status !== 'siap'}
                onClick={() => (isPlaying ? stop() : playPhrase(tuning))}
                className="inline-flex self-start items-center justify-center gap-2 rounded-full bg-sounding px-4 py-2 text-step--1 font-medium text-ink-inverse shadow-raised transition duration-200 ease-physical hover:bg-sounding-glow active:translate-y-px disabled:opacity-40"
              >
                {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
              </button>

              <div className="space-y-1">
                <p className="font-mono text-step--2 uppercase tracking-widest text-ink-faint">
                  {dict.laras.edit}
                </p>
                <ul className="space-y-1">
                  {degreeIndexes.map((degreeIndex) => {
                    const degree = definition.degrees[degreeIndex]
                    if (degree === undefined) return null
                    return (
                      <li key={degreeIndex} className="flex items-center gap-2 font-mono text-step--1">
                        <span className="w-10 text-ink-muted">{degree.name}</span>
                        <input
                          type="number"
                          step={1}
                          value={degree.cents}
                          onChange={(event) =>
                            setEdits((current) => ({
                              ...current,
                              [tuning.id]: {
                                ...(current[tuning.id] ?? {}),
                                [degreeIndex]: Number(event.target.value),
                              },
                            }))
                          }
                          className="w-20 rounded-lg border border-stage-line bg-stage px-2 py-1 text-right tabular-nums text-ink transition hover:border-stage-strong focus:border-bamboo"
                        />
                        <span className="text-ink-faint">{dict.laras.cents}</span>
                        <span className="tabular-nums text-ink-faint">
                          {pitchToHz(definition, { degreeIndex, octave: 4 }).toFixed(1)} Hz
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {edits[tuning.id] !== undefined ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEdits((current) => {
                        const next = { ...current }
                        delete next[tuning.id]
                        return next
                      })
                    }
                    className="text-step--1 text-ink-faint underline underline-offset-4 hover:text-sounding"
                  >
                    {dict.laras.reset}
                  </button>
                ) : null}
              </div>

              <footer className="mt-auto space-y-1 border-t border-stage-line pt-3 text-step--2 leading-relaxed text-ink-faint">
                <p className="font-mono uppercase tracking-widest">{dict.laras.source}</p>
                <p>{tuning.source.title}</p>
                <p>{tuning.source.note}</p>
                <p className="border-l-2 border-cue/60 pl-2 text-ink-muted">
                  {tuning.source.caveat}
                </p>
                {(tuning.source.urls ?? []).map((url) => (
                  <a
                    key={url}
                    className="block truncate underline underline-offset-2 hover:text-sounding"
                    href={url}
                    rel="noreferrer noopener"
                    target="_blank"
                  >
                    {url}
                  </a>
                ))}
              </footer>
            </article>
          )
        })}
      </div>

      {/*
        * Sequential comparison is the friendly version, and it hides the point.
        * Played one after another all three laras sound equally pleasant, which
        * is exactly why the page could argue in prose that a set tuned one way
        * cannot join an ensemble tuned another and never let anyone hear it.
        * Here they sound at the same time, on the same clock, and the arithmetic
        * behind the roughness is printed next to it.
        */}
      {pair !== null ? (
        <section className="space-y-5 rounded-card border border-stage-line bg-stage-raised/60 p-5 sm:p-7">
          <div className="space-y-3">
            <h2 className="font-display text-step-3 text-sounding">{dict.laras.togetherTitle}</h2>
            <p className="max-w-readable text-step-0 leading-relaxed text-ink-muted">
              {dict.laras.togetherBody}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="eyebrow">{dict.laras.togetherFirst}</span>
              <select
                value={firstLaras}
                onChange={(event) => setFirstLaras(event.target.value)}
                className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
              >
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id}>
                    {tuning.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex min-w-0 flex-col gap-1.5">
              <span className="eyebrow">{dict.laras.togetherSecond}</span>
              <select
                value={secondLaras}
                onChange={(event) => setSecondLaras(event.target.value)}
                className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
              >
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id}>
                    {tuning.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={status !== 'siap'}
              onClick={() =>
                playingId === TOGETHER_KEY
                  ? stop()
                  : playPhrases([pair.a, pair.b], TOGETHER_KEY)
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sounding px-5 py-2.5 text-step-0 font-medium text-ink-inverse shadow-raised transition duration-200 ease-physical hover:bg-sounding-glow active:translate-y-px disabled:opacity-40"
            >
              <span aria-hidden="true">{playingId === TOGETHER_KEY ? '■' : '▶'}</span>
              {playingId === TOGETHER_KEY ? dict.ansambel.stop : dict.laras.togetherPlay}
            </button>
          </div>

          {pair.a.id === pair.b.id ? (
            <p className="text-step-0 text-ink-faint">{dict.laras.togetherSame}</p>
          ) : (
            <>
              <p className="max-w-readable text-step-0 leading-relaxed text-ink">
                {fill(dict.laras.togetherApart, {
                  cents: Math.abs(pair.worst?.centsApart ?? 0).toFixed(0),
                  degree: `${pair.worst?.nameA ?? ''} / ${pair.worst?.nameB ?? ''}`,
                  beats: (pair.worst?.beatHz ?? 0).toFixed(1),
                })}
              </p>

              <ul className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {pair.comparisons.map((entry) => (
                  <li
                    key={entry.slot}
                    className="flex items-baseline justify-between gap-3 rounded-lg border border-stage-line px-3 py-2 font-mono text-step--1"
                  >
                    <span className="text-ink-muted">
                      {entry.nameA} / {entry.nameB}
                    </span>
                    <span className="tabular-nums text-ink">
                      {entry.centsApart >= 0 ? '+' : '−'}
                      {Math.abs(entry.centsApart).toFixed(0)} {dict.laras.cents}
                    </span>
                    <span className="tabular-nums text-ink-faint">
                      {entry.beatHz.toFixed(1)} {dict.laras.beats}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="max-w-readable border-l-2 border-stage-strong pl-4 text-step--1 leading-relaxed text-ink-faint">
            {dict.laras.togetherModel}
          </p>
        </section>
      ) : null}

      <p className="max-w-3xl rounded border border-cue/40 bg-cue/5 p-4 text-step-0 leading-relaxed text-ink-muted">
        {dict.laras.notAuthority}
      </p>
    </div>
  )
}
