'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import {
  deviceReport,
  measureJitter,
  measureRenderCost,
  playReferenceTone,
  verdictFor,
} from '@/lib/audio'
import type { DeviceReport, JitterResult, RenderCost } from '@/lib/audio'
import { Button, Card } from '@/components/ui'
import { buildSet, getSet } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

/** The ensemble sizes worth knowing about, ending above the voice budget. */
const VOICE_STEPS = [8, 16, 24, 32] as const

export function DiagnosticsView({ dict }: { dict: Dictionary }) {
  const { engine, status, play, releaseAll, now, contextState, pool, lastError } = useAudio()
  const [device, setDevice] = useState<DeviceReport | null>(null)
  const [cost, setCost] = useState<RenderCost | null>(null)
  const [results, setResults] = useState<readonly JitterResult[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)
  const [bufferReport, setBufferReport] = useState<string | null>(null)

  const set = useMemo(() => buildSet(getSet('melodi-kromatis')), [])

  const run = useCallback(async () => {
    if (engine === null) return
    setRunning(true)
    setResults([])
    setCopied(false)

    setDevice(deviceReport(engine))
    const first = set[0]
    if (first !== undefined) setCost(measureRenderCost(engine, first.spec))

    const collected: JitterResult[] = []
    for (const voices of VOICE_STEPS) {
      const result = await measureJitter(
        engine,
        (angklung, atSec) =>
          play({ angklung, techniqueType: 'kurulung', atSec, durationSec: 1.6, gain: 0.35 }),
        set.map((entry) => entry.spec),
        { voices },
      )
      collected.push(result)
      setResults([...collected])
      releaseAll()
      // Let the tails ring out before loading the device again.
      await new Promise((resolve) => window.setTimeout(resolve, 700))
    }

    setRunning(false)
  }, [engine, play, releaseAll, set])

  const asText = useCallback(() => {
    const lines = [
      `Angklung Simulator — diagnostik`,
      `status ${status} · contextState ${contextState ?? '—'}`,
      bufferReport ?? '',
      lastError === null ? '' : `ERROR ${lastError}`,
      device === null ? '' : `sampleRate ${device.sampleRateHz} Hz`,
      device?.baseLatencySec === null || device === null
        ? ''
        : `baseLatency ${(device.baseLatencySec * 1000).toFixed(1)} ms`,
      device?.outputLatencySec === null || device === null
        ? ''
        : `outputLatency ${(device.outputLatencySec * 1000).toFixed(1)} ms`,
      device === null ? '' : `cores ${device.hardwareConcurrency ?? '?'}`,
      device === null ? '' : `ua ${device.userAgent}`,
      cost === null
        ? ''
        : `render ${cost.renderMs.toFixed(1)} ms untuk ${cost.durationSec.toFixed(2)}s (${cost.realtimeFactor.toFixed(0)}x realtime)`,
      ...results.map(
        (result) =>
          `${result.voices} suara: tengah ${result.medianLateMs.toFixed(1)} ms, ` +
          `terburuk ${result.worstLateMs.toFixed(1)} ms, ` +
          `lewat lookahead ${result.missedLookahead}/${result.ticks} — ${verdictFor(result)}`,
      ),
    ]
    return lines.filter((line) => line !== '').join('\n')
  }, [bufferReport, contextState, cost, device, lastError, results, status])

  return (
    <div className="space-y-8">
      {/* First thing on the page, because "I hear nothing" is the report that
          needs answering before any measurement is worth taking. */}
      <Card className="space-y-4 border-bamboo/30">
        <div className="space-y-1.5">
          <h2 className="font-display text-step-2 text-sounding">{dict.diagnostik.soundCheck}</h2>
          <p className="max-w-readable text-step--1 leading-relaxed text-ink-muted">
            {dict.diagnostik.soundCheckBody}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            tone="primary"
            disabled={status !== 'siap'}
            onClick={() => {
              if (engine !== null) playReferenceTone(engine)
            }}
          >
            <span aria-hidden="true">♪</span>
            {dict.diagnostik.referenceTone}
          </Button>
          <Button
            disabled={status !== 'siap'}
            onClick={() => {
              const first = set[4] ?? set[0]
              if (first === undefined) return
              play({ angklung: first.spec, techniqueType: 'centok', hardness: 0.8, gain: 1 })

              // Read back what actually landed in the AudioBuffer on this device.
              // A peak of zero here means the render was fine and the copy into
              // Web Audio was not — indistinguishable from any other silence
              // without this number.
              try {
                const report = pool?.inspect({
                  angklung: first.spec,
                  techniqueType: 'centok',
                  shakeRateHz: 2.5,
                  hardness: 0.8,
                })
                setBufferReport(
                  report === undefined
                    ? null
                    : `buffer peak ${report.peak.toFixed(4)} · ${report.lengthSamples} sampel · ` +
                      `${report.sampleRateHz} Hz · ${report.writtenWith}`,
                )
              } catch (error) {
                setBufferReport(`inspect: ${(error as Error).message}`)
              }
            }}
          >
            {dict.diagnostik.oneAngklung}
          </Button>
          {status !== 'siap' ? (
            <span className="text-step--1 text-cue-light">{dict.diagnostik.bothSilent}</span>
          ) : null}
        </div>

        <dl className="grid gap-x-6 gap-y-1 font-mono text-step--1 text-ink-muted sm:grid-cols-2">
          <Row label="status" value={status} />
          <Row label="contextState" value={contextState ?? '—'} />
          <Row label="sampleRate" value={engine === null ? '—' : `${engine.context.sampleRate} Hz`} />
          <Row label="baseLatency" value={engine === null ? '—' : formatLatency(engine)} />
        </dl>

        {bufferReport !== null ? (
          <p className="font-mono text-step--1 text-sounding">{bufferReport}</p>
        ) : null}

        {lastError !== null ? (
          <p className="rounded-lg border border-cue/50 bg-cue/10 p-3 font-mono text-step--1 text-cue-light">
            {lastError}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          tone="primary"
          size="md"
          disabled={status !== 'siap' || running}
          onClick={() => void run()}
        >
          {running ? dict.diagnostik.running : dict.diagnostik.run}
        </Button>
        {results.length > 0 && !running ? (
          <Button
            tone="secondary"
            size="sm"
            onClick={() => {
              void navigator.clipboard?.writeText(asText()).then(() => setCopied(true))
            }}
          >
            {copied ? dict.diagnostik.copied : dict.diagnostik.copy}
          </Button>
        ) : null}
        <span className="font-mono text-step--1 text-ink-faint">{now().toFixed(1)}s</span>
      </div>

      <p className="max-w-3xl text-step--1 text-ink-faint">{dict.diagnostik.silentOk}</p>

      {device !== null ? (
        <section className="space-y-2">
          <h2 className="font-mono text-step--2 uppercase tracking-widest text-ink-faint">
            {dict.diagnostik.device}
          </h2>
          <dl className="grid gap-x-6 gap-y-1 font-mono text-step--1 text-ink-muted sm:grid-cols-2">
            <Row label="sampleRate" value={`${device.sampleRateHz} Hz`} />
            <Row
              label="baseLatency"
              value={
                device.baseLatencySec === null
                  ? '—'
                  : `${(device.baseLatencySec * 1000).toFixed(1)} ms`
              }
            />
            <Row
              label="outputLatency"
              value={
                device.outputLatencySec === null
                  ? '—'
                  : `${(device.outputLatencySec * 1000).toFixed(1)} ms`
              }
            />
            <Row label="cores" value={String(device.hardwareConcurrency ?? '—')} />
          </dl>
          {cost !== null ? (
            <p className="font-mono text-step--1 text-sounding">
              {dict.diagnostik.renderCost}: {cost.renderMs.toFixed(1)} ms →{' '}
              {cost.durationSec.toFixed(2)}s ({cost.realtimeFactor.toFixed(0)}× realtime)
            </p>
          ) : null}
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-mono text-step--2 uppercase tracking-widest text-ink-faint">
            {dict.diagnostik.verdict}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-max font-mono text-step--1">
              <thead className="text-ink-faint">
                <tr>
                  <th className="px-3 py-1 text-left">{dict.diagnostik.voices}</th>
                  <th className="px-3 py-1 text-right">{dict.diagnostik.medianLate}</th>
                  <th className="px-3 py-1 text-right">{dict.diagnostik.worstLate}</th>
                  <th className="px-3 py-1 text-right">{dict.diagnostik.missed}</th>
                  <th className="px-3 py-1 text-left">{dict.diagnostik.verdict}</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result) => {
                  const verdict = verdictFor(result)
                  return (
                    <tr key={result.voices} className="border-t border-stage-line">
                      <td className="px-3 py-1 text-ink-muted">{result.voices}</td>
                      <td className="px-3 py-1 text-right text-ink-muted">
                        {result.medianLateMs.toFixed(1)} ms
                      </td>
                      <td className="px-3 py-1 text-right text-ink-muted">
                        {result.worstLateMs.toFixed(1)} ms
                      </td>
                      <td className="px-3 py-1 text-right text-ink-muted">
                        {result.missedLookahead}/{result.ticks}
                      </td>
                      <td
                        className={[
                          'px-3 py-1',
                          verdict === 'lolos'
                            ? 'text-yourPart-light'
                            : verdict === 'ketat'
                              ? 'text-bamboo'
                              : 'text-cue-light',
                        ].join(' ')}
                      >
                        {verdict}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="max-w-3xl text-step--1 leading-relaxed text-ink-faint">
            {dict.diagnostik.explain}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function formatLatency(engine: { context: AudioContext }): string {
  const base = engine.context.baseLatency
  return typeof base === 'number' ? `${(base * 1000).toFixed(1)} ms` : '—'
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-stage-line/60 py-0.5">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
