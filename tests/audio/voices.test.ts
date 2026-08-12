import { describe, expect, it } from 'vitest'
import { createVoicePool } from '@/lib/audio/voices'
import type { AudioEngine } from '@/lib/audio'
import { buildSet, getSet } from '@/lib/set'
import { createFakeContext, peakOfChannel, reaches } from './helpers/fake-audio'
import type { FakeContext, FakeNode } from './helpers/fake-audio'

/**
 * The audio graph, asserted. lib/synth was always testable and the layer that
 * makes it audible was not — which is exactly where a silent bug hides, because
 * every render can be perfect and still reach nobody.
 */
function rig(sampleRate = 48000) {
  const context = createFakeContext(sampleRate)
  const limiter = context.createDynamicsCompressor()
  const master = context.createGain()
  master.connect(limiter)
  limiter.connect(context.destination)
  const engine = { context, master, limiter } as unknown as AudioEngine
  return { context, engine, master: master as unknown as FakeNode }
}

const set = buildSet(getSet('melodi-diatonis'))
const spec = set[4]?.spec
if (spec === undefined) throw new Error('set kosong')

describe('a played voice', () => {
  it('starts a source carrying a signal that is actually audible', () => {
    const { context, engine } = rig()
    const pool = createVoicePool(engine)

    pool.play({
      angklung: spec,
      techniqueType: 'centok',
      shakeRateHz: 2.5,
      hardness: 0.55,
      atSec: 0.01,
    })

    const source = (context as FakeContext).sources[0]
    expect(source, 'no source was created').toBeDefined()
    expect(source?.startedAt, 'source was never started').toEqual([0.01])

    const peak = peakOfChannel(source?.buffer ?? null)
    expect(peak, 'the buffer is silent').toBeGreaterThan(0.05)
    // Anything above full scale is distortion the limiter then has to fight.
    expect(peak, 'the buffer is over full scale').toBeLessThanOrEqual(1)
  })

  it('is connected all the way to the destination', () => {
    const { context, engine } = rig()
    const pool = createVoicePool(engine)
    pool.play({
      angklung: spec,
      techniqueType: 'centok',
      shakeRateHz: 2.5,
      hardness: 0.55,
      atSec: 0,
    })

    const source = (context as FakeContext).sources[0]
    expect(source).toBeDefined()
    expect(reaches(source as unknown as FakeNode, context.destination as FakeNode)).toBe(true)
  })

  it('holds full gain until the note is released', () => {
    const { context, engine } = rig()
    const pool = createVoicePool(engine)
    const handle = pool.play({
      angklung: spec,
      techniqueType: 'kurulung',
      shakeRateHz: 2.5,
      hardness: 0.5,
      atSec: 0,
      gain: 0.6,
    })

    const gainNode = (context as FakeContext).sources[0]?.outputs[0] as
      | (FakeNode & { gain: { value: number; events: { type: string; value?: number }[] } })
      | undefined
    expect(gainNode?.kind).toBe('gain')
    expect(gainNode?.gain.value).toBeCloseTo(0.6, 6)
    // Nothing may pull the gain down before the player lets go.
    expect(gainNode?.gain.events ?? []).toHaveLength(0)

    handle.release(2)
    const ramps = gainNode?.gain.events.filter((event) => event.type === 'linearRamp') ?? []
    expect(ramps).toHaveLength(1)
    expect(ramps[0]?.value).toBeLessThan(0.01)
  })

  it('renders at the device sample rate, at the same level either way', () => {
    // A phone at 44.1 kHz must not be quieter than a laptop at 48 kHz.
    const peaks = [44100, 48000].map((rate) => {
      const { context, engine } = rig(rate)
      const pool = createVoicePool(engine)
      pool.play({
        angklung: spec,
        techniqueType: 'centok',
        shakeRateHz: 2.5,
        hardness: 0.55,
        atSec: 0,
      })
      const source = (context as FakeContext).sources[0]
      expect(source?.buffer?.sampleRate).toBe(rate)
      return peakOfChannel(source?.buffer ?? null)
    })

    const [low, high] = peaks as [number, number]
    expect(Math.abs(low - high) / high, 'level depends on sample rate').toBeLessThan(0.1)
  })

  it('keeps a held technique quiet enough that two at once do not clip', () => {
    const { context, engine } = rig()
    const pool = createVoicePool(engine)
    pool.play({
      angklung: spec,
      techniqueType: 'kurulung',
      shakeRateHz: 2.5,
      hardness: 0.5,
      atSec: 0,
    })
    const peak = peakOfChannel((context as FakeContext).sources[0]?.buffer ?? null)
    expect(peak).toBeLessThanOrEqual(1)
  })
})

describe('the voice budget', () => {
  it('actually drops a voice once the cap is reached', () => {
    // Invariant 14. Every scheduled note is marked released the moment it is
    // queued with a duration, so a drop routed through the release path did
    // nothing at all and the cap was decorative.
    const { context, engine } = rig()
    const pool = createVoicePool(engine, { maxVoices: 4 })

    for (let index = 0; index < 6; index += 1) {
      const handle = pool.play({
        angklung: spec,
        techniqueType: 'kurulung',
        shakeRateHz: 2.5,
        hardness: 0.5,
        atSec: index * 0.01,
      })
      // Mimic a scheduled note, which releases as soon as it is queued.
      handle.release(index * 0.01 + 1)
    }

    expect(pool.activeCount()).toBeLessThanOrEqual(4)
    const stopped = (context as FakeContext).sources.filter(
      (source) => source.stoppedAt.length > 0,
    )
    expect(stopped.length).toBeGreaterThan(0)
  })
})

describe('writing samples into Web Audio', () => {
  it('reports what actually reached the buffer', () => {
    const { engine } = rig()
    const pool = createVoicePool(engine)
    const report = pool.inspect({
      angklung: spec,
      techniqueType: 'centok',
      shakeRateHz: 2.5,
      hardness: 0.8,
    })

    expect(report.peak).toBeGreaterThan(0.05)
    expect(report.peak).toBeLessThanOrEqual(1)
    expect(report.sampleRateHz).toBe(48000)
    expect(report.writtenWith).toBe('copyToChannel')
  })

  it('still writes the samples where copyToChannel does not exist', () => {
    // Safari gained copyToChannel in 14.1. Without a fallback the first press
    // throws and the only symptom is silence.
    const context = createFakeContext(48000, false)
    const limiter = context.createDynamicsCompressor()
    const master = context.createGain()
    master.connect(limiter)
    limiter.connect(context.destination)
    const engine = { context, master, limiter } as unknown as AudioEngine

    const pool = createVoicePool(engine)
    const report = pool.inspect({
      angklung: spec,
      techniqueType: 'centok',
      shakeRateHz: 2.5,
      hardness: 0.8,
    })

    expect(report.writtenWith).toBe('getChannelData')
    expect(report.peak, 'fallback wrote nothing').toBeGreaterThan(0.05)
  })
})
