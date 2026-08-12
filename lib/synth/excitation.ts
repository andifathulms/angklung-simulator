import { createPrng } from './prng'
import type { Strike, Technique } from './types'

/**
 * Excitation. A technique is a pattern of strikes; the resonator does not know
 * which technique produced them. Adding a technique means adding a pattern here,
 * never a branch inside resonator.ts (invariant 3).
 */

/**
 * Cited: standard angklung teaching material gives the kurulung shake as roughly
 * 2–3 shakes per second. The default sits in the middle of that range rather than
 * being tuned by feel (invariant 7).
 */
export const KURULUNG_SHAKE_RATE_RANGE_HZ = { minHz: 2, maxHz: 3 } as const
export const KURULUNG_DEFAULT_SHAKE_RATE_HZ = 2.5

/**
 * The tube strikes the frame at each direction change, so a 2–3 Hz shake gives
 * roughly 4–6 strikes per second (PRD §4).
 */
export const STRIKES_PER_SHAKE = 2

/**
 * Fraction of the nominal inter-strike interval that the seeded jitter may move a
 * strike. This irregularity is why kurulung sounds alive rather than like a machine
 * tremolo — but it is small enough that the measured strike rate stays in range.
 */
const KURULUNG_TIMING_JITTER = 0.09
const KURULUNG_STRENGTH_JITTER = 0.14

/** A hard pull into the palm. Centok is the loudest single event the instrument makes. */
const CENTOK_STRENGTH = 1
const KURULUNG_BASE_STRENGTH = 0.62

/**
 * The first strike of a shake carries more of the arm's momentum than the ones
 * that follow, so the train settles rather than starting flat.
 */
const KURULUNG_ATTACK_BOOST = 1.25
const KURULUNG_SETTLE_SEC = 0.35

export function strikesPerSecond(shakeRateHz: number): number {
  return shakeRateHz * STRIKES_PER_SHAKE
}

export function isCitedShakeRate(shakeRateHz: number): boolean {
  return (
    shakeRateHz >= KURULUNG_SHAKE_RATE_RANGE_HZ.minHz &&
    shakeRateHz <= KURULUNG_SHAKE_RATE_RANGE_HZ.maxHz
  )
}

/**
 * Kurulung and tengkep share this train — tengkep is kurulung with a tube held,
 * and the difference lives in which resonators are summed, not here.
 */
function strikeTrain(
  shakeRateHz: number,
  durationSec: number,
  hardness: number,
  seed: number,
): readonly Strike[] {
  const intervalSec = 1 / strikesPerSecond(shakeRateHz)
  const prng = createPrng(seed)
  const strikes: Strike[] = []

  for (let index = 0; ; index += 1) {
    const nominalSec = index * intervalSec
    if (nominalSec >= durationSec) break
    // Jitter is symmetric around the nominal grid, so it perturbs the phase of
    // each strike without dragging the mean rate off the cited value.
    const jitterSec = index === 0 ? 0 : prng.bipolar() * KURULUNG_TIMING_JITTER * intervalSec
    const timeSec = Math.max(0, nominalSec + jitterSec)

    const settle =
      1 + (KURULUNG_ATTACK_BOOST - 1) * Math.exp(-timeSec / KURULUNG_SETTLE_SEC)
    // The forward and return strikes of a shake are not equally hard.
    const direction = index % 2 === 0 ? 1 : 0.88
    const strength =
      KURULUNG_BASE_STRENGTH *
      settle *
      direction *
      (1 + prng.bipolar() * KURULUNG_STRENGTH_JITTER)

    strikes.push({
      timeSec,
      strength: clamp01(strength),
      hardness: clamp01(hardness + prng.bipolar() * 0.05),
    })
  }

  return strikes
}

/**
 * The strike pattern for a technique. Exhaustive over Technique — a fourth
 * technique will fail to compile here first, which is the point.
 */
export function excitationFor(technique: Technique): readonly Strike[] {
  switch (technique.type) {
    case 'kurulung':
      return strikeTrain(
        technique.shakeRateHz,
        technique.durationSec,
        technique.hardness,
        technique.seed,
      )
    case 'tengkep':
      // Same excitation as kurulung. Tengkep changes the resonator sum, not the strike.
      return strikeTrain(
        technique.shakeRateHz,
        technique.durationSec,
        technique.hardness,
        technique.seed,
      )
    case 'centok': {
      // Sounds once. Exactly one strike, harder and louder than a kurulung strike.
      const prng = createPrng(technique.seed)
      return [
        {
          timeSec: 0,
          strength: CENTOK_STRENGTH,
          hardness: clamp01(Math.max(technique.hardness, 0.75) + prng.bipolar() * 0.03),
        },
      ]
    }
    default: {
      const exhaustive: never = technique
      throw new Error(`Teknik tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/** True if this technique holds a tube — the only place tengkep's muting is decided. */
export function mutesTube(technique: Technique): boolean {
  switch (technique.type) {
    case 'tengkep':
      return true
    case 'kurulung':
    case 'centok':
      return false
    default: {
      const exhaustive: never = technique
      throw new Error(`Teknik tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/** How long the technique keeps exciting the instrument. Centok is instantaneous. */
export function excitationDurationSec(technique: Technique): number {
  switch (technique.type) {
    case 'kurulung':
    case 'tengkep':
      return technique.durationSec
    case 'centok':
      return 0
    default: {
      const exhaustive: never = technique
      throw new Error(`Teknik tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}

/**
 * Contact time of the strike, as a fraction of the instrument's period. A smaller
 * angklung is stiffer and its tube leaves the frame sooner, so contact time scales
 * with pitch rather than being a fixed millisecond figure.
 *
 * A shorter pulse has a wider spectrum, so a hard strike is brighter because of the
 * impact, not because of a filter. Half a period is already dull; a twelfth of one
 * is a crack.
 */
const CONTACT_PERIODS_SOFT = 0.5
const CONTACT_PERIODS_HARD = 0.08

export function pulseWidthSec(hardness: number, referenceHz: number): number {
  const periods =
    CONTACT_PERIODS_SOFT + (CONTACT_PERIODS_HARD - CONTACT_PERIODS_SOFT) * clamp01(hardness)
  return periods / referenceHz
}

/**
 * Render a strike list into an excitation signal. This is the only signal the
 * resonator bank ever sees.
 *
 * `referenceHz` is the instrument's root — it sets the time scale of the impact,
 * not its pitch. The excitation contains no periodicity at the note frequency;
 * all pitch comes from the resonators.
 */
export function renderExcitation(
  strikes: readonly Strike[],
  sampleRateHz: number,
  lengthSamples: number,
  referenceHz: number,
): Float32Array {
  const buffer = new Float32Array(lengthSamples)

  for (const strike of strikes) {
    const widthSamples = Math.max(
      2,
      Math.round(pulseWidthSec(strike.hardness, referenceHz) * sampleRateHz),
    )
    const startSample = Math.round(strike.timeSec * sampleRateHz)
    if (startSample >= lengthSamples) continue

    for (let n = 0; n < widthSamples; n += 1) {
      const index = startSample + n
      if (index >= lengthSamples) break
      // Half-cosine window: a smooth impact rather than a digital click.
      const shape = 0.5 * (1 - Math.cos((2 * Math.PI * (n + 0.5)) / widthSamples))
      buffer[index] += strike.strength * shape
    }
  }

  return buffer
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}
