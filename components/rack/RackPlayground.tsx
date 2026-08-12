'use client'

import { useEffect, useMemo, useState } from 'react'
import { Rack } from './Rack'
import { useAudio } from '@/components/audio/AudioProvider'
import { SETS, buildSet, getSet } from '@/lib/set'
import type { TechniqueType } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

const TECHNIQUES: readonly TechniqueType[] = ['kurulung', 'centok', 'tengkep']

export function RackPlayground({ dict }: { dict: Dictionary }) {
  const { status, warm, warmProgress } = useAudio()
  const [setId, setSetId] = useState('melodi-kromatis')
  const [technique, setTechnique] = useState<TechniqueType>('kurulung')

  const set = useMemo(() => buildSet(getSet(setId)), [setId])
  const definition = getSet(setId)

  // Pre-render the rack once the engine is up, so the first press is a note and
  // not a render. On a phone that difference is the whole feel of the instrument.
  useEffect(() => {
    if (status !== 'siap') return
    warm(set.map((entry) => entry.spec))
  }, [set, status, warm])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-6">
        <label className="flex flex-col gap-1 text-xs text-bamboo/60">
          {dict.rak.setLabel}
          <select
            value={setId}
            onChange={(event) => setSetId(event.target.value)}
            className="rounded border border-rattan bg-stage px-3 py-1.5 text-sm text-sounding"
          >
            {SETS.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="flex flex-col gap-1 text-xs text-bamboo/60">
          <legend className="mb-1">{dict.rak.techniqueLabel}</legend>
          <div className="flex gap-1">
            {TECHNIQUES.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setTechnique(candidate)}
                aria-pressed={technique === candidate}
                className={
                  technique === candidate
                    ? 'rounded border border-sounding bg-sounding/15 px-3 py-1.5 text-sm text-sounding'
                    : 'rounded border border-rattan px-3 py-1.5 text-sm text-bamboo/70 hover:text-sounding'
                }
              >
                {dict.teknikNames[candidate]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-bamboo/70">
        {dict.teknikDesc[technique]}
      </p>

      <Rack set={set} technique={technique} numberLabel={dict.rak.nomor} />

      <div className="space-y-1 text-xs text-bamboo/50">
        {warmProgress !== null ? (
          <p className="font-mono text-bamboo/40" role="status">
            {dict.rak.warming} {Math.round(warmProgress * 100)}%
          </p>
        ) : null}
        <p>{dict.rak.howto}</p>
        <p>{dict.rak.keyboardHint}</p>
        <p className="font-mono">{definition.numberingNote}</p>
      </div>
    </div>
  )
}
