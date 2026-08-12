import { describe, expect, it } from 'vitest'
import { render, soundingTabung } from '@/lib/synth'
import { kurulung, melodi, params, SAMPLE_RATE_HZ, tengkep } from './helpers/fixtures'
import { magnitudeAtHz, spectrumOf } from './helpers/dsp'

/**
 * Tengkep removes a resonator from the sum. Asserted in BOTH directions: the
 * octave tube's partials are present without tengkep and absent with it.
 *
 * A filter or a gain change would fail the "absent" direction only weakly — so the
 * threshold is a 40 dB drop, far below anything an EQ move would produce.
 */
const ABSENCE_RATIO = 0.01

describe('tengkep on an angklung melodi', () => {
  const rootHz = 440
  const octaveHz = 880
  const durationSec = 1.6

  const analyse = (signal: Float32Array) =>
    spectrumOf(signal, SAMPLE_RATE_HZ, { startSec: 0.02, lengthSec: 0.6 })

  it('the octave tube sounds without tengkep', () => {
    const spectrum = analyse(render(params(melodi(rootHz), kurulung(durationSec), 2.4)))
    const fundamental = magnitudeAtHz(spectrum, rootHz)
    expect(magnitudeAtHz(spectrum, octaveHz) / fundamental).toBeGreaterThan(0.2)
  })

  it('the octave tube is absent with tengkep', () => {
    const spectrum = analyse(render(params(melodi(rootHz), tengkep(durationSec), 2.4)))
    const fundamental = magnitudeAtHz(spectrum, rootHz)
    expect(magnitudeAtHz(spectrum, octaveHz) / fundamental).toBeLessThan(ABSENCE_RATIO)
  })

  it('is a removal, not a filter: the held render IS the one-tube render', () => {
    // The decisive form of invariant 4. If tengkep were implemented as a filter, a
    // gain change, or a preset, these two buffers would differ. They are identical
    // sample for sample because the held tube's modes are never rendered at all.
    const angklung = melodi(rootHz)
    const withoutOctave = { ...angklung, tabung: soundingTabung(angklung, true) }

    const held = render(params(angklung, tengkep(durationSec), 2.4))
    const oneTube = render(params(withoutOctave, kurulung(durationSec), 2.4))

    expect(Buffer.from(held.buffer)).toEqual(Buffer.from(oneTube.buffer))
  })

  it('leaves the tabung dasar audibly unchanged', () => {
    const open = analyse(render(params(melodi(rootHz), kurulung(durationSec), 2.4)))
    const held = analyse(render(params(melodi(rootHz), tengkep(durationSec), 2.4)))

    // Not bit-identical in the spectrum — removing a resonator also removes the
    // skirt it contributed at neighbouring frequencies, which is real physics —
    // but nothing here is attenuated the way a filter would attenuate it.
    for (const hz of [rootHz, rootHz * 3, rootHz * 5]) {
      const ratio = magnitudeAtHz(held, hz) / magnitudeAtHz(open, hz)
      expect(ratio, `${hz} Hz`).toBeGreaterThan(0.97)
      expect(ratio, `${hz} Hz`).toBeLessThan(1.03)
    }
  })

  it('is a single note held, two notes open', () => {
    expect(soundingTabung(melodi(rootHz), false)).toHaveLength(2)
    expect(soundingTabung(melodi(rootHz), true)).toHaveLength(1)
  })
})
