'use client'

import { useEffect, useMemo, useState } from 'react'
import { Rack } from './Rack'
import { useAudio } from '@/components/audio/AudioProvider'
import { Card, Field, SegmentedControl, Select, Term } from '@/components/ui'
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
      <Card className="space-y-5">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
          <Field label={dict.rak.setLabel}>
            <Select value={setId} onChange={(event) => setSetId(event.target.value)}>
              {SETS.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </Select>
          </Field>

          <SegmentedControl
            label={dict.rak.techniqueLabel}
            value={technique}
            onChange={setTechnique}
            options={TECHNIQUES.map((candidate) => ({
              value: candidate,
              label: dict.teknikNames[candidate],
            }))}
          />
        </div>

        {/* What the selected technique is, in plain language, right where the
            choice was made rather than in a paragraph further down the page. */}
        <p className="max-w-readable text-step-0 leading-relaxed text-ink-muted">
          <Term term={dict.teknikNames[technique]} /> —{' '}
          {dict.teknikDesc[technique]}
        </p>
      </Card>

      <div className="rounded-card border border-stage-line bg-stage-raised/50 px-2 py-6 sm:px-4">
        <Rack
          set={set}
          technique={technique}
          numberLabel={dict.rak.nomor}
          yourPartLabel={dict.rak.stateYourPart}
          cuedLabel={dict.rak.stateCued}
        />
      </div>

      <div className="grid gap-4 text-step--1 text-ink-faint sm:grid-cols-2">
        <div className="space-y-1.5">
          {warmProgress !== null ? (
            <p className="font-mono" role="status">
              {dict.rak.warming} {Math.round(warmProgress * 100)}%
            </p>
          ) : null}
          <p className="text-ink-muted">{dict.rak.howto}</p>
          <p>{dict.rak.keyboardHint}</p>
        </div>
        <p className="leading-relaxed">{definition.numberingNote}</p>
      </div>
    </div>
  )
}
