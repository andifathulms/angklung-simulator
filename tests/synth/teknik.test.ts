import { describe, expect, it } from 'vitest'
import {
  KURULUNG_SHAKE_RATE_RANGE_HZ,
  STRIKES_PER_SHAKE,
  excitationFor,
  excitationTrace,
  render,
} from '@/lib/synth'
import { centok, kurulung, melodi, params, SAMPLE_RATE_HZ, tengkep } from './helpers/fixtures'
import { detectOnsets } from './helpers/dsp'

describe('centok', () => {
  it('sounds exactly once — in the excitation and in the render', () => {
    expect(excitationFor(centok())).toHaveLength(1)

    const signal = render(params(melodi(440), centok()))
    expect(detectOnsets(signal, SAMPLE_RATE_HZ)).toHaveLength(1)
  })

  it('strikes harder than a kurulung strike', () => {
    const centokStrike = excitationFor(centok())[0]
    const kurulungStrikes = excitationFor(kurulung())
    expect(centokStrike).toBeDefined()
    for (const strike of kurulungStrikes) {
      expect(centokStrike!.strength).toBeGreaterThan(strike.strength)
      expect(centokStrike!.hardness).toBeGreaterThan(strike.hardness)
    }
  })
})

describe('kurulung', () => {
  it('strikes at the cited rate: 2–3 Hz shake, two strikes per shake', () => {
    for (const shakeRateHz of [2, 2.5, 3]) {
      const durationSec = 4
      const strikes = excitationFor(kurulung(durationSec, shakeRateHz))
      const measuredStrikesPerSec = strikes.length / durationSec
      const expectedStrikesPerSec = shakeRateHz * STRIKES_PER_SHAKE

      expect(measuredStrikesPerSec).toBeGreaterThan(expectedStrikesPerSec - 0.5)
      expect(measuredStrikesPerSec).toBeLessThan(expectedStrikesPerSec + 0.5)
    }
  })

  it('carries the strike train into the rendered signal', () => {
    const durationSec = 3
    const signal = render(params(melodi(330), kurulung(durationSec, 2.5), durationSec + 1))
    const onsets = detectOnsets(signal, SAMPLE_RATE_HZ, { minSpacingSec: 0.08 })

    const measuredStrikesPerSec = onsets.length / durationSec
    const shakeRateHz = measuredStrikesPerSec / STRIKES_PER_SHAKE
    expect(shakeRateHz).toBeGreaterThanOrEqual(KURULUNG_SHAKE_RATE_RANGE_HZ.minHz)
    expect(shakeRateHz).toBeLessThanOrEqual(KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz)
  })

  it('is irregular, not a machine tremolo', () => {
    const strikes = excitationFor(kurulung(4, 2.5))
    const intervals = strikes.slice(1).map((s, i) => s.timeSec - (strikes[i]?.timeSec ?? 0))
    const unique = new Set(intervals.map((i) => i.toFixed(6)))
    expect(unique.size).toBeGreaterThan(intervals.length - 2)
  })

  it('holds the mean rate despite the jitter', () => {
    const durationSec = 12
    const strikes = excitationFor(kurulung(durationSec, 2.5))
    const first = strikes[0]
    const last = strikes[strikes.length - 1]
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    const meanIntervalSec = (last!.timeSec - first!.timeSec) / (strikes.length - 1)
    expect(1 / meanIntervalSec).toBeCloseTo(2.5 * STRIKES_PER_SHAKE, 1)
  })
})

describe('one model, three excitation patterns', () => {
  it('tengkep uses the same strike train as kurulung', () => {
    // Tengkep is kurulung with a tube held. If these ever diverge, tengkep has
    // become a second sound path — see invariant 3.
    expect(excitationFor(tengkep(2, 2.5))).toEqual(excitationFor(kurulung(2, 2.5)))
  })

  it('exposes the same trace the audio hears, for the technique lab', () => {
    const technique = kurulung(2)
    expect(excitationTrace({ technique })).toEqual(excitationFor(technique))
  })
})

describe('determinism', () => {
  it('renders byte-identically for the same params and seed', () => {
    for (const technique of [centok(), kurulung(1.5), tengkep(1.5)]) {
      const a = render(params(melodi(392), technique))
      const b = render(params(melodi(392), technique))
      expect(Buffer.from(a.buffer)).toEqual(Buffer.from(b.buffer))
    }
  })

  it('changes with the seed — the irregularity is real, not decorative', () => {
    const a = render(params(melodi(392), { ...kurulung(1.5), seed: 1 }))
    const b = render(params(melodi(392), { ...kurulung(1.5), seed: 2 }))
    expect(Buffer.from(a.buffer)).not.toEqual(Buffer.from(b.buffer))
  })
})
