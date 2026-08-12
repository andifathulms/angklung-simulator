/**
 * Types for the synthesis core. Everything here is pure data — no Web Audio,
 * no DOM, no clock. See CLAUDE.md invariant 1.
 */

/**
 * The three basic techniques, as documented in PRD §2. They are three excitation
 * patterns over one resonator, keyed on `type` so an exhaustive switch surfaces
 * every site that must handle a fourth.
 *
 * `tengkep` carries the same shake parameters as `kurulung` because that is what
 * it physically is — kurulung with one tube held. What differs is which
 * resonators are in the sum, not how the instrument is excited.
 */
export type Technique =
  | {
      readonly type: 'kurulung'
      /** Shakes per second. Cited range 2–3 Hz; see KURULUNG_SHAKE_RATE_RANGE_HZ. */
      readonly shakeRateHz: number
      readonly durationSec: number
      /** 0 = soft, 1 = hard. Shortens the strike pulse, so harder is brighter. */
      readonly hardness: number
      readonly seed: number
    }
  | {
      readonly type: 'centok'
      /** Sounds once. There is no duration — the tube is pulled and released. */
      readonly hardness: number
      readonly seed: number
    }
  | {
      readonly type: 'tengkep'
      readonly shakeRateHz: number
      readonly durationSec: number
      readonly hardness: number
      readonly seed: number
    }

export type TechniqueType = Technique['type']

/** One tube striking the frame: an impulse, at a time, with a strength and a hardness. */
export interface Strike {
  readonly timeSec: number
  /** Peak amplitude of the excitation pulse, 0–1. */
  readonly strength: number
  /** 0 = soft, 1 = hard. Controls pulse width, and therefore brightness. */
  readonly hardness: number
}

/** A resonant mode of a tube: a frequency ratio against the tube's fundamental. */
export interface Mode {
  /** Multiple of the tube's fundamental. Bamboo tubes are stopped pipes — odd partials. */
  readonly ratio: number
  readonly amplitude: number
  /** Time for the mode to decay by 60 dB. */
  readonly decayT60Sec: number
}

/**
 * The role a tube plays in the angklung.
 * - `dasar`   — tabung dasar, the base tube the player shakes or pulls.
 * - `oktaf`   — tuned one octave above the tabung dasar.
 * - `akor`    — a chord tube on an angklung akompanimen.
 */
export type TubeRole = 'dasar' | 'oktaf' | 'akor'

export interface Tabung {
  readonly hz: number
  readonly role: TubeRole
  /**
   * True if the little finger (or a stopper) lands on this tube under tengkep.
   * Under tengkep this tube's modes are absent from the sum — not attenuated,
   * not filtered. Invariant 4.
   */
  readonly mutedByTengkep: boolean
  readonly gain: number
  /** Interval above the angklung's root, in cents. Documents the chord structure. */
  readonly intervalCents: number
}

export type AngklungKind = 'melodi' | 'akompanimen'

/** Chord an angklung akompanimen carries. Keyed for exhaustive switching. */
export type AkorKualitas = 'mayor' | 'minor'

export interface AngklungSpec {
  readonly id: string
  /** Padaeng number, as the conductor signals it by hand. The user-facing identity. */
  readonly nomor: number
  readonly kind: AngklungKind
  readonly label: string
  readonly rootHz: number
  readonly tabung: readonly Tabung[]
}

export interface RenderParams {
  readonly angklung: AngklungSpec
  readonly technique: Technique
  readonly sampleRateHz: number
  /** Length of the render. Decay tails are truncated here, not faded. */
  readonly durationSec: number
  readonly gain: number
}
