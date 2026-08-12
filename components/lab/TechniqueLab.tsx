'use client'

import { useMemo, useState } from 'react'
import { ExcitationTrace, WaveformTrace } from './ExcitationTrace'
import { AngklungFigure } from '@/components/rack/AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import { buildSet, getSet } from '@/lib/set'
import {
  KURULUNG_DEFAULT_SHAKE_RATE_HZ,
  KURULUNG_SHAKE_RATE_RANGE_HZ,
  excitationTrace,
  isCitedShakeRate,
  render,
  soundingTabung,
  strikesPerSecond,
} from '@/lib/synth'
import type { Technique, TechniqueType } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

const TECHNIQUES: readonly TechniqueType[] = ['kurulung', 'centok', 'tengkep']
const LAB_DURATION_SEC = 2.4
const PREVIEW_SAMPLE_RATE_HZ = 22050
const PREVIEW_COLUMNS = 600
const SEED = 20250812

export function TechniqueLab({ dict }: { dict: Dictionary }) {
  const { play, status, sounding } = useAudio()
  const [techniqueType, setTechniqueType] = useState<TechniqueType>('kurulung')
  const [shakeRateHz, setShakeRateHz] = useState(KURULUNG_DEFAULT_SHAKE_RATE_HZ)
  const [hardness, setHardness] = useState(0.5)

  const set = useMemo(() => buildSet(getSet('melodi-kromatis')), [])
  const entry = set[9] ?? set[0]

  const technique = useMemo<Technique>(() => {
    if (techniqueType === 'centok') return { type: 'centok', hardness, seed: SEED }
    return {
      type: techniqueType,
      shakeRateHz,
      durationSec: LAB_DURATION_SEC - 0.6,
      hardness,
      seed: SEED,
    }
  }, [hardness, shakeRateHz, techniqueType])

  const strikes = useMemo(() => excitationTrace({ technique }), [technique])

  // Rendered here in the browser from the same pure core the tests measure. A lower
  // sample rate keeps the preview cheap; the audio path renders at full rate.
  const peaks = useMemo(() => {
    if (entry === undefined) return []
    const buffer = render({
      angklung: entry.spec,
      technique,
      sampleRateHz: PREVIEW_SAMPLE_RATE_HZ,
      durationSec: LAB_DURATION_SEC,
      gain: 1,
    })
    const stride = Math.floor(buffer.length / PREVIEW_COLUMNS)
    const columns: number[] = []
    let maximum = 0
    for (let column = 0; column < PREVIEW_COLUMNS; column += 1) {
      let peak = 0
      for (let n = 0; n < stride; n += 1) {
        peak = Math.max(peak, Math.abs(buffer[column * stride + n] ?? 0))
      }
      columns.push(peak)
      maximum = Math.max(maximum, peak)
    }
    return maximum === 0 ? columns : columns.map((peak) => peak / maximum)
  }, [entry, technique])

  if (entry === undefined) return null

  const tengkepHeld = techniqueType === 'tengkep'
  const audible = soundingTabung(entry.spec, tengkepHeld)
  const isSounding = sounding[entry.spec.id] !== undefined
  const cited = isCitedShakeRate(shakeRateHz)

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-xs text-bamboo/60">{dict.rak.techniqueLabel}</legend>
            <div className="flex flex-wrap gap-1">
              {TECHNIQUES.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setTechniqueType(candidate)}
                  aria-pressed={techniqueType === candidate}
                  className={
                    techniqueType === candidate
                      ? 'rounded border border-sounding bg-sounding/15 px-3 py-1.5 text-sm text-sounding'
                      : 'rounded border border-rattan px-3 py-1.5 text-sm text-bamboo/70 hover:text-sounding'
                  }
                >
                  {dict.teknikNames[candidate]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block space-y-1 text-xs text-bamboo/60">
            <span>
              {dict.teknik.shakeRate}{' '}
              <span className="font-mono text-sounding">{shakeRateHz.toFixed(1)} Hz</span>{' '}
              <span className="font-mono text-bamboo/45">
                → {strikesPerSecond(shakeRateHz).toFixed(1)} {dict.teknik.strikes}/s
              </span>
            </span>
            <input
              type="range"
              min={1}
              max={6}
              step={0.1}
              value={shakeRateHz}
              disabled={techniqueType === 'centok'}
              onChange={(event) => setShakeRateHz(Number(event.target.value))}
              className="w-full accent-bamboo disabled:opacity-40"
            />
            <span className={cited ? 'block text-bamboo/45' : 'block text-cue'}>
              {dict.teknik.shakeRateCited}
            </span>
          </label>

          <label className="block space-y-1 text-xs text-bamboo/60">
            <span>
              {dict.teknik.hardness}{' '}
              <span className="font-mono text-sounding">{hardness.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={hardness}
              onChange={(event) => setHardness(Number(event.target.value))}
              className="w-full accent-bamboo"
            />
          </label>

          <button
            type="button"
            disabled={status !== 'siap'}
            onClick={() =>
              play({
                angklung: entry.spec,
                techniqueType,
                hardness,
                shakeRateHz,
                durationSec: LAB_DURATION_SEC - 0.6,
              })
            }
            className="rounded-full bg-sounding px-5 py-2 text-sm font-medium text-stage transition hover:bg-bamboo disabled:opacity-40"
          >
            {dict.ansambel.play}
          </button>
        </div>

        <div className="flex items-start gap-8">
          <div
            className={isSounding ? 'angklung-sway' : ''}
            style={{ ['--sway-period' as string]: `${(1000 / shakeRateHz).toFixed(0)}ms` }}
          >
            <AngklungFigure
              angklung={entry.spec}
              relativeLength={0.7}
              sounding={isSounding}
              tengkep={tengkepHeld}
            />
          </div>

          <ul className="space-y-1 font-mono text-xs">
            {entry.spec.tabung.map((tabung, index) => {
              const held = tengkepHeld && tabung.mutedByTengkep
              return (
                <li key={index} className={held ? 'text-muted' : 'text-bamboo/75'}>
                  {tabung.role} · {tabung.hz.toFixed(1)} Hz ·{' '}
                  {held ? dict.teknik.muted : dict.teknik.sounding}
                </li>
              )
            })}
            <li className="pt-1 text-bamboo/45">
              {audible.length}/{entry.spec.tabung.length}
            </li>
          </ul>
        </div>
      </div>

      <ExcitationTrace
        strikes={strikes}
        durationSec={LAB_DURATION_SEC}
        label={dict.teknik.strikeTrain}
      />
      <WaveformTrace peaks={peaks} label={dict.teknik.render} />

      <p className="font-mono text-xs text-bamboo/45">
        {KURULUNG_SHAKE_RATE_RANGE_HZ.minHz}–{KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz} Hz
      </p>
    </div>
  )
}
