'use client'

import { useCallback, useRef, useState } from 'react'
import { AngklungFigure } from './AngklungFigure'
import { useAudio } from '@/components/audio/AudioProvider'
import type { AngklungInSet } from '@/lib/set'
import type { TechniqueType } from '@/lib/synth'
import type { VoiceHandle } from '@/lib/audio'

export interface AngklungButtonProps {
  readonly entry: AngklungInSet
  readonly relativeLength: number
  readonly technique: TechniqueType
  readonly hardness?: number
  /** Jade marks the user's own part, and means only that (PRD §8). */
  readonly isYourPart?: boolean
  /** Cue amber marks the conductor's upcoming signal, and means only that. */
  readonly isCued?: boolean
  readonly numberLabel: string
}

export function AngklungButton({
  entry,
  relativeLength,
  technique,
  hardness = 0.55,
  isYourPart = false,
  isCued = false,
  numberLabel,
}: AngklungButtonProps) {
  const { play, sounding, shakeRateHz, status, now } = useAudio()
  const voiceRef = useRef<VoiceHandle | null>(null)
  const [heldTengkep, setHeldTengkep] = useState(false)

  const info = sounding[entry.spec.id]
  const isSounding = info !== undefined

  const startNote = useCallback(
    (withTengkep: boolean) => {
      if (voiceRef.current !== null) return
      // Shift always forces tengkep, whatever technique the rack is set to.
      const effective: TechniqueType =
        withTengkep && technique !== 'centok' ? 'tengkep' : technique
      setHeldTengkep(effective === 'tengkep')
      const handle = play({ angklung: entry.spec, techniqueType: effective, hardness, shakeRateHz })
      if (effective === 'centok') {
        voiceRef.current = null
      } else {
        voiceRef.current = handle
      }
    },
    [entry.spec, hardness, play, shakeRateHz, technique],
  )

  const endNote = useCallback(() => {
    const handle = voiceRef.current
    voiceRef.current = null
    setHeldTengkep(false)
    if (handle === null) return
    // Release against the audio clock, not a timer.
    handle.release(now())
  }, [now])

  const swayClass = !isSounding
    ? ''
    : info?.techniqueType === 'centok'
      ? 'angklung-centok'
      : 'angklung-sway'

  return (
    <button
      type="button"
      disabled={status !== 'siap'}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        startNote(event.shiftKey)
      }}
      onPointerUp={endNote}
      onPointerCancel={endNote}
      onPointerLeave={endNote}
      onKeyDown={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        if (event.repeat) return
        event.preventDefault()
        startNote(event.shiftKey)
      }}
      onKeyUp={(event) => {
        if (event.key !== ' ' && event.key !== 'Enter') return
        endNote()
      }}
      aria-label={`${numberLabel} ${entry.spec.nomor}, ${entry.spec.label}`}
      aria-pressed={isSounding}
      className="group flex shrink-0 flex-col items-center gap-2 rounded-md px-1 pb-2 pt-1 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={swayClass}
        style={{ ['--sway-period' as string]: `${(1000 / shakeRateHz).toFixed(0)}ms` }}
      >
        <AngklungFigure
          angklung={entry.spec}
          relativeLength={relativeLength}
          sounding={isSounding}
          tengkep={heldTengkep || info?.techniqueType === 'tengkep'}
        />
      </span>

      <span
        className={[
          'font-mono text-step-1 tabular-nums transition-colors',
          isCued ? 'text-cue-light' : isYourPart ? 'text-yourPart-light' : 'text-ink-muted',
          isSounding ? 'text-sounding' : '',
        ].join(' ')}
      >
        {entry.spec.nomor}
      </span>
      <span className="font-mono text-step--2 text-ink-faint group-hover:text-ink-muted">
        {entry.spec.label}
      </span>
    </button>
  )
}
