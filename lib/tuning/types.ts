/** Laras — the tuning system. Sundanese term kept; see CLAUDE.md convention 16. */
export type Laras = 'padaeng' | 'salendro' | 'pelog-degung'

/** One scale degree. Intervals are always in cents, per the *Cents naming rule. */
export interface Degree {
  readonly name: string
  readonly cents: number
}

/**
 * Where a tuning's numbers come from. Required on every tuning — a laras without
 * a citation does not ship (invariant 8).
 */
export interface TuningSource {
  readonly title: string
  readonly note: string
  /**
   * What is uncertain, and what this project has and has not actually checked.
   * Required: a tuning that cannot say where its numbers stop being verified has
   * no business claiming them (invariant 8).
   */
  readonly caveat: string
  readonly urls?: readonly string[]
}

export interface TuningDefinition {
  readonly id: string
  readonly laras: Laras
  readonly name: string
  readonly shortName: string
  readonly description: string
  readonly descriptionEn: string
  readonly source: TuningSource
  /** Hz of degree 0 at referenceOctave. Everything else is derived from this. */
  readonly referenceDegreeHz: number
  readonly referenceOctave: number
  readonly degrees: readonly Degree[]
}

/**
 * A pitch inside a tuning: which degree, which octave. Not a frequency — the
 * conversion to Hz happens once, at the boundary.
 */
export interface Pitch {
  readonly degreeIndex: number
  readonly octave: number
}
