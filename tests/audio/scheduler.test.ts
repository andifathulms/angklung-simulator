import { describe, expect, it } from 'vitest'
import { createScheduler } from '@/lib/audio/scheduler'
import type { SchedulerClock, SchedulerTimer, ScheduledEvent } from '@/lib/audio/scheduler'
import { getMelody, toTimedNotes } from '@/lib/melody'

/**
 * The scheduler is tested with a fake clock and a fake timer, so the queue logic
 * runs in Node. What is asserted is that onsets land on target and do not drift
 * across a long piece — the one bug that would destroy an ensemble simulator.
 */
function fakeRig() {
  let nowSec = 0
  let tick: (() => void) | null = null

  const clock: SchedulerClock = { now: () => nowSec }
  const timer: SchedulerTimer = {
    start: (_tickMs, callback) => {
      tick = callback
    },
    stop: () => {
      tick = null
    },
  }

  /** Advance the audio clock in realistic wakeup-sized steps. */
  const advance = (bySec: number, stepSec = 0.025): void => {
    const steps = Math.round(bySec / stepSec)
    for (let i = 0; i < steps; i += 1) {
      nowSec = Number((nowSec + stepSec).toFixed(9))
      tick?.()
    }
  }

  return { clock, timer, advance, nowSec: () => nowSec }
}

describe('lookahead scheduling', () => {
  it('places every onset exactly on target', () => {
    const rig = fakeRig()
    const fired: { timeSec: number; audioTimeSec: number }[] = []
    const events: ScheduledEvent<number>[] = Array.from({ length: 40 }, (_, index) => ({
      timeSec: index * 0.5,
      payload: index,
    }))

    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: (event, audioTimeSec) => fired.push({ timeSec: event.timeSec, audioTimeSec }),
    })

    scheduler.start(events)
    const zero = 0 + 0.2 // clock at start, plus the lookahead
    rig.advance(25)

    expect(fired).toHaveLength(events.length)
    for (const entry of fired) {
      // Exact, not approximate: the audio time is recomputed from the piece zero.
      expect(entry.audioTimeSec).toBeCloseTo(zero + entry.timeSec, 9)
    }
  })

  it('does not drift across a long piece', () => {
    const rig = fakeRig()
    const fired: number[] = []
    // Twenty minutes at four events a second — long enough that any accumulated
    // error would be visible, and any setTimeout-based scheduler would be audibly wrong.
    const events: ScheduledEvent<number>[] = Array.from({ length: 4800 }, (_, index) => ({
      timeSec: index * 0.25,
      payload: index,
    }))

    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: (_event, audioTimeSec) => fired.push(audioTimeSec),
    })

    scheduler.start(events)
    rig.advance(1205, 0.05)

    expect(fired).toHaveLength(events.length)
    const last = fired[fired.length - 1] as number
    const first = fired[0] as number
    expect(last - first).toBeCloseTo(4799 * 0.25, 9)

    // Worst single-event error across the whole piece.
    const worstError = Math.max(
      ...fired.map((audioTimeSec, index) => Math.abs(audioTimeSec - (0.2 + index * 0.25))),
    )
    expect(worstError).toBeLessThan(1e-6)
  })

  it('schedules ahead of the clock, never behind it', () => {
    const rig = fakeRig()
    const late: number[] = []

    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      lookaheadSec: 0.2,
      onEvent: (_event, audioTimeSec) => {
        if (audioTimeSec < rig.nowSec()) late.push(audioTimeSec)
      },
    })

    scheduler.start(
      Array.from({ length: 200 }, (_, index) => ({ timeSec: index * 0.13, payload: index })),
    )
    rig.advance(30)

    expect(late).toEqual([])
  })

  it('starts part-way through a piece without shifting the grid', () => {
    const rig = fakeRig()
    const fired: { payload: number; audioTimeSec: number }[] = []

    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: (event, audioTimeSec) => fired.push({ payload: event.payload, audioTimeSec }),
    })

    scheduler.start(
      Array.from({ length: 10 }, (_, index) => ({ timeSec: index, payload: index })),
      4,
    )
    rig.advance(10)

    // Everything before the offset is already in the past, so it fires immediately;
    // everything after keeps its spacing exactly.
    const fifth = fired.find((entry) => entry.payload === 5)
    const sixth = fired.find((entry) => entry.payload === 6)
    expect((sixth?.audioTimeSec ?? 0) - (fifth?.audioTimeSec ?? 0)).toBeCloseTo(1, 9)
  })

  it('reports its position from the audio clock', () => {
    const rig = fakeRig()
    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: () => undefined,
    })

    expect(scheduler.positionSec()).toBeNull()
    scheduler.start([{ timeSec: 5, payload: 0 }])
    rig.advance(1)
    expect(scheduler.positionSec()).toBeCloseTo(0.8, 6)
    expect(scheduler.isRunning()).toBe(true)
  })

  it('finishes once the last note has been handed over', () => {
    const rig = fakeRig()
    let finished = false
    const scheduler = createScheduler<number>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: () => undefined,
      onFinished: () => {
        finished = true
      },
    })

    scheduler.start([{ timeSec: 0, payload: 0 }, { timeSec: 1, payload: 1 }])
    rig.advance(2)
    expect(finished).toBe(true)
    expect(scheduler.isRunning()).toBe(false)
  })

  it('carries a real melody without losing a note', () => {
    const rig = fakeRig()
    const melody = getMelody('bintang-kecil')
    const notes = toTimedNotes(melody)
    const fired: number[] = []

    const scheduler = createScheduler<string>({
      clock: rig.clock,
      timer: rig.timer,
      onEvent: (_event, audioTimeSec) => fired.push(audioTimeSec),
    })

    scheduler.start(notes.map((note) => ({ timeSec: note.startSec, payload: note.pitchId })))
    rig.advance(60)

    expect(fired).toHaveLength(notes.length)
    fired.forEach((audioTimeSec, index) => {
      expect(audioTimeSec).toBeCloseTo(0.2 + (notes[index]?.startSec ?? 0), 9)
    })
  })
})
