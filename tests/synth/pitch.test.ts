import { describe, expect, it } from 'vitest'
import { render } from '@/lib/synth'
import { PADAENG, centsBetween, pitchToHz } from '@/lib/tuning'
import { centok, melodi, params, SAMPLE_RATE_HZ, tengkep } from './helpers/fixtures'
import { dominantHz, magnitudeAtHz, spectrumOf } from './helpers/dsp'

/**
 * Stated tolerance: ±10 cents. An angklung set is tuned by ear and by cutting
 * bamboo, so this is well inside what the instrument itself holds — but it is
 * tight enough that a wrong model cannot pass.
 */
const PITCH_TOLERANCE_CENTS = 10

describe('rendered pitch', () => {
  it('lands the fundamental on target for A4', () => {
    const signal = render(params(melodi(440), centok()))
    const spectrum = spectrumOf(signal, SAMPLE_RATE_HZ, { lengthSec: 0.5 })
    expect(Math.abs(centsBetween(440, dominantHz(spectrum)))).toBeLessThan(PITCH_TOLERANCE_CENTS)
  })

  it('lands within tolerance across the whole padaeng set', () => {
    // Two and a half octaves — the range a real angklung set covers.
    for (let octave = 4; octave <= 6; octave += 1) {
      for (let degreeIndex = 0; degreeIndex < PADAENG.degrees.length; degreeIndex += 1) {
        const targetHz = pitchToHz(PADAENG, { degreeIndex, octave })
        if (targetHz > 2200) continue
        const signal = render(params(melodi(targetHz), centok(), 1.2))
        const spectrum = spectrumOf(signal, SAMPLE_RATE_HZ, { lengthSec: 0.4 })
        const measuredHz = dominantHz(spectrum, targetHz * 0.7)
        const errorCents = centsBetween(targetHz, measuredHz)
        expect(
          Math.abs(errorCents),
          `${PADAENG.degrees[degreeIndex]?.name}${octave} — target ${targetHz.toFixed(2)} Hz, measured ${measuredHz.toFixed(2)} Hz`,
        ).toBeLessThan(PITCH_TOLERANCE_CENTS)
      }
    }
  })

  it('is a stopped pipe: odd partials present above the fundamental', () => {
    // Tengkep holds the octave tube, so this render is the tabung dasar alone —
    // the only way to see one tube's modal structure on its own.
    const dasarOnly = render(params(melodi(440), tengkep(0.6), 1.4))
    const spectrum = spectrumOf(dasarOnly, SAMPLE_RATE_HZ, { lengthSec: 0.4 })
    const fundamental = magnitudeAtHz(spectrum, 440)

    expect(magnitudeAtHz(spectrum, 1320) / fundamental).toBeGreaterThan(0.01) // 3f
    expect(magnitudeAtHz(spectrum, 2200) / fundamental).toBeGreaterThan(0.002) // 5f
  })
})
