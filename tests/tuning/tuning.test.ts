import { describe, expect, it } from 'vitest'
import {
  PADAENG,
  PELOG_DEGUNG,
  SALENDRO,
  TUNINGS,
  centsBetween,
  getTuning,
  parsePitchId,
  pitchId,
  pitchToHz,
  withEditedCents,
} from '@/lib/tuning'

describe('citations', () => {
  // Invariant 8: a laras without a citation does not ship.
  it.each(TUNINGS.map((t) => [t.id, t] as const))('%s carries a source', (_id, tuning) => {
    expect(tuning.source.title.length).toBeGreaterThan(20)
    expect(tuning.source.note.length).toBeGreaterThan(20)
    // A laras must say where its numbers stop being verified. Without this the
    // citation is decoration.
    expect(tuning.source.caveat.length).toBeGreaterThan(40)
  })

  it('does not claim a source this project has not actually read', () => {
    // Kunst's Music in Java (1949) is the usual attribution for the 240-cent
    // slendro figure, and it reaches this project through secondary literature.
    // Wherever it is named, the caveat must say so.
    for (const tuning of TUNINGS) {
      const mentionsKunst = /Kunst/i.test(tuning.source.title + tuning.source.note)
      if (!mentionsKunst) continue
      expect(tuning.source.caveat).toMatch(/sekunder|belum diperiksa/)
    }
  })

  it('marks salendro and pelog as one documented set, not the standard', () => {
    for (const tuning of [SALENDRO, PELOG_DEGUNG]) {
      expect(tuning.description).toMatch(/terdokumentasi/)
      expect(tuning.descriptionEn.toLowerCase()).toMatch(/varies|no fixed standard/)
    }
  })
})

describe('cents against the cited sources', () => {
  it('padaeng is exactly twelve equal steps of 100 cents', () => {
    expect(PADAENG.degrees).toHaveLength(12)
    PADAENG.degrees.forEach((degree, index) => {
      expect(degree.cents).toBe(index * 100)
    })
  })

  it('salendro is five near-equidistant steps of 240 cents', () => {
    expect(SALENDRO.degrees).toHaveLength(5)
    SALENDRO.degrees.forEach((degree, index) => {
      expect(degree.cents).toBe(index * 240)
    })
  })

  it('pelog degung sits on the nine-tone framework its source describes', () => {
    const cents = PELOG_DEGUNG.degrees.map((d) => d.cents)
    expect(cents).toHaveLength(5)

    // Pelog is documented as small steps near 133 cents and double steps near
    // 267 — an approximation of nine equal divisions of the octave. Every degree
    // must land on a multiple of 1200/9, within rounding.
    const step = 1200 / 9
    for (const value of cents) {
      const nearest = Math.round(value / step) * step
      expect(Math.abs(value - nearest), `${value} sen`).toBeLessThan(1)
    }

    // Narrow, narrow, wide, narrow — the degung colour. Not equidistant.
    const steps = cents.slice(1).map((c, i) => c - (cents[i] ?? 0))
    expect(steps[0]).toBeLessThan(200)
    expect(steps[2]).toBeGreaterThan(350)
    expect(Math.max(...steps) - Math.min(...steps)).toBeGreaterThan(200)
  })

  it('every laras is strictly ascending and inside one octave', () => {
    for (const tuning of TUNINGS) {
      const cents = tuning.degrees.map((d) => d.cents)
      expect(cents[0]).toBe(0)
      for (let i = 1; i < cents.length; i += 1) {
        expect(cents[i] ?? 0).toBeGreaterThan(cents[i - 1] ?? 0)
      }
      expect(cents[cents.length - 1] ?? 0).toBeLessThan(1200)
    }
  })
})

describe('pitch mapping', () => {
  it('resolves A4 to 440 Hz in padaeng', () => {
    const a4 = parsePitchId(PADAENG, 'A4')
    expect(a4).not.toBeNull()
    expect(pitchToHz(PADAENG, a4!)).toBeCloseTo(440, 6)
  })

  it('an octave up is exactly double', () => {
    const c4 = pitchToHz(PADAENG, { degreeIndex: 0, octave: 4 })
    const c5 = pitchToHz(PADAENG, { degreeIndex: 0, octave: 5 })
    expect(centsBetween(c4, c5)).toBeCloseTo(1200, 6)
  })

  it('round-trips pitch ids', () => {
    for (const tuning of TUNINGS) {
      tuning.degrees.forEach((_, degreeIndex) => {
        const pitch = { degreeIndex, octave: 4 }
        const parsed = parsePitchId(tuning, pitchId(tuning, pitch))
        expect(parsed).toEqual(pitch)
      })
    }
  })

  it('returns null for a pitch outside the laras rather than guessing', () => {
    expect(parsePitchId(SALENDRO, 'C#4')).toBeNull()
    expect(parsePitchId(PADAENG, 'not-a-pitch')).toBeNull()
  })

  it('getTuning finds each laras', () => {
    expect(getTuning('padaeng').id).toBe('padaeng')
    expect(getTuning('pelog-degung').id).toBe('pelog-degung')
  })
})

describe('editability', () => {
  it('accepts edited cents without mutating the shipped definition', () => {
    const edited = withEditedCents(SALENDRO, new Map([[1, 231]]))
    expect(edited.degrees[1]?.cents).toBe(231)
    expect(SALENDRO.degrees[1]?.cents).toBe(240)
  })
})
