import { angklungAkompanimen, angklungMelodi } from '@/lib/synth'
import type { RenderParams, Technique } from '@/lib/synth'

export const SAMPLE_RATE_HZ = 48000

/** Fixed seed everywhere — the tests assert determinism, so they must not vary. */
export const SEED = 20250812

export const A4_HZ = 440

export function melodi(rootHz = A4_HZ) {
  return angklungMelodi({ id: `melodi-${rootHz}`, nomor: 20, rootHz, label: 'A4' })
}

export function akompanimenMayor(rootHz = A4_HZ) {
  return angklungAkompanimen({
    id: `akompanimen-mayor-${rootHz}`,
    nomor: 1,
    rootHz,
    label: 'A mayor',
    kualitas: 'mayor',
  })
}

export const kurulung = (durationSec = 1.2, shakeRateHz = 2.5): Technique => ({
  type: 'kurulung',
  shakeRateHz,
  durationSec,
  hardness: 0.45,
  seed: SEED,
})

export const centok = (): Technique => ({ type: 'centok', hardness: 0.85, seed: SEED })

export const tengkep = (durationSec = 1.2, shakeRateHz = 2.5): Technique => ({
  type: 'tengkep',
  shakeRateHz,
  durationSec,
  hardness: 0.45,
  seed: SEED,
})

export function params(
  angklung: RenderParams['angklung'],
  technique: Technique,
  durationSec = 2,
): RenderParams {
  return { angklung, technique, sampleRateHz: SAMPLE_RATE_HZ, durationSec, gain: 0.5 }
}
