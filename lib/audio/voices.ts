import { peakOf, render, suggestedDurationSec } from '@/lib/synth'
import type { AngklungSpec, Mode, Technique, TechniqueType } from '@/lib/synth'
import type { AudioEngine } from './context'

/**
 * Voices: the rendered instrument, played through Web Audio.
 *
 * What you hear is the buffer lib/synth produced and the tests measured — the
 * model is not re-implemented in oscillator nodes, because then there would be two
 * instruments and only one of them tested.
 *
 * The one approximation at this boundary: kurulung and tengkep are rendered once
 * at a fixed length and faded when the player lets go, since a shake has no
 * predetermined duration. The fade lives here, in the audio layer, never in the
 * model.
 */

/** How long a held note is rendered for. Longer than anyone holds one note. */
export const HELD_RENDER_SEC = 6

/** Release fade when the player stops shaking. */
export const RELEASE_SEC = 0.28

/**
 * Voice budget. A full ensemble is many simultaneous resonators; past this the
 * oldest voice is released rather than letting the mix glitch (invariant 14).
 * Sized from bench:voices, which cleared 64 offline voices at ~18x realtime.
 */
export const DEFAULT_MAX_VOICES = 28

/** Seeded variants per instrument, so repeated notes are not identical takes. */
const SEED_VARIANTS = 3

/**
 * Headroom. The model renders one hard centok at a peak of about 1.3 — a physical
 * result, not a mistake, since nothing in a resonator knows about full scale. The
 * decision about how loud that should be is a playback decision, so it lives here.
 *
 * At this gain the loudest single note lands near 0.65, which leaves room for an
 * ensemble to sum before the mix-bus limiter has to do anything.
 */
export const VOICE_RENDER_GAIN = 0.5

/**
 * Last-resort safety, for tuned mode banks from the technique lab: someone can
 * push a mode's amplitude far past anything the shipped instrument does, and a
 * buffer well over full scale would clip into the limiter and sound broken. This
 * only ever scales down, so the shipped instrument is untouched by it.
 */
const MAX_BUFFER_PEAK = 0.95

export interface VoiceRequest {
  readonly angklung: AngklungSpec
  readonly techniqueType: TechniqueType
  readonly shakeRateHz: number
  readonly hardness: number
  /** Absolute audio time. Always from the audio clock, never from a timer. */
  readonly atSec: number
  readonly gain?: number
  /** Rotates the seeded variant. Same value → same take. */
  readonly variant?: number
  /** Tuned mode bank from the technique lab. Omit for the shipped instrument. */
  readonly modes?: readonly Mode[]
}

export interface VoiceHandle {
  /** Let the tube ring out from `atSec`. Ignored for centok, which is already one strike. */
  release(atSec: number): void
  stop(atSec: number): void
}

export interface VoicePool {
  play(request: VoiceRequest): VoiceHandle
  /**
   * Pre-render one instrument-and-technique buffer, so the first press is not the
   * slow one. Deliberately one buffer per call: a held technique renders six
   * seconds of audio, and warming a whole rack in one go would block the main
   * thread for seconds on a phone. The caller spreads these across idle time.
   */
  warm(angklung: AngklungSpec, techniqueType: TechniqueType, hardness?: number): void
  releaseAll(atSec: number): void
  activeCount(): number
  cachedCount(): number
  /**
   * Read back what was actually written into an AudioBuffer on this device.
   * A peak of zero here means the copy into Web Audio failed even though the
   * render was fine — which is invisible from the outside and sounds exactly
   * like every other cause of silence.
   */
  inspect(request: Omit<VoiceRequest, 'atSec' | 'gain'>): BufferReport
}

export interface BufferReport {
  readonly peak: number
  readonly lengthSamples: number
  readonly sampleRateHz: number
  /** How the samples reached the AudioBuffer, since Safari once lacked the first. */
  readonly writtenWith: 'copyToChannel' | 'getChannelData'
}

interface ActiveVoice {
  readonly source: AudioBufferSourceNode
  readonly gain: GainNode
  readonly startedAtSec: number
  released: boolean
}

export function createVoicePool(
  engine: AudioEngine,
  options: { maxVoices?: number } = {},
): VoicePool {
  const maxVoices = options.maxVoices ?? DEFAULT_MAX_VOICES
  const buffers = new Map<string, AudioBuffer>()
  const active: ActiveVoice[] = []

  const techniqueFor = (
    request: Pick<VoiceRequest, 'techniqueType' | 'shakeRateHz' | 'hardness'>,
    seed: number,
  ): Technique => {
    switch (request.techniqueType) {
      case 'centok':
        return { type: 'centok', hardness: request.hardness, seed }
      case 'kurulung':
        return {
          type: 'kurulung',
          shakeRateHz: request.shakeRateHz,
          durationSec: HELD_RENDER_SEC,
          hardness: request.hardness,
          seed,
        }
      case 'tengkep':
        return {
          type: 'tengkep',
          shakeRateHz: request.shakeRateHz,
          durationSec: HELD_RENDER_SEC,
          hardness: request.hardness,
          seed,
        }
      default: {
        const exhaustive: never = request.techniqueType
        throw new Error(`Teknik tidak dikenal: ${String(exhaustive)}`)
      }
    }
  }

  const keyFor = (request: Omit<VoiceRequest, 'atSec' | 'gain'>, variant: number): string =>
    [
      request.angklung.id,
      request.techniqueType,
      request.shakeRateHz.toFixed(2),
      request.hardness.toFixed(2),
      variant,
      // A tuned mode bank is a different instrument and must not reuse a buffer.
      request.modes === undefined
        ? 'stok'
        : request.modes
            .map((mode) => `${mode.ratio}:${mode.amplitude}:${mode.decayT60Sec}`)
            .join(','),
    ].join('|')

  const bufferFor = (request: Omit<VoiceRequest, 'atSec' | 'gain'>, variant: number): AudioBuffer => {
    const key = keyFor(request, variant)
    const cached = buffers.get(key)
    if (cached !== undefined) return cached

    const seed = hashSeed(key)
    const technique = techniqueFor(request, seed)
    const base = {
      angklung: request.angklung,
      technique,
      gain: VOICE_RENDER_GAIN,
      sampleRateHz: engine.context.sampleRate,
      ...(request.modes === undefined ? {} : { modes: request.modes }),
    }
    const durationSec = suggestedDurationSec(base)
    const samples = render({ ...base, durationSec })

    const peak = peakOf(samples)
    if (peak > MAX_BUFFER_PEAK) {
      const scale = MAX_BUFFER_PEAK / peak
      for (let n = 0; n < samples.length; n += 1) samples[n] *= scale
    }

    const buffer = engine.context.createBuffer(1, samples.length, engine.context.sampleRate)
    writeChannel(buffer, samples)
    buffers.set(key, buffer)
    return buffer
  }

  const dropOldest = (atSec: number): void => {
    // Prefer a voice already ringing out; otherwise the oldest still being held.
    const index = active.findIndex((voice) => voice.released)
    const victim = index >= 0 ? active[index] : active[0]
    if (victim === undefined) return

    /*
     * Stopped outright rather than through fadeOut, which returns early for a
     * voice already marked released — and every scheduled note is marked released
     * the moment it is queued with a duration. Routing the drop through fadeOut
     * therefore did nothing at all, so the voice budget was not enforced (it has
     * to be: invariant 14).
     */
    const now = Math.max(atSec, engine.context.currentTime)
    victim.gain.gain.cancelScheduledValues(now)
    victim.gain.gain.setValueAtTime(victim.gain.gain.value, now)
    victim.gain.gain.linearRampToValueAtTime(0.0001, now + 0.04)
    victim.source.stop(now + 0.05)
    victim.released = true

    const position = active.indexOf(victim)
    if (position >= 0) active.splice(position, 1)
  }

  const fadeOut = (voice: ActiveVoice, atSec: number, fadeSec: number): void => {
    if (voice.released) return
    voice.released = true
    const now = Math.max(atSec, engine.context.currentTime)
    voice.gain.gain.cancelScheduledValues(now)
    voice.gain.gain.setValueAtTime(voice.gain.gain.value, now)
    voice.gain.gain.linearRampToValueAtTime(0.0001, now + fadeSec)
    voice.source.stop(now + fadeSec + 0.01)
  }

  return {
    play(request) {
      const variant = (request.variant ?? active.length) % SEED_VARIANTS
      const buffer = bufferFor(request, variant)

      if (active.length >= maxVoices) dropOldest(request.atSec)

      const gain = engine.context.createGain()
      gain.gain.value = request.gain ?? 1
      const source = engine.context.createBufferSource()
      source.buffer = buffer
      source.connect(gain)
      gain.connect(engine.master)
      source.start(request.atSec)

      const voice: ActiveVoice = { source, gain, startedAtSec: request.atSec, released: false }
      active.push(voice)
      source.onended = () => {
        const index = active.indexOf(voice)
        if (index >= 0) active.splice(index, 1)
      }

      return {
        release(atSec) {
          if (request.techniqueType === 'centok') return
          fadeOut(voice, atSec, RELEASE_SEC)
        },
        stop(atSec) {
          fadeOut(voice, atSec, 0.01)
        },
      }
    },

    warm(angklung, techniqueType, hardness = 0.5) {
      bufferFor({ angklung, techniqueType, shakeRateHz: 2.5, hardness }, 0)
    },

    releaseAll(atSec) {
      for (const voice of [...active]) fadeOut(voice, atSec, RELEASE_SEC)
    },

    activeCount: () => active.length,
    cachedCount: () => buffers.size,

    inspect(request) {
      const buffer = bufferFor(request, 0)
      const data = buffer.getChannelData(0)
      let peak = 0
      for (let n = 0; n < data.length; n += 1) peak = Math.max(peak, Math.abs(data[n] ?? 0))
      return {
        peak,
        lengthSamples: buffer.length,
        sampleRateHz: buffer.sampleRate,
        writtenWith: hasCopyToChannel(buffer) ? 'copyToChannel' : 'getChannelData',
      }
    },
  }
}

function hasCopyToChannel(buffer: AudioBuffer): boolean {
  return typeof (buffer as { copyToChannel?: unknown }).copyToChannel === 'function'
}

/**
 * copyToChannel arrived in Safari 14.1. Writing through getChannelData works
 * everywhere and is the fallback, because a missing method here throws inside the
 * first press and the only symptom is silence.
 */
function writeChannel(buffer: AudioBuffer, samples: Float32Array): void {
  if (hasCopyToChannel(buffer)) {
    buffer.copyToChannel(samples, 0)
    return
  }
  buffer.getChannelData(0).set(samples)
}

/** Stable seed from the cache key, so a given instrument and take always match. */
function hashSeed(key: string): number {
  let hash = 2166136261
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}
