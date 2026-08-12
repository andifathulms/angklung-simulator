import { centsToRatio } from '@/lib/tuning/cents'
import type { AkorKualitas, AngklungSpec, Tabung } from './types'

/**
 * Angklung construction: which tubes an instrument has, and which one the little
 * finger lands on under tengkep.
 *
 * An angklung holds two or more tubes tuned in octaves, so the default sound is
 * already two notes — which is why tengkep's single-note result is notable (PRD §4).
 */

/** Interval structure of an angklung akompanimen, in cents above the root. */
export const AKOR_INTERVALS_CENTS = {
  /**
   * Cited (PRD §2): without tengkep a major accompaniment angklung sounds four
   * tubes forming a **dominant seventh** — root, major third, perfect fifth, minor
   * seventh. Hold the seventh tube and three remain: a **major triad**. The
   * player's little finger is a chord-quality switch. This is the project's most
   * distinctive claim and it is fixture-locked; see tests/synth/akor.test.ts.
   */
  mayor: { root: 0, terts: 400, kuint: 700, septim: 1000 },
  /**
   * The minor instrument by the same mechanism: minor seventh chord untengkeped,
   * minor triad tengkeped. Included because the mechanism generalises, not because
   * a source documents this instrument the way the major one is documented.
   */
  minor: { root: 0, terts: 300, kuint: 700, septim: 1000 },
} as const

/**
 * Which degree of the chord a tube is, from the cents it sits at.
 *
 * The lab could show "996 Hz · 1000 cents" and the heading "dominant seventh"
 * and nothing in between, so a reader who did not already know intervals saw
 * four numbers and an assertion. This is the missing step: 400 cents is the
 * major third, 700 the fifth, 1000 the minor seventh — and those four together
 * are what the word "dominant seventh" means.
 *
 * Derived from AKOR_INTERVALS_CENTS above rather than hardcoded, so the naming
 * cannot disagree with the chord that is actually rendered.
 */
export type AkorDegree = 'root' | 'terts' | 'kuint' | 'septim'

export function akorDegreeAt(
  kualitas: AkorKualitas,
  intervalCents: number,
): AkorDegree | null {
  const intervals = AKOR_INTERVALS_CENTS[kualitas]
  const found = (Object.keys(intervals) as AkorDegree[]).find(
    (degree) => intervals[degree] === intervalCents,
  )
  return found ?? null
}

/** The octave tube sounds under the tabung dasar rather than beside it. */
const OKTAF_GAIN = 0.55
const DASAR_GAIN = 1

const AKOR_GAIN = { root: 1, terts: 0.78, kuint: 0.74, septim: 0.68 } as const

/**
 * Angklung melodi: tabung dasar plus a tube one octave above. Tengkep holds the
 * octave tube, leaving a single pure note.
 */
export function angklungMelodi(options: {
  id: string
  nomor: number
  rootHz: number
  label: string
}): AngklungSpec {
  const tabung: readonly Tabung[] = [
    {
      hz: options.rootHz,
      role: 'dasar',
      mutedByTengkep: false,
      gain: DASAR_GAIN,
      intervalCents: 0,
    },
    {
      hz: options.rootHz * 2,
      role: 'oktaf',
      mutedByTengkep: true,
      gain: OKTAF_GAIN,
      intervalCents: 1200,
    },
  ]
  return {
    id: options.id,
    nomor: options.nomor,
    kind: 'melodi',
    label: options.label,
    rootHz: options.rootHz,
    tabung,
  }
}

/**
 * Angklung akompanimen: four tubes sounding a seventh chord. Tengkep holds the
 * seventh tube and the chord becomes a triad.
 */
export function angklungAkompanimen(options: {
  id: string
  nomor: number
  rootHz: number
  label: string
  kualitas: AkorKualitas
}): AngklungSpec {
  const intervals = AKOR_INTERVALS_CENTS[options.kualitas]
  const tabung: readonly Tabung[] = [
    {
      hz: options.rootHz,
      role: 'akor',
      mutedByTengkep: false,
      gain: AKOR_GAIN.root,
      intervalCents: intervals.root,
    },
    {
      hz: options.rootHz * centsToRatio(intervals.terts),
      role: 'akor',
      mutedByTengkep: false,
      gain: AKOR_GAIN.terts,
      intervalCents: intervals.terts,
    },
    {
      hz: options.rootHz * centsToRatio(intervals.kuint),
      role: 'akor',
      mutedByTengkep: false,
      gain: AKOR_GAIN.kuint,
      intervalCents: intervals.kuint,
    },
    {
      // The tube the little finger holds. Removing it turns the seventh into a triad.
      hz: options.rootHz * centsToRatio(intervals.septim),
      role: 'akor',
      mutedByTengkep: true,
      gain: AKOR_GAIN.septim,
      intervalCents: intervals.septim,
    },
  ]
  return {
    id: options.id,
    nomor: options.nomor,
    kind: 'akompanimen',
    label: options.label,
    rootHz: options.rootHz,
    tabung,
  }
}

/** The tubes that actually sound. Under tengkep, held tubes are absent — not quiet. */
export function soundingTabung(angklung: AngklungSpec, tengkep: boolean): readonly Tabung[] {
  return tengkep ? angklung.tabung.filter((t) => !t.mutedByTengkep) : angklung.tabung
}
