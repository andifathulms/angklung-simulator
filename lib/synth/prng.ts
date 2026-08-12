/**
 * Seeded PRNG. Kurulung's strike irregularity comes from here, carried in params —
 * never from Math.random (invariant 10: same params and seed render byte-identically).
 *
 * mulberry32: 32-bit state, uniform on [0, 1).
 */
export interface Prng {
  /** Uniform on [0, 1). */
  next(): number
  /** Uniform on [-1, 1). */
  bipolar(): number
}

export function createPrng(seed: number): Prng {
  let state = seed >>> 0
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    bipolar: () => next() * 2 - 1,
  }
}
