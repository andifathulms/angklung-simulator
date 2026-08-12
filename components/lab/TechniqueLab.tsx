'use client'

import { useMemo, useState } from 'react'
import { ExcitationTrace, WaveformTrace } from './ExcitationTrace'
import { ModeTuner } from './ModeTuner'
import { AngklungFigure } from '@/components/rack/AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, SegmentedControl } from '@/components/ui'
import { buildSet, getSet } from '@/lib/set'
import {
  KURULUNG_DEFAULT_SHAKE_RATE_HZ,
  TABUNG_MODES,
  KURULUNG_SHAKE_RATE_RANGE_HZ,
  excitationTrace,
  isCitedShakeRate,
  render,
  soundingTabung,
  strikesPerSecond,
} from '@/lib/synth'
import type { Mode, Technique, TechniqueType } from '@/lib/synth'
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
  const [modes, setModes] = useState<readonly Mode[]>(TABUNG_MODES)

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
      modes,
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
  }, [entry, modes, technique])

  if (entry === undefined) return null

  const tengkepHeld = techniqueType === 'tengkep'
  const audible = soundingTabung(entry.spec, tengkepHeld)
  const isSounding = sounding[entry.spec.id] !== undefined
  const cited = isCitedShakeRate(shakeRateHz)

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="space-y-5">
          <SegmentedControl
            label={dict.rak.techniqueLabel}
            value={techniqueType}
            onChange={setTechniqueType}
            options={TECHNIQUES.map((candidate) => ({
              value: candidate,
              label: dict.teknikNames[candidate],
            }))}
          />

          <label className="block space-y-1 text-step--1 text-ink-muted">
            <span>
              {dict.teknik.shakeRate}{' '}
              <span className="font-mono text-sounding">{shakeRateHz.toFixed(1)} Hz</span>{' '}
              <span className="font-mono text-ink-faint">
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
            <span className={cited ? 'block text-ink-faint' : 'block text-cue-light'}>
              {dict.teknik.shakeRateCited}
            </span>
          </label>

          <label className="block space-y-1 text-step--1 text-ink-muted">
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

          <Button
            tone="primary"
            size="md"
            disabled={status !== 'siap'}
            onClick={() =>
              play({
                angklung: entry.spec,
                techniqueType,
                hardness,
                shakeRateHz,
                durationSec: LAB_DURATION_SEC - 0.6,
                modes,
              })
            }
          >
            {dict.ansambel.play}
          </Button>
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

          <ul className="space-y-1 font-mono text-step--1">
            {entry.spec.tabung.map((tabung, index) => {
              const held = tengkepHeld && tabung.mutedByTengkep
              return (
                <li key={index} className={held ? 'text-muted' : 'text-ink-muted'}>
                  {tabung.role} · {tabung.hz.toFixed(1)} Hz ·{' '}
                  {held ? dict.teknik.muted : dict.teknik.sounding}
                </li>
              )
            })}
            <li className="pt-1 text-ink-faint">
              {audible.length}/{entry.spec.tabung.length}
            </li>
          </ul>
        </div>
      </div>

      <ModeTuner modes={modes} onChange={setModes} dict={dict} />

      <ExcitationTrace
        strikes={strikes}
        durationSec={LAB_DURATION_SEC}
        label={dict.teknik.strikeTrain}
      />
      <WaveformTrace peaks={peaks} label={dict.teknik.render} />

      <p className="font-mono text-step--1 text-ink-faint">
        {KURULUNG_SHAKE_RATE_RANGE_HZ.minHz}–{KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz} Hz
      </p>
    </div>
  )
}
