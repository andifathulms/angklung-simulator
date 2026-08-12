'use client'

import { useCallback, useMemo, useState } from 'react'
import { useAudio } from '@/components/audio/AudioProvider'
import { deviceReport, measureJitter, measureRenderCost, verdictFor } from '@/lib/audio'
import type { DeviceReport, JitterResult, RenderCost } from '@/lib/audio'
import { buildSet, getSet } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

/** The ensemble sizes worth knowing about, ending above the voice budget. */
const VOICE_STEPS = [8, 16, 24, 32] as const

export function DiagnosticsView({ dict }: { dict: Dictionary }) {
  const { engine, status, play, releaseAll, now } = useAudio()
  const [device, setDevice] = useState<DeviceReport | null>(null)
  const [cost, setCost] = useState<RenderCost | null>(null)
  const [results, setResults] = useState<readonly JitterResult[]>([])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

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
  }, [cost, device, results])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={status !== 'siap' || running}
          onClick={() => void run()}
          className="rounded-full bg-sounding px-5 py-2 text-sm font-medium text-stage transition hover:bg-bamboo disabled:opacity-40"
        >
          {running ? dict.diagnostik.running : dict.diagnostik.run}
        </button>
        {results.length > 0 && !running ? (
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(asText()).then(() => setCopied(true))
            }}
            className="rounded border border-rattan px-3 py-1.5 text-sm text-bamboo/70 hover:text-sounding"
          >
            {copied ? dict.diagnostik.copied : dict.diagnostik.copy}
          </button>
        ) : null}
        <span className="font-mono text-xs text-bamboo/40">{now().toFixed(1)}s</span>
      </div>

      <p className="max-w-3xl text-xs text-bamboo/50">{dict.diagnostik.silentOk}</p>

      {device !== null ? (
        <section className="space-y-2">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
            {dict.diagnostik.device}
          </h2>
          <dl className="grid gap-x-6 gap-y-1 font-mono text-xs text-bamboo/75 sm:grid-cols-2">
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
            <p className="font-mono text-xs text-sounding">
              {dict.diagnostik.renderCost}: {cost.renderMs.toFixed(1)} ms →{' '}
              {cost.durationSec.toFixed(2)}s ({cost.realtimeFactor.toFixed(0)}× realtime)
            </p>
          ) : null}
        </section>
      ) : null}

      {results.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
            {dict.diagnostik.verdict}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-max font-mono text-xs">
              <thead className="text-bamboo/45">
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
                    <tr key={result.voices} className="border-t border-rattan/30">
                      <td className="px-3 py-1 text-bamboo/80">{result.voices}</td>
                      <td className="px-3 py-1 text-right text-bamboo/70">
                        {result.medianLateMs.toFixed(1)} ms
                      </td>
                      <td className="px-3 py-1 text-right text-bamboo/70">
                        {result.worstLateMs.toFixed(1)} ms
                      </td>
                      <td className="px-3 py-1 text-right text-bamboo/70">
                        {result.missedLookahead}/{result.ticks}
                      </td>
                      <td
                        className={[
                          'px-3 py-1',
                          verdict === 'lolos'
                            ? 'text-yourPart'
                            : verdict === 'ketat'
                              ? 'text-bamboo'
                              : 'text-cue',
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
          <p className="max-w-3xl text-xs leading-relaxed text-bamboo/55">
            {dict.diagnostik.explain}
          </p>
        </section>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-rattan/20 py-0.5">
      <dt className="text-bamboo/45">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
