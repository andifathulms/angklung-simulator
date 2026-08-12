'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import { getMelody, toTimedNotes } from '@/lib/melody'
import { TUNINGS, pitchToHz, withEditedCents } from '@/lib/tuning'
import type { Laras, TuningDefinition } from '@/lib/tuning'
import { angklungMelodi } from '@/lib/synth'
import type { AngklungSpec } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

/**
 * The same phrase, three laras. The phrase is written once as five scale degrees,
 * and each laras supplies its own cents — so the only thing that changes between
 * the three is the tuning, which is the whole comparison (PRD §5.8).
 *
 * Padaeng is diatonic-chromatic, so its five-degree reading is the pentatonic
 * subset C-D-E-G-A. That is a choice made for comparability and is stated as one,
 * not as an equivalence between the tunings.
 */
const PENTATONIC_DEGREE_INDEX: Record<Laras, readonly number[]> = {
  padaeng: [0, 2, 4, 7, 9],
  salendro: [0, 1, 2, 3, 4],
  'pelog-degung': [0, 1, 2, 3, 4],
}

const SEED = 20250812

export function LarasComparison({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [edits, setEdits] = useState<Record<string, Record<number, number>>>({})
  const [playingId, setPlayingId] = useState<string | null>(null)
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

  const playPhrase = useCallback(
    (tuning: TuningDefinition) => {
      if (engine === null) return
      stop()
      const definition = tuned(tuning)
      const degreeIndexes = PENTATONIC_DEGREE_INDEX[definition.laras]

      const scheduler = createScheduler<AngklungSpec>({
        clock: audioClock(engine.context),
        timer: intervalTimer(),
        onEvent: (event, audioTimeSec) => {
          play({
            angklung: event.payload,
            techniqueType: 'kurulung',
            atSec: audioTimeSec,
            durationSec: 0.55,
            gain: 0.5,
          })
        },
        onFinished: () => setPlayingId(null),
      })

      schedulerRef.current = scheduler
      setPlayingId(definition.id)
      scheduler.start(
        phrase.map((note) => {
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
        }),
      )
    },
    [engine, phrase, play, stop, tuned],
  )

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm text-bamboo/70">{dict.laras.samePhrase}</p>

      <div className="grid gap-5 lg:grid-cols-3">
        {TUNINGS.map((tuning) => {
          const definition = tuned(tuning)
          const isPlaying = playingId === tuning.id
          const degreeIndexes = PENTATONIC_DEGREE_INDEX[tuning.laras]

          return (
            <article
              key={tuning.id}
              className="flex flex-col gap-4 rounded-lg border border-rattan/60 bg-rattan/5 p-5"
            >
              <header className="space-y-2">
                <h2 className="font-display text-2xl text-sounding">{tuning.name}</h2>
                <p className="text-xs leading-relaxed text-bamboo/65">{tuning.description}</p>
              </header>

              <button
                type="button"
                disabled={status !== 'siap'}
                onClick={() => (isPlaying ? stop() : playPhrase(tuning))}
                className="self-start rounded-full bg-sounding px-4 py-1.5 text-sm font-medium text-stage transition hover:bg-bamboo disabled:opacity-40"
              >
                {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
              </button>

              <div className="space-y-1">
                <p className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
                  {dict.laras.edit}
                </p>
                <ul className="space-y-1">
                  {degreeIndexes.map((degreeIndex) => {
                    const degree = definition.degrees[degreeIndex]
                    if (degree === undefined) return null
                    return (
                      <li key={degreeIndex} className="flex items-center gap-2 font-mono text-xs">
                        <span className="w-10 text-bamboo/70">{degree.name}</span>
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
                          className="w-20 rounded border border-rattan bg-stage px-2 py-1 text-right tabular-nums text-sounding"
                        />
                        <span className="text-bamboo/45">{dict.laras.cents}</span>
                        <span className="tabular-nums text-bamboo/35">
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
                    className="text-xs text-bamboo/50 underline underline-offset-4 hover:text-sounding"
                  >
                    {dict.laras.reset}
                  </button>
                ) : null}
              </div>

              <footer className="mt-auto space-y-1 border-t border-rattan/40 pt-3 text-[11px] leading-relaxed text-bamboo/45">
                <p className="font-mono uppercase tracking-widest">{dict.laras.source}</p>
                <p>{tuning.source.title}</p>
                <p>{tuning.source.note}</p>
                <p className="border-l-2 border-cue/60 pl-2 text-bamboo/60">
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

      <p className="max-w-3xl rounded border border-cue/40 bg-cue/5 p-4 text-sm leading-relaxed text-bamboo/75">
        {dict.laras.notAuthority}
      </p>
    </div>
  )
}
