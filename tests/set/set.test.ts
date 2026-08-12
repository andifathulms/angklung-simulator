import { describe, expect, it } from 'vitest'
import { SETS, buildSet, findByPitchId, getSet, relativeTubeLength, setsForLaras } from '@/lib/set'
import { getTuning } from '@/lib/tuning'

describe('angklung sets', () => {
  it('numbers every angklung from the lowest tube upward, 1-based', () => {
    for (const definition of SETS) {
      const built = buildSet(definition)
      built.forEach((angklung, index) => {
        expect(angklung.spec.nomor).toBe(index + 1)
      })
      // Padaeng numbering is the user-facing identity, so it must track pitch order.
      const frequencies = built.map((angklung) => angklung.spec.rootHz)
      const sorted = [...frequencies].sort((a, b) => a - b)
      expect(frequencies).toEqual(sorted)
    }
  })

  it('builds melodi angklung with two tubes and akompanimen with four', () => {
    expect(buildSet(getSet('melodi-diatonis'))[0]?.spec.tabung).toHaveLength(2)
    expect(buildSet(getSet('akompanimen-dasar'))[0]?.spec.tabung).toHaveLength(4)
  })

  it('resolves pentatonic sets inside their own laras', () => {
    const salendro = buildSet(getSet('salendro-pentatonis'))
    expect(salendro).toHaveLength(10)
    expect(salendro.map((a) => a.pitchId)).toContain('ti4')
    expect(setsForLaras('pelog-degung').map((s) => s.id)).toEqual(['pelog-degung-pentatonis'])
  })

  it('refuses a set entry that is not in its laras rather than substituting', () => {
    const broken = { ...getSet('salendro-pentatonis'), entries: [{ degree: 'C#', octave: 4 }] }
    expect(() => buildSet(broken, getTuning('salendro'))).toThrow(/tidak ada dalam laras/)
  })

  it('finds an angklung by pitch id, or returns null', () => {
    const set = buildSet(getSet('melodi-diatonis'))
    expect(findByPitchId(set, 'G4')?.spec.nomor).toBe(5)
    expect(findByPitchId(set, 'G#4')).toBeNull()
  })

  it('graduates tube length by 1/f, so the rack is drawn to the instrument physics', () => {
    const set = buildSet(getSet('melodi-diatonis'))
    const lengths = set.map((angklung) => relativeTubeLength(angklung.spec.rootHz, set))
    expect(lengths[0]).toBeCloseTo(1, 6)
    expect(lengths[lengths.length - 1]).toBeCloseTo(0, 6)
    for (let i = 1; i < lengths.length; i += 1) {
      expect(lengths[i]).toBeLessThan(lengths[i - 1] as number)
    }
  })
})
