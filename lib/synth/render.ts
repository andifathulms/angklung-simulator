import { soundingTabung } from './angklung'
import { excitationDurationSec, excitationFor, mutesTube, renderExcitation } from './excitation'
import { renderTabung, tabungTailSec } from './resonator'
import type { RenderParams, Strike } from './types'

/**
 * params → Float32Array. The whole point of lib/synth: the instrument can be
 * rendered and measured in Node, so its correctness is asserted rather than judged
 * by ear (invariant 1).
 */

/** Above this the limiter engages; below it the render is exactly linear, so FFT tests measure the model. */
const LIMIT_KNEE = 0.95

/** How long a render must be to contain the whole note plus its ring-out. */
export function suggestedDurationSec(params: Omit<RenderParams, 'durationSec'>): number {
  const tails = params.angklung.tabung.map((tabung) => tabungTailSec(tabung.hz))
  return excitationDurationSec(params.technique) + Math.max(...tails) + 0.05
}

export function render(params: RenderParams): Float32Array {
  const { angklung, technique, sampleRateHz, durationSec, gain } = params
  const lengthSamples = Math.max(1, Math.ceil(durationSec * sampleRateHz))

  const strikes = excitationFor(technique)
  const excitation = renderExcitation(strikes, sampleRateHz, lengthSamples, angklung.rootHz)

  const out = new Float32Array(lengthSamples)
  // Tengkep removes the held tube from the sum. There is no filter here and no
  // gain change — the tube's modes are simply never rendered (invariant 4).
  for (const tabung of soundingTabung(angklung, mutesTube(technique))) {
    renderTabung(excitation, out, tabung.hz, tabung.gain, sampleRateHz)
  }

  applyGain(out, gain)
  return out
}

/**
 * Render several angklung into one buffer — an ensemble, offline. Used by the
 * distribution tests and the polyphony benchmark.
 */
export function renderMix(
  voices: readonly { params: RenderParams; startSec: number }[],
  sampleRateHz: number,
  durationSec: number,
): Float32Array {
  const lengthSamples = Math.max(1, Math.ceil(durationSec * sampleRateHz))
  const mix = new Float32Array(lengthSamples)

  for (const voice of voices) {
    const buffer = render({ ...voice.params, sampleRateHz })
    const offset = Math.round(voice.startSec * sampleRateHz)
    const count = Math.min(buffer.length, lengthSamples - offset)
    for (let n = 0; n < count; n += 1) {
      if (offset + n < 0) continue
      mix[offset + n] += buffer[n]
    }
  }

  softLimit(mix)
  return mix
}

/**
 * The strike train for a technique, exposed for the technique lab so the
 * excitation the user sees is the excitation the audio hears (PRD §5.7).
 */
export function excitationTrace(params: Pick<RenderParams, 'technique'>): readonly Strike[] {
  return excitationFor(params.technique)
}

function applyGain(buffer: Float32Array, gain: number): void {
  for (let n = 0; n < buffer.length; n += 1) {
    buffer[n] *= gain
  }
}

/** Largest absolute sample. The audio layer uses this to set its voice gain. */
export function peakOf(buffer: Float32Array): number {
  let peak = 0
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample))
  return peak
}

/**
 * Linear below the knee, compressed above it. Applied at the mix, never to a single
 * render: a limiter inside one note would make the model non-linear and the
 * spectrum tests would be measuring the limiter instead of the instrument.
 */
function softLimit(buffer: Float32Array): void {
  for (let n = 0; n < buffer.length; n += 1) {
    const x = buffer[n]
    const magnitude = Math.abs(x)
    if (magnitude <= LIMIT_KNEE) continue
    const excess = magnitude - LIMIT_KNEE
    const compressed = LIMIT_KNEE + (1 - LIMIT_KNEE) * Math.tanh(excess / (1 - LIMIT_KNEE))
    buffer[n] = Math.sign(x) * compressed
  }
}
