/** Cents ↔ ratio. One octave is 1200 cents by definition. */

export const CENTS_PER_OCTAVE = 1200

export function centsToRatio(cents: number): number {
  return Math.pow(2, cents / CENTS_PER_OCTAVE)
}

export function ratioToCents(ratio: number): number {
  return CENTS_PER_OCTAVE * Math.log2(ratio)
}

/** Signed interval from `fromHz` to `toHz`, in cents. Positive means upward. */
export function centsBetween(fromHz: number, toHz: number): number {
  return ratioToCents(toHz / fromHz)
}

export function transposeHz(hz: number, cents: number): number {
  return hz * centsToRatio(cents)
}
