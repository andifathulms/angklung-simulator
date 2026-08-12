'use client'

import { useMemo, useState } from 'react'
import { AngklungFigure } from '@/components/rack/AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, Field, Select } from '@/components/ui'
import { fill } from '@/lib/i18n'
import { buildSet, getSet } from '@/lib/set'
import { akorDegreeAt, soundingTabung } from '@/lib/synth'
import type { AkorDegree, AkorKualitas } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

/**
 * The chord instrument, shown as tubes rather than as a chord symbol, so the
 * mechanism is visible: four tubes sound a seventh chord, the little finger holds
 * one, and three remain. The chord name is a caption on what the tubes are doing —
 * never the thing itself (PRD §5.6).
 */
/** The degree in words. Minor instruments differ only in the third. */
function degreeName(degree: AkorDegree, kualitas: AkorKualitas, dict: Dictionary): string {
  switch (degree) {
    case 'root':
      return dict.akor.degreeRoot
    case 'terts':
      return kualitas === 'minor' ? dict.akor.degreeTertsMinor : dict.akor.degreeTertsMayor
    case 'kuint':
      return dict.akor.degreeKuint
    case 'septim':
      return dict.akor.degreeSeptim
    default: {
      const exhaustive: never = degree
      throw new Error(`Derajat akor tidak dikenal: ${String(exhaustive)}`)
    }
  }
}

export function AkompanimenLab({ dict }: { dict: Dictionary }) {
  const { play, status, sounding } = useAudio()
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)

  const set = useMemo(() => buildSet(getSet('akompanimen-dasar')), [])
  const entry = set[index] ?? set[0]
  if (entry === undefined) return null

  const isMinor = entry.spec.label.includes('minor')
  const kualitas: AkorKualitas = isMinor ? 'minor' : 'mayor'
  const audible = soundingTabung(entry.spec, held)
  const isSounding = sounding[entry.spec.id] !== undefined

  const chordName = held
    ? isMinor
      ? dict.akor.trinadaMinor
      : dict.akor.trinadaMayor
    : isMinor
      ? dict.akor.septimMinor
      : dict.akor.septimDominan

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <Field label={dict.akor.which}>
          <Select value={index} onChange={(event) => setIndex(Number(event.target.value))}>
            {set.map((candidate, candidateIndex) => (
              <option key={candidate.spec.id} value={candidateIndex}>
                {candidate.spec.label}
              </option>
            ))}
          </Select>
        </Field>

        <button
          type="button"
          onClick={() => setHeld((current) => !current)}
          aria-pressed={held}
          className={
            held
              ? 'rounded border border-muted bg-muted/30 px-4 py-1.5 text-step-0 text-sounding'
              : 'rounded border border-stage-line px-4 py-1.5 text-step-0 text-ink-muted hover:text-sounding'
          }
        >
          {held ? dict.akor.release : dict.akor.hold}
        </button>

        <Button
          disabled={status !== 'siap'}
          onClick={() =>
            play({
              angklung: entry.spec,
              techniqueType: held ? 'tengkep' : 'kurulung',
              durationSec: 2,
              gain: 0.5,
            })
          }
          tone="primary"
          size="md"
        >
          {dict.ansambel.play}
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-10">
        <div className={isSounding ? 'angklung-sway' : ''}>
          <AngklungFigure
            angklung={entry.spec}
            relativeLength={0.85}
            sounding={isSounding}
            tengkep={held}
          />
        </div>

        <div className="space-y-3">
          <p className="font-display text-step-3 text-sounding">{chordName}</p>
          <p className="font-mono text-step--1 text-ink-faint">
            {audible.length}/{entry.spec.tabung.length} {dict.akor.tubes}
          </p>
          {/*
            * Each tube named as the degree it is, not only measured.
            *
            * This list used to read "698.5 Hz · 1000 cents · distance from
            * root" under a heading that said "dominant seventh", with nothing
            * connecting the two. A reader who did not already know intervals
            * saw four numbers and an assertion. 400 cents is the major third,
            * 700 the fifth, 1000 the minor seventh — and those four together
            * are what the phrase means.
            */}
          <ul className="space-y-1 font-mono text-step--1">
            {entry.spec.tabung.map((tabung, tabungIndex) => {
              const muted = held && tabung.mutedByTengkep
              const degree = akorDegreeAt(kualitas, tabung.intervalCents)
              return (
                <li
                  key={tabungIndex}
                  className={muted ? 'text-muted line-through' : 'text-ink-muted'}
                >
                  {tabung.hz.toFixed(1)} Hz · {tabung.intervalCents} {dict.laras.cents}
                  {degree === null ? null : (
                    <span className="text-ink"> · {degreeName(degree, kualitas, dict)}</span>
                  )}
                </li>
              )
            })}
          </ul>

          {/* The sentence that turns four measurements into a chord, and the
              one that says what the little finger actually removed. */}
          <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
            {held ? dict.akor.whyTriad : dict.akor.whyChord}
          </p>

          {held ? (
            <p className="font-mono text-step--1 text-ink">
              {(() => {
                const gone = entry.spec.tabung.find((tabung) => tabung.mutedByTengkep)
                const degree = gone === undefined ? null : akorDegreeAt(kualitas, gone.intervalCents)
                return degree === null
                  ? null
                  : fill(dict.akor.removedDegree, {
                      degree: degreeName(degree, kualitas, dict),
                      cents: gone?.intervalCents ?? 0,
                    })
              })()}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
