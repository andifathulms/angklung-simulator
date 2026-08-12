'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAX_VOICES,
  contextState,
  createVoicePool,
  isAudioSupported,
  isIos,
  isRunnable,
  resumeAudioEngine,
  startAudioEngine,
} from '@/lib/audio'
import type { AudioEngine, ExtendedContextState, VoiceHandle, VoicePool } from '@/lib/audio'
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
  /** Safari's real state, including its non-standard 'interrupted'. */
  readonly contextState: ExtendedContextState | null
  /** True where the hardware mute switch silences Web Audio — that is, on iOS. */
  readonly needsSilentSwitchHint: boolean
  start: () => Promise<void>
  /**
   * Queue instruments for pre-rendering during idle time. Returns immediately;
   * progress is reported through `warmProgress`.
   */
  warm: (angklung: readonly AngklungSpec[]) => void
  /** 0–1, or null when there is nothing queued. */
  readonly warmProgress: number | null
  /** Audio-clock time to schedule "now" against. Never Date.now. */
  now: () => number
  play: (options: PlayOptions) => VoiceHandle | null
  releaseAll: () => void
}

const AudioContextObject = createContext<AudioContextValue | null>(null)

/** A touch of headroom so a note scheduled "now" is scheduled, not chased. */
const IMMEDIATE_HEADROOM_SEC = 0.012

/** Idle time if the browser offers it; a yield to the event loop if it does not. */
function schedule(run: () => void): void {
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
    .requestIdleCallback
  if (typeof idle === 'function') idle(run)
  else window.setTimeout(run, 0)
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AudioStatus>('belum-mulai')
  const [sounding, setSounding] = useState<Record<string, SoundingInfo>>({})
  const [state, setState] = useState<ExtendedContextState | null>(null)
  const [warmProgress, setWarmProgress] = useState<number | null>(null)
  const warmQueueRef = useRef<{ spec: AngklungSpec; techniqueType: TechniqueType }[]>([])
  const warmTotalRef = useRef(0)
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
      setState(contextState(engine))
      setStatus('siap')
    } catch {
      setStatus('gagal')
    }
  }, [])

  /**
   * Interruption recovery. Safari suspends the context on a call, on Siri, and on
   * backgrounding, and it reports a non-standard 'interrupted' state while doing
   * so. Resuming needs a gesture again on iOS, so this listens to real interaction
   * as well as to visibility — a timer could not fix it even if one were allowed.
   */
  useEffect(() => {
    const sync = () => {
      const engine = engineRef.current
      if (engine === null) return
      setState(contextState(engine))
    }

    const recover = () => {
      const engine = engineRef.current
      if (engine === null) return
      if (isRunnable(contextState(engine))) return
      void resumeAudioEngine(engine).then(sync)
    }

    document.addEventListener('visibilitychange', recover)
    window.addEventListener('focus', recover)
    window.addEventListener('pointerdown', recover)
    window.addEventListener('touchend', recover)
    const poll = window.setInterval(sync, 1000)

    return () => {
      document.removeEventListener('visibilitychange', recover)
      window.removeEventListener('focus', recover)
      window.removeEventListener('pointerdown', recover)
      window.removeEventListener('touchend', recover)
      window.clearInterval(poll)
    }
  }, [])

  /**
   * Pre-rendering, spread across idle time. A held technique renders six seconds
   * of audio and a full rack is dozens of those, so doing this in one pass would
   * freeze a phone for as long as it took. One buffer per idle slot keeps the
   * interface responsive while the rack quietly becomes instant to play.
   */
  const warm = useCallback((angklung: readonly AngklungSpec[]) => {
    const queue: { spec: AngklungSpec; techniqueType: TechniqueType }[] = []
    for (const techniqueType of ['centok', 'kurulung', 'tengkep'] as const) {
      for (const spec of angklung) queue.push({ spec, techniqueType })
    }
    warmQueueRef.current = queue
    warmTotalRef.current = queue.length
    setWarmProgress(queue.length === 0 ? null : 0)

    const drain = () => {
      const pool = poolRef.current
      const remaining = warmQueueRef.current
      if (pool === null || remaining.length === 0) {
        setWarmProgress(null)
        return
      }
      const next = remaining.shift()
      if (next !== undefined) pool.warm(next.spec, next.techniqueType)
      const total = warmTotalRef.current
      setWarmProgress(total === 0 ? null : (total - remaining.length) / total)
      schedule(drain)
    }

    schedule(drain)
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
      contextState: state,
      needsSilentSwitchHint: status === 'siap' && isIos(),
      start,
      warm,
      warmProgress,
      now,
      play,
      releaseAll,
    }),
    [status, sounding, state, start, warm, warmProgress, now, play, releaseAll],
  )

  return <AudioContextObject.Provider value={value}>{children}</AudioContextObject.Provider>
}

export function useAudio(): AudioContextValue {
  const value = useContext(AudioContextObject)
  if (value === null) throw new Error('useAudio harus dipakai di dalam AudioProvider')
  return value
}
