/**
 * Measurement helpers for the offline render tests. Pure, dependency-free — the
 * project ships no DSP dependency and the tests do not get one either.
 *
 * These do not belong in lib/: they measure the instrument, they are not part of it.
 */

/** In-place iterative radix-2 Cooley–Tukey FFT. `re`/`im` must be a power of two long. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length
  if (n !== im.length || (n & (n - 1)) !== 0) {
    throw new Error('FFT length must be a power of two')
  }

  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1
    for (; (j & bit) !== 0; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j] as number, re[i] as number]
      ;[im[i], im[j]] = [im[j] as number, im[i] as number]
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const angle = (-2 * Math.PI) / len
    const wRe = Math.cos(angle)
    const wIm = Math.sin(angle)
    for (let i = 0; i < n; i += len) {
      let curRe = 1
      let curIm = 0
      for (let k = 0; k < len / 2; k += 1) {
        const aRe = re[i + k] as number
        const aIm = im[i + k] as number
        const bRe = (re[i + k + len / 2] as number) * curRe - (im[i + k + len / 2] as number) * curIm
        const bIm = (re[i + k + len / 2] as number) * curIm + (im[i + k + len / 2] as number) * curRe
        re[i + k] = aRe + bRe
        im[i + k] = aIm + bIm
        re[i + k + len / 2] = aRe - bRe
        im[i + k + len / 2] = aIm - bIm
        const nextRe = curRe * wRe - curIm * wIm
        curIm = curRe * wIm + curIm * wRe
        curRe = nextRe
      }
    }
  }
}

export interface Spectrum {
  readonly magnitudes: Float64Array
  readonly binHz: number
}

/** Hann-windowed magnitude spectrum of `signal`, zero-padded to a power of two. */
export function spectrumOf(
  signal: Float32Array,
  sampleRateHz: number,
  options: { startSec?: number; lengthSec?: number; fftSize?: number } = {},
): Spectrum {
  const startSample = Math.floor((options.startSec ?? 0) * sampleRateHz)
  const lengthSamples = Math.min(
    signal.length - startSample,
    Math.floor((options.lengthSec ?? 0.5) * sampleRateHz),
  )
  const size = options.fftSize ?? nextPowerOfTwo(Math.max(lengthSamples, 1) * 4)

  const re = new Float64Array(size)
  const im = new Float64Array(size)
  for (let n = 0; n < lengthSamples; n += 1) {
    const hann = 0.5 * (1 - Math.cos((2 * Math.PI * n) / lengthSamples))
    re[n] = (signal[startSample + n] as number) * hann
  }

  fft(re, im)

  const magnitudes = new Float64Array(size / 2)
  for (let k = 0; k < magnitudes.length; k += 1) {
    magnitudes[k] = Math.hypot(re[k] as number, im[k] as number)
  }
  return { magnitudes, binHz: sampleRateHz / size }
}

/** Interpolated frequency of the spectral peak nearest `targetHz`, within `windowHz`. */
export function peakNearHz(spectrum: Spectrum, targetHz: number, windowHz: number): number | null {
  const { magnitudes, binHz } = spectrum
  const lowBin = Math.max(1, Math.floor((targetHz - windowHz) / binHz))
  const highBin = Math.min(magnitudes.length - 2, Math.ceil((targetHz + windowHz) / binHz))
  if (highBin <= lowBin) return null

  let bestBin = lowBin
  for (let k = lowBin; k <= highBin; k += 1) {
    if ((magnitudes[k] as number) > (magnitudes[bestBin] as number)) bestBin = k
  }
  return interpolatedBinHz(spectrum, bestBin)
}

/** Interpolated frequency of the strongest peak in the whole spectrum. */
export function dominantHz(spectrum: Spectrum, minHz = 20): number {
  const { magnitudes, binHz } = spectrum
  let bestBin = Math.max(1, Math.floor(minHz / binHz))
  for (let k = bestBin; k < magnitudes.length - 1; k += 1) {
    if ((magnitudes[k] as number) > (magnitudes[bestBin] as number)) bestBin = k
  }
  return interpolatedBinHz(spectrum, bestBin)
}

/** Quadratic interpolation over the log magnitudes — sub-bin accuracy. */
function interpolatedBinHz(spectrum: Spectrum, bin: number): number {
  const { magnitudes, binHz } = spectrum
  const left = Math.log((magnitudes[bin - 1] as number) + 1e-30)
  const centre = Math.log((magnitudes[bin] as number) + 1e-30)
  const right = Math.log((magnitudes[bin + 1] as number) + 1e-30)
  const denominator = left - 2 * centre + right
  const shift = denominator === 0 ? 0 : (0.5 * (left - right)) / denominator
  return (bin + shift) * binHz
}

/** Peak magnitude within ±`windowHz` of `hz`. The measure of "is this partial there". */
export function magnitudeAtHz(spectrum: Spectrum, hz: number, windowHz = 12): number {
  const { magnitudes, binHz } = spectrum
  const lowBin = Math.max(0, Math.floor((hz - windowHz) / binHz))
  const highBin = Math.min(magnitudes.length - 1, Math.ceil((hz + windowHz) / binHz))
  let peak = 0
  for (let k = lowBin; k <= highBin; k += 1) {
    peak = Math.max(peak, magnitudes[k] as number)
  }
  return peak
}

/** All spectral peaks above `relativeThreshold` of the maximum, in Hz, ascending. */
export function partialsHz(
  spectrum: Spectrum,
  options: { minHz?: number; maxHz?: number; relativeThreshold?: number } = {},
): number[] {
  const { magnitudes, binHz } = spectrum
  const minHz = options.minHz ?? 40
  const maxHz = options.maxHz ?? 6000
  const threshold = options.relativeThreshold ?? 0.1

  let maximum = 0
  for (const magnitude of magnitudes) maximum = Math.max(maximum, magnitude)
  const floor = maximum * threshold

  const found: number[] = []
  const lowBin = Math.max(1, Math.floor(minHz / binHz))
  const highBin = Math.min(magnitudes.length - 2, Math.ceil(maxHz / binHz))
  for (let k = lowBin; k <= highBin; k += 1) {
    const magnitude = magnitudes[k] as number
    if (magnitude < floor) continue
    if (magnitude <= (magnitudes[k - 1] as number) || magnitude < (magnitudes[k + 1] as number)) {
      continue
    }
    found.push(interpolatedBinHz(spectrum, k))
  }
  return found
}

/**
 * Onset times in seconds, by positive spectral flux. Used to assert that centok
 * renders exactly one strike and that kurulung's train reaches the signal at the
 * cited rate.
 *
 * Spectral flux rather than an amplitude envelope: the instrument's partials are
 * harmonically related, so the waveform envelope ripples at the fundamental and an
 * envelope follower reports that ripple as strikes. A strike is broadband energy
 * *arriving*, which is what flux measures.
 */
export function detectOnsets(
  signal: Float32Array,
  sampleRateHz: number,
  options: { thresholdRatio?: number; minSpacingSec?: number } = {},
): number[] {
  const thresholdRatio = options.thresholdRatio ?? 0.15
  const minSpacingSec = options.minSpacingSec ?? 0.05
  const frameSize = 1024
  const hopSize = 256
  const frames = Math.floor((signal.length - frameSize) / hopSize)
  if (frames < 3) return []

  const bins = frameSize / 2
  let previous = new Float64Array(bins)
  const flux = new Float64Array(frames)

  for (let f = 0; f < frames; f += 1) {
    const re = new Float64Array(frameSize)
    const im = new Float64Array(frameSize)
    for (let n = 0; n < frameSize; n += 1) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * n) / frameSize))
      re[n] = (signal[f * hopSize + n] as number) * hann
    }
    fft(re, im)

    const current = new Float64Array(bins)
    let sum = 0
    for (let k = 0; k < bins; k += 1) {
      const magnitude = Math.hypot(re[k] as number, im[k] as number)
      current[k] = magnitude
      sum += Math.max(0, magnitude - (previous[k] as number))
    }
    flux[f] = sum
    previous = current
  }

  let maximum = 0
  for (const value of flux) maximum = Math.max(maximum, value)
  if (maximum === 0) return []
  const floor = maximum * thresholdRatio
  const minSpacingFrames = Math.max(1, Math.round((minSpacingSec * sampleRateHz) / hopSize))

  const onsets: number[] = []
  let lastFrame = -Infinity
  for (let f = 0; f < frames; f += 1) {
    const value = flux[f] as number
    if (value < floor) continue
    // Edges count: a note that starts at sample zero peaks in the first frame.
    const before = f > 0 ? (flux[f - 1] as number) : -Infinity
    const after = f < frames - 1 ? (flux[f + 1] as number) : -Infinity
    if (value < before || value < after) continue
    if (f - lastFrame < minSpacingFrames) continue
    // Report the frame's centre, so an onset time is the middle of the window
    // that saw the energy arrive.
    onsets.push((f * hopSize + frameSize / 2) / sampleRateHz)
    lastFrame = f
  }
  return onsets
}

export function rms(signal: Float32Array): number {
  let sum = 0
  for (const sample of signal) sum += sample * sample
  return Math.sqrt(sum / signal.length)
}

function nextPowerOfTwo(value: number): number {
  let size = 1
  while (size < value) size <<= 1
  return size
}
