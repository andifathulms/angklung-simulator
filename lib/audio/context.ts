/**
 * The Web Audio boundary. Nothing above this line touches an AudioContext, and
 * lib/synth never does at all.
 */

export type EngineState = 'belum-mulai' | 'siap' | 'gagal'

export interface AudioEngine {
  readonly context: AudioContext
  /** Everything goes through here, so one control mutes the room. */
  readonly master: GainNode
  /** Mix-bus limiter. A full ensemble is many resonators; this is the last guard. */
  readonly limiter: DynamicsCompressorNode
}

type AudioContextConstructor = new (options?: AudioContextOptions) => AudioContext

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') return null
  const candidate =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
  return candidate ?? null
}

export function isAudioSupported(): boolean {
  return audioContextConstructor() !== null
}

/**
 * Must be called from inside a user gesture. iOS will not start an AudioContext
 * any other way, so the UI carries an explicit start control and never autostarts
 * (invariant 13).
 */
export async function startAudioEngine(): Promise<AudioEngine> {
  const Constructor = audioContextConstructor()
  if (Constructor === null) throw new Error('Web Audio tidak tersedia di peramban ini.')

  const context = new Constructor({ latencyHint: 'interactive' })
  // Safari starts suspended even inside a gesture; resume is part of starting.
  if (context.state === 'suspended') await context.resume()

  const limiter = context.createDynamicsCompressor()
  limiter.threshold.value = -6
  limiter.knee.value = 6
  limiter.ratio.value = 12
  limiter.attack.value = 0.003
  limiter.release.value = 0.18

  const master = context.createGain()
  master.gain.value = 0.9

  master.connect(limiter)
  limiter.connect(context.destination)

  return { context, master, limiter }
}

export async function stopAudioEngine(engine: AudioEngine): Promise<void> {
  engine.master.disconnect()
  engine.limiter.disconnect()
  await engine.context.close()
}
