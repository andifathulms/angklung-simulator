/**
 * Lookahead scheduler against the audio clock.
 *
 * Note onsets are computed as `startAudioTimeSec + eventTimeSec` — an absolute
 * position, never an accumulated one — so nothing drifts however long the piece
 * runs (invariant 6). A timer drives the scheduler's own wakeups and nothing else:
 * it decides *when to look*, never *when a note sounds*.
 *
 * The clock and the timer are injected, so the queue logic is testable in Node
 * without Web Audio.
 */

export interface ScheduledEvent<T = unknown> {
  /** Position in the piece, in seconds from its start. */
  readonly timeSec: number
  readonly payload: T
}

export interface SchedulerClock {
  /** Current audio time, in seconds. In production this is AudioContext.currentTime. */
  now(): number
}

export interface SchedulerTimer {
  start(tickMs: number, tick: () => void): void
  stop(): void
}

export interface SchedulerOptions<T> {
  readonly clock: SchedulerClock
  readonly timer: SchedulerTimer
  /** How far ahead of the clock events are handed to the audio layer. */
  readonly lookaheadSec?: number
  /** How often the scheduler wakes up to look. Must be well under the lookahead. */
  readonly tickMs?: number
  /** Called once per event, with the exact audio time the note must sound at. */
  readonly onEvent: (event: ScheduledEvent<T>, audioTimeSec: number) => void
  readonly onFinished?: () => void
}

export const DEFAULT_LOOKAHEAD_SEC = 0.2
export const DEFAULT_TICK_MS = 25

export interface Scheduler<T> {
  /** `offsetSec` starts the piece part-way in. Audio time zero is set here, once. */
  start(events: readonly ScheduledEvent<T>[], offsetSec?: number): void
  stop(): void
  /** Position in the piece right now, or null when stopped. */
  positionSec(): number | null
  isRunning(): boolean
}

export function createScheduler<T>(options: SchedulerOptions<T>): Scheduler<T> {
  const lookaheadSec = options.lookaheadSec ?? DEFAULT_LOOKAHEAD_SEC
  const tickMs = options.tickMs ?? DEFAULT_TICK_MS

  let queue: readonly ScheduledEvent<T>[] = []
  let nextIndex = 0
  let pieceZeroAudioSec: number | null = null
  let tailSec = 0

  const tick = (): void => {
    if (pieceZeroAudioSec === null) return
    const horizonSec = options.clock.now() + lookaheadSec

    while (nextIndex < queue.length) {
      const event = queue[nextIndex]
      if (event === undefined) break
      // Absolute, recomputed from the piece's zero every time. No accumulation,
      // so no drift.
      const audioTimeSec = pieceZeroAudioSec + event.timeSec
      if (audioTimeSec > horizonSec) break
      nextIndex += 1
      options.onEvent(event, audioTimeSec)
    }

    if (nextIndex >= queue.length && options.clock.now() >= pieceZeroAudioSec + tailSec) {
      stop()
      options.onFinished?.()
    }
  }

  const stop = (): void => {
    options.timer.stop()
    pieceZeroAudioSec = null
    queue = []
    nextIndex = 0
  }

  return {
    start(events, offsetSec = 0) {
      queue = [...events].sort((a, b) => a.timeSec - b.timeSec)
      nextIndex = 0
      tailSec = queue.length === 0 ? 0 : (queue[queue.length - 1]?.timeSec ?? 0)
      // Start a lookahead in the future so the first note is scheduled, not chased.
      pieceZeroAudioSec = options.clock.now() + lookaheadSec - offsetSec
      options.timer.start(tickMs, tick)
      tick()
    },
    stop,
    positionSec() {
      if (pieceZeroAudioSec === null) return null
      return options.clock.now() - pieceZeroAudioSec
    },
    isRunning() {
      return pieceZeroAudioSec !== null
    },
  }
}

/** The production timer. It drives wakeups only — never a note onset. */
export function intervalTimer(): SchedulerTimer {
  let handle: ReturnType<typeof setInterval> | null = null
  return {
    start(tickMs, tick) {
      if (handle !== null) clearInterval(handle)
      handle = setInterval(tick, tickMs)
    },
    stop() {
      if (handle !== null) clearInterval(handle)
      handle = null
    },
  }
}

export function audioClock(context: { currentTime: number }): SchedulerClock {
  return { now: () => context.currentTime }
}
