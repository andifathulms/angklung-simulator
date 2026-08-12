'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAX_VOICES,
  createVoicePool,
  isAudioSupported,
  startAudioEngine,
} from '@/lib/audio'
import type { AudioEngine, VoiceHandle, VoicePool } from '@/lib/audio'
import { KURULUNG_DEFAULT_SHAKE_RATE_HZ } from '@/lib/synth'
import type { AngklungSpec, TechniqueType } from '@/lib/synth'

export type AudioStatus = 'belum-mulai' | 'menyalakan' | 'siap' | 'gagal' | 'tidak-didukung'

export interface SoundingInfo {
  readonly techniqueType: TechniqueType
  readonly startedAt: number
}

export interface PlayOptions {
  readonly angklung: AngklungSpec
  readonly techniqueType: TechniqueType
  readonly hardness?: number
  readonly shakeRateHz?: number
  /** Absolute audio time. Omit to sound as soon as the audio clock allows. */
  readonly atSec?: number
  readonly gain?: number
  /** Auto-release after this long. Used by the scheduler for notated durations. */
  readonly durationSec?: number
}

interface AudioContextValue {
  readonly status: AudioStatus
  readonly engine: AudioEngine | null
  readonly pool: VoicePool | null
  readonly sounding: Readonly<Record<string, SoundingInfo>>
  readonly shakeRateHz: number
  start: () => Promise<void>
  /** Audio-clock time to schedule "now" against. Never Date.now. */
  now: () => number
  play: (options: PlayOptions) => VoiceHandle | null
  releaseAll: () => void
}

const AudioContextObject = createContext<AudioContextValue | null>(null)

/** A touch of headroom so a note scheduled "now" is scheduled, not chased. */
const IMMEDIATE_HEADROOM_SEC = 0.012

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AudioStatus>('belum-mulai')
  const [sounding, setSounding] = useState<Record<string, SoundingInfo>>({})
  const engineRef = useRef<AudioEngine | null>(null)
  const poolRef = useRef<VoicePool | null>(null)
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!isAudioSupported()) setStatus('tidak-didukung')
  }, [])

  useEffect(() => {
    const timeouts = timeoutsRef.current
    return () => {
      for (const handle of timeouts.values()) clearTimeout(handle)
      timeouts.clear()
    }
  }, [])

  const start = useCallback(async () => {
    if (engineRef.current !== null) return
    setStatus('menyalakan')
    try {
      const engine = await startAudioEngine()
      engineRef.current = engine
      poolRef.current = createVoicePool(engine, { maxVoices: DEFAULT_MAX_VOICES })
      setStatus('siap')
    } catch {
      setStatus('gagal')
    }
  }, [])

  const now = useCallback(() => engineRef.current?.context.currentTime ?? 0, [])

  const markSounding = useCallback(
    (angklungId: string, info: SoundingInfo, forSec: number) => {
      // Visual bookkeeping only. A timer may decide when a drawn tube stops looking
      // lit; it never decides when a note sounds (invariant 6).
      setSounding((current) => ({ ...current, [angklungId]: info }))
      const existing = timeoutsRef.current.get(angklungId)
      if (existing !== undefined) clearTimeout(existing)
      timeoutsRef.current.set(
        angklungId,
        setTimeout(() => {
          timeoutsRef.current.delete(angklungId)
          setSounding((current) => {
            const next = { ...current }
            delete next[angklungId]
            return next
          })
        }, forSec * 1000),
      )
    },
    [],
  )

  const play = useCallback(
    (options: PlayOptions): VoiceHandle | null => {
      const engine = engineRef.current
      const pool = poolRef.current
      if (engine === null || pool === null) return null

      const atSec = options.atSec ?? engine.context.currentTime + IMMEDIATE_HEADROOM_SEC
      const handle = pool.play({
        angklung: options.angklung,
        techniqueType: options.techniqueType,
        shakeRateHz: options.shakeRateHz ?? KURULUNG_DEFAULT_SHAKE_RATE_HZ,
        hardness: options.hardness ?? 0.55,
        atSec,
        gain: options.gain,
      })

      const delaySec = Math.max(0, atSec - engine.context.currentTime)
      const visibleSec =
        options.techniqueType === 'centok' ? 0.7 : (options.durationSec ?? 1.2) + 0.35
      window.setTimeout(
        () =>
          markSounding(
            options.angklung.id,
            { techniqueType: options.techniqueType, startedAt: atSec },
            visibleSec,
          ),
        delaySec * 1000,
      )

      if (options.durationSec !== undefined && options.techniqueType !== 'centok') {
        handle.release(atSec + options.durationSec)
      }

      return handle
    },
    [markSounding],
  )

  const releaseAll = useCallback(() => {
    const engine = engineRef.current
    if (engine === null) return
    poolRef.current?.releaseAll(engine.context.currentTime)
  }, [])

  const value = useMemo<AudioContextValue>(
    () => ({
      status,
      engine: engineRef.current,
      pool: poolRef.current,
      sounding,
      shakeRateHz: KURULUNG_DEFAULT_SHAKE_RATE_HZ,
      start,
      now,
      play,
      releaseAll,
    }),
    [status, sounding, start, now, play, releaseAll],
  )

  return <AudioContextObject.Provider value={value}>{children}</AudioContextObject.Provider>
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioContextObject)
  if (value === null) throw new Error('useAudio harus dipakai di dalam AudioProvider')
  return value
}
