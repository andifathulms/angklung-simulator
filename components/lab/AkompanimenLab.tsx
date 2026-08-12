'use client'

import { useMemo, useState } from 'react'
import { AngklungFigure } from '@/components/rack/AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import { buildSet, getSet } from '@/lib/set'
import { soundingTabung } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

/**
 * The chord instrument, shown as tubes rather than as a chord symbol, so the
 * mechanism is visible: four tubes sound a seventh chord, the little finger holds
 * one, and three remain. The chord name is a caption on what the tubes are doing —
 * never the thing itself (PRD §5.6).
 */
export function AkompanimenLab({ dict }: { dict: Dictionary }) {
  const { play, status, sounding } = useAudio()
  const [index, setIndex] = useState(0)
  const [held, setHeld] = useState(false)

  const set = useMemo(() => buildSet(getSet('akompanimen-dasar')), [])
  const entry = set[index] ?? set[0]
  if (entry === undefined) return null

  const isMinor = entry.spec.label.includes('minor')
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
        <label className="flex flex-col gap-1 text-xs text-bamboo/60">
          {dict.akor.which}
          <select
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            className="rounded border border-rattan bg-stage px-3 py-1.5 text-sm text-sounding"
          >
            {set.map((candidate, candidateIndex) => (
              <option key={candidate.spec.id} value={candidateIndex}>
                {candidate.spec.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setHeld((current) => !current)}
          aria-pressed={held}
          className={
            held
              ? 'rounded border border-muted bg-muted/30 px-4 py-1.5 text-sm text-sounding'
              : 'rounded border border-rattan px-4 py-1.5 text-sm text-bamboo/70 hover:text-sounding'
          }
        >
          {held ? dict.akor.release : dict.akor.hold}
        </button>

        <button
          type="button"
          disabled={status !== 'siap'}
          onClick={() =>
            play({
              angklung: entry.spec,
              techniqueType: held ? 'tengkep' : 'kurulung',
              durationSec: 2,
              gain: 0.5,
            })
          }
          className="rounded-full bg-sounding px-5 py-2 text-sm font-medium text-stage transition hover:bg-bamboo disabled:opacity-40"
        >
          {dict.ansambel.play}
        </button>
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
          <p className="font-display text-3xl text-sounding">{chordName}</p>
          <p className="font-mono text-xs text-bamboo/50">
            {audible.length}/{entry.spec.tabung.length} {dict.akor.tubes}
          </p>
          <ul className="space-y-1 font-mono text-xs">
            {entry.spec.tabung.map((tabung, tabungIndex) => {
              const muted = held && tabung.mutedByTengkep
              return (
                <li
                  key={tabungIndex}
                  className={muted ? 'text-muted line-through' : 'text-bamboo/80'}
                >
                  {tabung.hz.toFixed(1)} Hz · {tabung.intervalCents}{' '}
                  {dict.laras.cents} {dict.akor.interval}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
