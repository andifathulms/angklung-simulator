/**
 * A minimal fake of the Web Audio interfaces the voice pool touches, so the audio
 * graph can be asserted in Node.
 *
 * The synthesis core was always testable; the layer that actually makes it audible
 * was not, and that is exactly where a silent bug can hide — every render can be
 * perfect and still reach nobody's ears.
 */

export interface FakeParam {
  value: number
  readonly events: { type: string; value?: number; time: number }[]
}

function createParam(value: number): FakeParam {
  const events: FakeParam['events'] = []
  return {
    value,
    events,
    setValueAtTime(next: number, time: number) {
      events.push({ type: 'setValueAtTime', value: next, time })
      return this
    },
    linearRampToValueAtTime(next: number, time: number) {
      events.push({ type: 'linearRamp', value: next, time })
      return this
    },
    cancelScheduledValues(time: number) {
      events.push({ type: 'cancel', time })
      return this
    },
  } as FakeParam
}

export interface FakeNode {
  readonly kind: string
  readonly outputs: FakeNode[]
  connect(target: FakeNode): FakeNode
  disconnect(): void
}

function createNode(kind: string, extra: Record<string, unknown> = {}): FakeNode {
  const outputs: FakeNode[] = []
  return {
    kind,
    outputs,
    connect(target: FakeNode) {
      outputs.push(target)
      return target
    },
    disconnect() {
      outputs.length = 0
    },
    ...extra,
  } as FakeNode
}

export interface FakeBuffer {
  readonly length: number
  readonly sampleRate: number
  readonly channel: Float32Array
  copyToChannel?(source: Float32Array, channel: number): void
  getChannelData(channel: number): Float32Array
}

export interface FakeSource extends FakeNode {
  buffer: FakeBuffer | null
  readonly startedAt: number[]
  readonly stoppedAt: number[]
  onended: (() => void) | null
  start(when: number): void
  stop(when: number): void
}

export interface FakeContext {
  currentTime: number
  readonly sampleRate: number
  state: string
  readonly destination: FakeNode
  readonly sources: FakeSource[]
  createBuffer(channels: number, length: number, sampleRate: number): FakeBuffer
  createBufferSource(): FakeSource
  createGain(): FakeNode & { gain: FakeParam }
  createDynamicsCompressor(): FakeNode & Record<string, FakeParam>
  resume(): Promise<void>
  close(): Promise<void>
}

export function createFakeContext(sampleRate = 48000, withCopyToChannel = true): FakeContext {
  const sources: FakeSource[] = []
  const destination = createNode('destination')

  return {
    currentTime: 0,
    sampleRate,
    state: 'running',
    destination,
    sources,
    createBuffer(channels, length, rate) {
      const channel = new Float32Array(length)
      const buffer: FakeBuffer = {
        length,
        sampleRate: rate,
        channel,
        getChannelData: () => channel,
      }
      // Safari before 14.1 has no copyToChannel; `withCopyToChannel` lets a test
      // take it away and prove the fallback still writes the samples.
      if (withCopyToChannel) {
        buffer.copyToChannel = (source) => {
          channel.set(source.subarray(0, channel.length))
        }
      }
      return buffer
    },
    createBufferSource() {
      const source = createNode('source', {
        buffer: null,
        startedAt: [] as number[],
        stoppedAt: [] as number[],
        onended: null,
        start(when: number) {
          ;(this as unknown as FakeSource).startedAt.push(when)
        },
        stop(when: number) {
          ;(this as unknown as FakeSource).stoppedAt.push(when)
        },
      }) as FakeSource
      sources.push(source)
      return source
    },
    createGain() {
      return createNode('gain', { gain: createParam(1) }) as FakeNode & { gain: FakeParam }
    },
    createDynamicsCompressor() {
      return createNode('compressor', {
        threshold: createParam(0),
        knee: createParam(0),
        ratio: createParam(1),
        attack: createParam(0),
        release: createParam(0),
      }) as FakeNode & Record<string, FakeParam>
    },
    async resume() {
      this.state = 'running'
    },
    async close() {
      this.state = 'closed'
    },
  }
}

/** Follow the graph from a node and report whether it reaches the destination. */
export function reaches(from: FakeNode, target: FakeNode, seen = new Set<FakeNode>()): boolean {
  if (from === target) return true
  if (seen.has(from)) return false
  seen.add(from)
  return from.outputs.some((next) => reaches(next, target, seen))
}

export function peakOfChannel(buffer: FakeBuffer | null): number {
  if (buffer === null) return 0
  let peak = 0
  for (const sample of buffer.channel) peak = Math.max(peak, Math.abs(sample))
  return peak
}
