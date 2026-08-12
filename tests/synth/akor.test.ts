import { describe, expect, it } from 'vitest'
import { AKOR_INTERVALS_CENTS, render, soundingTabung } from '@/lib/synth'
import { centsBetween } from '@/lib/tuning'
import { akompanimenMayor, kurulung, params, SAMPLE_RATE_HZ, tengkep } from './helpers/fixtures'
import { magnitudeAtHz, peakNearHz, spectrumOf } from './helpers/dsp'

/**
 * THE FIXTURE. PRD §2: a major angklung akompanimen sounds four tubes forming a
 * dominant seventh; hold one tube under tengkep and three remain, a major triad.
 * The player's little finger is a chord-quality switch.
 *
 * This is the project's most distinctive claim. The tolerances here do not get
 * relaxed to make a change pass — if this fails, the model is wrong.
 */
const CHORD_TOLERANCE_CENTS = 10
const ABSENCE_RATIO = 0.05

const ROOT_HZ = 261.6255653005986 // C4, so the chord is C7 → C major.

const DOMINANT_SEVENTH_CENTS = [0, 400, 700, 1000]
const MAJOR_TRIAD_CENTS = [0, 400, 700]

function chordCents(signal: Float32Array, expectedCents: readonly number[]): number[] {
  const spectrum = spectrumOf(signal, SAMPLE_RATE_HZ, { startSec: 0.02, lengthSec: 0.8 })
  return expectedCents.map((cents) => {
    const targetHz = ROOT_HZ * Math.pow(2, cents / 1200)
    const measuredHz = peakNearHz(spectrum, targetHz, targetHz * 0.03)
    if (measuredHz === null) throw new Error(`Tidak ada puncak di sekitar ${targetHz} Hz`)
    return centsBetween(ROOT_HZ, measuredHz)
  })
}

describe('angklung akompanimen mayor', () => {
  const durationSec = 1.6

  it('sounds four tubes forming a dominant seventh without tengkep', () => {
    const angklung = akompanimenMayor(ROOT_HZ)
    expect(soundingTabung(angklung, false)).toHaveLength(4)

    const signal = render(params(angklung, kurulung(durationSec), 2.4))
    const measured = chordCents(signal, DOMINANT_SEVENTH_CENTS)

    measured.forEach((cents, index) => {
      const expected = DOMINANT_SEVENTH_CENTS[index] as number
      expect(Math.abs(cents - expected), `nada ke-${index + 1}`).toBeLessThan(
        CHORD_TOLERANCE_CENTS,
      )
    })
  })

  it('sounds three tubes forming a major triad with tengkep', () => {
    const angklung = akompanimenMayor(ROOT_HZ)
    expect(soundingTabung(angklung, true)).toHaveLength(3)

    const signal = render(params(angklung, tengkep(durationSec), 2.4))
    const measured = chordCents(signal, MAJOR_TRIAD_CENTS)

    measured.forEach((cents, index) => {
      const expected = MAJOR_TRIAD_CENTS[index] as number
      expect(Math.abs(cents - expected), `nada ke-${index + 1}`).toBeLessThan(
        CHORD_TOLERANCE_CENTS,
      )
    })
  })

  it('the seventh is the tube that goes — and it goes entirely', () => {
    const angklung = akompanimenMayor(ROOT_HZ)
    const seventhHz = ROOT_HZ * Math.pow(2, 1000 / 1200)
    const analyse = (signal: Float32Array) =>
      spectrumOf(signal, SAMPLE_RATE_HZ, { startSec: 0.02, lengthSec: 0.8 })

    const open = analyse(render(params(angklung, kurulung(durationSec), 2.4)))
    const held = analyse(render(params(angklung, tengkep(durationSec), 2.4)))

    // Present without tengkep: a real partial, comparable in weight to the root.
    expect(magnitudeAtHz(open, seventhHz) / magnitudeAtHz(open, ROOT_HZ)).toBeGreaterThan(0.15)

    // Gone with it: 30 dB down. What remains at that frequency is not the seventh
    // but the skirt of the fifth two semitones below, so there is no peak there —
    // energy falls monotonically through the region.
    expect(magnitudeAtHz(held, seventhHz) / magnitudeAtHz(open, seventhHz)).toBeLessThan(
      ABSENCE_RATIO,
    )
    const shape = [-40, -20, 0, 20, 40].map((offset) =>
      magnitudeAtHz(held, seventhHz + offset, 3),
    )
    shape.slice(1).forEach((magnitude, index) => {
      expect(magnitude, `tidak ada puncak di septim (offset ${index})`).toBeLessThan(
        shape[index] as number,
      )
    })
  })

  it('is a removal, not a filter: the held render IS the three-tube render', () => {
    const angklung = akompanimenMayor(ROOT_HZ)
    const triadOnly = { ...angklung, tabung: soundingTabung(angklung, true) }

    const held = render(params(angklung, tengkep(durationSec), 2.4))
    const threeTubes = render(params(triadOnly, kurulung(durationSec), 2.4))

    expect(Buffer.from(held.buffer)).toEqual(Buffer.from(threeTubes.buffer))
  })

  it('the interval structure is declared in the data, not discovered in the render', () => {
    expect(AKOR_INTERVALS_CENTS.mayor).toEqual({
      root: 0,
      terts: 400,
      kuint: 700,
      septim: 1000,
    })
    const angklung = akompanimenMayor(ROOT_HZ)
    expect(angklung.tabung.map((t) => t.intervalCents)).toEqual(DOMINANT_SEVENTH_CENTS)
    expect(angklung.tabung.filter((t) => t.mutedByTengkep).map((t) => t.intervalCents)).toEqual([
      1000,
    ])
  })
})
