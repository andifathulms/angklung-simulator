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
 * Safari adds an 'interrupted' state that is not in the specification. It happens
 * on a phone call, on a Siri invocation, and when the page is backgrounded — and a
 * context in this state accepts scheduling without ever making a sound.
 */
export type ExtendedContextState = AudioContextState | 'interrupted'

export function contextState(engine: AudioEngine): ExtendedContextState {
  return engine.context.state as ExtendedContextState
}

export function isRunnable(state: ExtendedContextState): boolean {
  return state === 'running'
}

/** True for a WebKit-backed browser, which on iOS is every browser. */
export function isWebKit(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isAppleTouch = /iPad|iPhone|iPod/.test(ua)
  const isIpadOnDesktopUa = ua.includes('Macintosh') && navigator.maxTouchPoints > 1
  const isSafariDesktop = /Safari/.test(ua) && !/Chrome|Chromium|Android/.test(ua)
  return isAppleTouch || isIpadOnDesktopUa || isSafariDesktop
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
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
  if (context.state !== 'running') await context.resume()

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

  // iOS keeps the hardware asleep until something has actually been played, and
  // the first real note can be swallowed. One silent sample wakes it inside the
  // gesture that started the context — no audio file involved, so invariant 2
  // is untouched.
  const wake = context.createBufferSource()
  wake.buffer = context.createBuffer(1, 1, context.sampleRate)
  wake.connect(context.destination)
  wake.start(0)

  return { context, master, limiter }
}

/**
 * Bring a context back after an interruption. Safari suspends on a call, on Siri,
 * and on backgrounding, and resuming needs a gesture again on iOS — so this is
 * wired to real interaction events, not to a timer.
 */
export async function resumeAudioEngine(engine: AudioEngine): Promise<boolean> {
  const state = contextState(engine)
  if (isRunnable(state)) return true
  try {
    await engine.context.resume()
    return isRunnable(contextState(engine))
  } catch {
    return false
  }
}

export async function stopAudioEngine(engine: AudioEngine): Promise<void> {
  engine.master.disconnect()
  engine.limiter.disconnect()
  await engine.context.close()
}
