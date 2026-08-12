import { render, suggestedDurationSec } from '@/lib/synth'
import type { AngklungSpec } from '@/lib/synth'
import type { AudioEngine } from './context'

/**
 * On-device measurement. `pnpm bench:voices` measures the synthesis core offline
 * in Node; this measures what actually happens in the browser holding the phone —
 * render cost at the device's real sample rate, and how late the scheduler's
 * wakeups arrive when the ensemble is loud.
 *
 * The number that matters is not "how many voices" but "does the main thread
 * still get to run", because the main thread is what schedules the next note.
 */

export interface DeviceReport {
  readonly sampleRateHz: number
  /** Seconds of buffering the browser admits to. Absent in some browsers. */
  readonly baseLatencySec: number | null
  readonly outputLatencySec: number | null
  readonly hardwareConcurrency: number | null
  /** Device pixel ratio and UA, so a saved report can be identified later. */
  readonly userAgent: string
}

export function deviceReport(engine: AudioEngine): DeviceReport {
  const context = engine.context as AudioContext & { outputLatency?: number }
  return {
    sampleRateHz: context.sampleRate,
    baseLatencySec: typeof context.baseLatency === 'number' ? context.baseLatency : null,
    outputLatencySec: typeof context.outputLatency === 'number' ? context.outputLatency : null,
    hardwareConcurrency:
      typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
        ? navigator.hardwareConcurrency
        : null,
    userAgent: typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
  }
}

/**
 * A plain oscillator, bypassing the synthesis core, the voice pool, and every
 * buffer in the project. It exists to answer one question when someone reports
 * hearing nothing: is Web Audio working on this device at all?
 *
 * If the reference tone sounds and the instrument does not, the fault is in the
 * rendered buffer. If neither sounds, the fault is in the context, the output
 * device, or a silent switch. Without this the two are indistinguishable from a
 * bug report, and I cannot hold the phone.
 */
export function playReferenceTone(engine: AudioEngine, durationSec = 0.7): void {
  const context = engine.context
  const at = context.currentTime + 0.02

  const oscillator = context.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.value = 440

  const gain = context.createGain()
  // Shaped rather than switched: an abrupt start on a sine is a click.
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02)
  gain.gain.setValueAtTime(0.25, at + durationSec - 0.06)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + durationSec)

  // Straight to the destination, past the master and the limiter, so nothing in
  // this project's own graph can be the reason it is inaudible.
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(at)
  oscillator.stop(at + durationSec + 0.02)
}

export interface RenderCost {
  readonly angklungId: string
  readonly durationSec: number
  readonly renderMs: number
  /** How many times faster than realtime this device renders the instrument. */
  readonly realtimeFactor: number
}

/**
 * Cost of rendering one note at the device's own sample rate. This is the number
 * that decides whether pre-rendering a rack is instant or a freeze.
 */
export function measureRenderCost(engine: AudioEngine, angklung: AngklungSpec): RenderCost {
  const base = {
    angklung,
    technique: {
      type: 'kurulung' as const,
      shakeRateHz: 2.5,
      durationSec: 2,
      hardness: 0.5,
      seed: 1,
    },
    sampleRateHz: engine.context.sampleRate,
    gain: 1,
  }
  const durationSec = suggestedDurationSec(base)

  const started = performance.now()
  render({ ...base, durationSec })
  const renderMs = performance.now() - started

  return {
    angklungId: angklung.id,
    durationSec,
    renderMs,
    realtimeFactor: renderMs === 0 ? Infinity : (durationSec * 1000) / renderMs,
  }
}

export interface JitterResult {
  readonly voices: number
  readonly ticks: number
  /** Wakeups are asked for every `tickMs`; these say when they actually arrived. */
  readonly medianLateMs: number
  readonly worstLateMs: number
  /** Ticks that arrived later than the scheduler's lookahead — a dropped note risk. */
  readonly missedLookahead: number
  readonly peakVoices: number
}

/**
 * The real polyphony test. Start `voices` notes at once, then watch how punctually
 * a 25 ms interval fires while they ring.
 *
 * A late wakeup is the failure that matters: the scheduler looks ahead 200 ms, so
 * a tick that arrives more than 200 ms late means a note it should have queued is
 * already in the past. That is what a dropped note sounds like, and it is
 * measurable without any way to listen.
 */
export async function measureJitter(
  engine: AudioEngine,
  play: (angklung: AngklungSpec, atSec: number) => void,
  angklung: readonly AngklungSpec[],
  options: { voices: number; durationMs?: number; tickMs?: number; lookaheadSec?: number },
): Promise<JitterResult> {
  const tickMs = options.tickMs ?? 25
  const durationMs = options.durationMs ?? 2500
  const lookaheadMs = (options.lookaheadSec ?? 0.2) * 1000

  const lateness: number[] = []
  let peakVoices = 0

  const startedAt = performance.now()
  let expected = startedAt + tickMs

  // Spread the attacks over the first 400 ms, the way an arrangement would,
  // rather than stacking them on one sample.
  const spreadSec = 0.4
  for (let index = 0; index < options.voices; index += 1) {
    const spec = angklung[index % angklung.length]
    if (spec === undefined) break
    play(spec, engine.context.currentTime + 0.05 + (index / options.voices) * spreadSec)
  }

  await new Promise<void>((resolve) => {
    const handle = window.setInterval(() => {
      const now = performance.now()
      lateness.push(Math.max(0, now - expected))
      expected += tickMs
      peakVoices = Math.max(peakVoices, options.voices)
      if (now - startedAt >= durationMs) {
        window.clearInterval(handle)
        resolve()
      }
    }, tickMs)
  })

  const sorted = [...lateness].sort((a, b) => a - b)
  const median = sorted.length === 0 ? 0 : (sorted[Math.floor(sorted.length / 2)] ?? 0)

  return {
    voices: options.voices,
    ticks: lateness.length,
    medianLateMs: median,
    worstLateMs: sorted.length === 0 ? 0 : (sorted[sorted.length - 1] ?? 0),
    missedLookahead: lateness.filter((late) => late > lookaheadMs).length,
    peakVoices,
  }
}

/** A run's verdict, in the same three grades bench:voices uses. */
export type Verdict = 'lolos' | 'ketat' | 'gagal'

export function verdictFor(result: JitterResult): Verdict {
  if (result.missedLookahead > 0) return 'gagal'
  if (result.worstLateMs > 80) return 'ketat'
  return 'lolos'
}
