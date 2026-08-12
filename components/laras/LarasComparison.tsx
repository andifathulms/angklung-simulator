'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, Field, NumberInput, Select } from '@/components/ui'
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
      {/*
        * Two sections, and the heading levels now say which is which. The three
        * tuning cards were h2 at step-2 and the comparison that follows them was
        * h2 at step-3 — the same document level at two ranks, with the sibling
        * reading as the parent. The cards are h3 under a named section, and the
        * comparison is the h2 they build towards.
        */}
      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="font-display text-step-3">{dict.laras.oneAtATime}</h2>
          <p className="max-w-3xl text-step-0 text-ink-muted">{dict.laras.samePhrase}</p>
          {/*
            * What a cent is, before the page asks anyone to edit one.
            *
            * This page invites a visitor to type numbers into a field labelled
            * "sen"/"cents" and hear the tuning change, and the unit was never
            * defined anywhere on the site — so the invitation was only open to
            * people who already knew. Stated here rather than in a glossary,
            * because here is where the first cents value appears.
            */}
          <p className="max-w-readable text-step--1 leading-relaxed text-ink-faint">
            {dict.laras.centsExplained}
          </p>
        </div>

        {/*
          * Four rows, shared across all three cards.
          *
          * Each card is its own box with its own content lengths, so the play
          * button sat at a different height in each one, the cents editors
          * started at three different places and the sources never lined up.
          * The eye reads that as three unrelated panels rather than one
          * comparison.
          *
          * grid-rows-subgrid opts each card into the parent's row track, so
          * heading, button, editor and source line up straight across —
          * without inventing a fixed height that longer copy would spill out
          * of. Single column below lg, where there is nothing to align to.
          */}
        <div className="grid gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr_auto]">
          {TUNINGS.map((tuning) => {
            const definition = tuned(tuning)
            const isPlaying = playingId === tuning.id
            const degreeIndexes = PENTATONIC_DEGREE_INDEX[tuning.laras]

            return (
              <article
                key={tuning.id}
                className="surface-raised flex flex-col gap-4 rounded-lg border border-stage-line bg-stage-raised/70 p-5 lg:row-span-4 lg:grid lg:grid-rows-subgrid lg:gap-4"
              >
                <header className="space-y-2">
                  <h3 className="font-display text-step-2 text-sounding">{tuning.name}</h3>
                  <p className="text-step--1 leading-relaxed text-ink-muted">{tuning.description}</p>
                </header>

                <Button
                  tone="primary"
                  size="sm"
                  className="self-start"
                  disabled={status !== 'siap'}
                  onClick={() => (isPlaying ? stop() : playPhrase(tuning))}
                >
                  {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
                </Button>

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
                          <NumberInput
                            step={1}
                            value={degree.cents}
                            aria-label={`${degree.name} — ${dict.laras.cents}`}
                            onChange={(event) =>
                              setEdits((current) => ({
                                ...current,
                                [tuning.id]: {
                                  ...(current[tuning.id] ?? {}),
                                  [degreeIndex]: Number(event.target.value),
                                },
                              }))
                            }
                            className="w-24 px-2 py-1"
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
                  <Button
                    tone="ghost"
                    size="sm"
                    className="-ml-3"
                    onClick={() =>
                      setEdits((current) => {
                        const next = { ...current }
                        delete next[tuning.id]
                        return next
                      })
                    }
                  >
                    {dict.laras.reset}
                  </Button>
                ) : null}
              </div>

              <footer className="space-y-1 border-t border-stage-line pt-3 text-step--2 leading-relaxed text-ink-faint">
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
      </section>

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
            <Field label={dict.laras.togetherFirst}>
              <Select value={firstLaras} onChange={(event) => setFirstLaras(event.target.value)}>
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id}>
                    {tuning.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={dict.laras.togetherSecond}>
              <Select value={secondLaras} onChange={(event) => setSecondLaras(event.target.value)}>
                {TUNINGS.map((tuning) => (
                  <option key={tuning.id} value={tuning.id}>
                    {tuning.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Button
              tone="primary"
              size="md"
              disabled={status !== 'siap'}
              onClick={() =>
                playingId === TOGETHER_KEY
                  ? stop()
                  : playPhrases([pair.a, pair.b], TOGETHER_KEY)
              }
            >
              <span aria-hidden="true">{playingId === TOGETHER_KEY ? '■' : '▶'}</span>
              {playingId === TOGETHER_KEY ? dict.ansambel.stop : dict.laras.togetherPlay}
            </Button>
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
