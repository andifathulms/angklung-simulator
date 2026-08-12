'use client'

import { useMemo } from 'react'
import { AngklungButton } from './AngklungButton'
import { relativeTubeLength } from '@/lib/set'
import type { AngklungInSet } from '@/lib/set'
import type { TechniqueType } from '@/lib/synth'

export interface RackProps {
  readonly set: readonly AngklungInSet[]
  readonly technique: TechniqueType
  readonly hardness?: number
  readonly numberLabel: string
  /** Padaeng numbers of the angklung this player holds. Jade, and only jade. */
  readonly yourPartNumbers?: readonly number[]
  /** Padaeng number the conductor is about to signal. Cue amber, and only that. */
  readonly cuedNumber?: number | null
  readonly yourPartLabel: string
  readonly cuedLabel: string
}

export function Rack({
  set,
  technique,
  hardness,
  numberLabel,
  yourPartNumbers = [],
  cuedNumber = null,
  yourPartLabel,
  cuedLabel,
}: RackProps) {
  const lengths = useMemo(
    () => set.map((entry) => relativeTubeLength(entry.spec.rootHz, set)),
    [set],
  )
  const yours = useMemo(() => new Set(yourPartNumbers), [yourPartNumbers])

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max items-start gap-2 border-b border-stage-line px-1">
        {set.map((entry, index) => (
          <AngklungButton
            key={entry.spec.id}
            entry={entry}
            relativeLength={lengths[index] ?? 0}
            technique={technique}
            hardness={hardness}
            numberLabel={numberLabel}
            isYourPart={yours.has(entry.spec.nomor)}
            isCued={cuedNumber === entry.spec.nomor}
            yourPartLabel={yourPartLabel}
            cuedLabel={cuedLabel}
          />
        ))}
      </div>
    </div>
  )
}
