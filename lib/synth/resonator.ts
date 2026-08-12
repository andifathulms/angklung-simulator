import type { Mode } from './types'

/**
 * The modal resonator. A bamboo tube is a small bank of resonant modes with
 * exponential decay (PRD §4). Each mode is a two-pole resonator driven by the
 * excitation signal:
 *
 *   y[n] = g·x[n] + 2·r·cos(ω)·y[n-1] − r²·y[n-2]
 *
 * whose impulse response is r^n·sin(ω(n+1))/sin(ω) — a decaying sinusoid at ω,
 * which is exactly what a struck mode does.
 *
 * This module knows nothing about techniques. It is handed an excitation signal
 * and returns a ringing one. Invariant 3.
 */

/** 60 dB is a factor of 1000 in amplitude. */
const LN_1000 = Math.log(1000)

/**
 * Modal structure of an angklung tube, as ratios against its fundamental.
 *
 * A bamboo angklung tube is closed at the node and open at the cut, so it behaves
 * as a stopped pipe: odd partials dominate, and there is no strong component at
 * twice the fundamental. That absence is what makes tengkep testable — the octave
 * tube's fundamental is the only thing at 2f, so removing the tube removes the
 * partial outright.
 *
 * The high inharmonic mode is the bamboo body itself, not the air column. It is
 * what gives the "klung" its wooden edge; it decays fast enough to read as attack.
 */
export const TABUNG_MODES: readonly Mode[] = [
  { ratio: 1, amplitude: 1, decayT60Sec: 1.15 },
  { ratio: 3, amplitude: 0.115, decayT60Sec: 0.42 },
  { ratio: 5, amplitude: 0.045, decayT60Sec: 0.26 },
  { ratio: 7.83, amplitude: 0.03, decayT60Sec: 0.11 },
]

/**
 * Higher tubes are shorter and lose energy faster, so decay is scaled against a
 * reference pitch rather than being constant across the set. Without this the top
 * of the rack rings like a bell and the bottom sounds correct.
 */
const DECAY_REFERENCE_HZ = 440
const DECAY_PITCH_EXPONENT = 0.45

export function decayScaleFor(fundamentalHz: number): number {
  return Math.pow(DECAY_REFERENCE_HZ / fundamentalHz, DECAY_PITCH_EXPONENT)
}

/**
 * Run one mode over an excitation signal, accumulating into `out`.
 * Modes above Nyquist are skipped rather than aliased into the render.
 */
export function renderMode(
  excitation: Float32Array,
  out: Float32Array,
  frequencyHz: number,
  amplitude: number,
  decayT60Sec: number,
  sampleRateHz: number,
): void {
  const nyquistHz = sampleRateHz / 2
  if (frequencyHz <= 0 || frequencyHz >= nyquistHz * 0.98) return
  if (decayT60Sec <= 0 || amplitude === 0) return

  const omega = (2 * Math.PI * frequencyHz) / sampleRateHz
  const tauSec = decayT60Sec / LN_1000
  const r = Math.exp(-1 / (tauSec * sampleRateHz))
  const a1 = 2 * r * Math.cos(omega)
  const a2 = -(r * r)
  // sin(ω) normalises the impulse response peak to `amplitude`, so a mode's
  // loudness does not drift with its frequency.
  const gain = amplitude * Math.sin(omega)

  let y1 = 0
  let y2 = 0
  for (let n = 0; n < excitation.length; n += 1) {
    const y = gain * excitation[n] + a1 * y1 + a2 * y2
    y2 = y1
    y1 = y
    out[n] += y
  }
}

/**
 * Render one tube: its whole modal bank, driven by the excitation, summed into `out`.
 * A tube that is not in the sum is simply never passed here — that is what tengkep is.
 */
export function renderTabung(
  excitation: Float32Array,
  out: Float32Array,
  fundamentalHz: number,
  gain: number,
  sampleRateHz: number,
  modes: readonly Mode[] = TABUNG_MODES,
): void {
  const decayScale = decayScaleFor(fundamentalHz)
  for (const mode of modes) {
    renderMode(
      excitation,
      out,
      fundamentalHz * mode.ratio,
      mode.amplitude * gain,
      mode.decayT60Sec * decayScale,
      sampleRateHz,
    )
  }
}

/** Longest ring of a tube — used to size render buffers so tails are not clipped. */
export function tabungTailSec(fundamentalHz: number, modes: readonly Mode[] = TABUNG_MODES): number {
  const scale = decayScaleFor(fundamentalHz)
  return Math.max(...modes.map((mode) => mode.decayT60Sec)) * scale
}
