'use client'

import { TABUNG_MODES } from '@/lib/synth'
import type { Mode } from '@/lib/synth'
import type { Dictionary } from '@/lib/i18n'

/**
 * The modal bank, opened up. PRD §13's mitigation for "the synthesised angklung
 * sounds wrong" is that the model's parameters are exposed in the technique lab,
 * so tuning the timbre by ear is inspectable rather than hidden — and what you
 * tune here is the real renderer, not a preview of one.
 *
 * The output is source code, because the tuning has to end up in resonator.ts to
 * mean anything. A slider that cannot be saved is a toy.
 */
export interface ModeTunerProps {
  readonly modes: readonly Mode[]
  readonly onChange: (modes: readonly Mode[]) => void
  readonly dict: Dictionary
}

/**
 * A tube is a stopped pipe, so its partials are odd and there is nothing at 2f.
 * That absence is what makes the octave tube — and therefore tengkep — measurable,
 * so a ratio near 2 is worth a warning rather than a silent acceptance.
 */
function collidesWithOctave(ratio: number): boolean {
  return Math.abs(ratio - 2) < 0.15
}

export function ModeTuner({ modes, onChange, dict }: ModeTunerProps) {
  const update = (index: number, patch: Partial<Mode>) => {
    onChange(modes.map((mode, candidate) => (candidate === index ? { ...mode, ...patch } : mode)))
  }

  const isStock =
    modes.length === TABUNG_MODES.length &&
    modes.every((mode, index) => {
      const stock = TABUNG_MODES[index]
      return (
        stock !== undefined &&
        stock.ratio === mode.ratio &&
        stock.amplitude === mode.amplitude &&
        stock.decayT60Sec === mode.decayT60Sec
      )
    })

  const source = [
    'export const TABUNG_MODES: readonly Mode[] = [',
    ...modes.map(
      (mode) =>
        `  { ratio: ${mode.ratio}, amplitude: ${round(mode.amplitude)}, decayT60Sec: ${round(mode.decayT60Sec)} },`,
    ),
    ']',
  ].join('\n')

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
          {dict.teknik.modes}
        </h3>
        {!isStock ? (
          <button
            type="button"
            onClick={() => onChange(TABUNG_MODES)}
            className="text-xs text-bamboo/50 underline underline-offset-4 hover:text-sounding"
          >
            {dict.laras.reset}
          </button>
        ) : null}
      </div>

      <p className="max-w-3xl text-xs leading-relaxed text-bamboo/55">{dict.teknik.modesHint}</p>

      <ul className="space-y-3">
        {modes.map((mode, index) => (
          <li
            key={index}
            className="grid gap-3 border-b border-rattan/25 pb-3 sm:grid-cols-[7rem_1fr_1fr]"
          >
            <div className="font-mono text-xs">
              <label className="flex items-center gap-2">
                <span className="text-bamboo/45">×</span>
                <input
                  type="number"
                  step={0.01}
                  min={0.5}
                  value={mode.ratio}
                  onChange={(event) => update(index, { ratio: Number(event.target.value) })}
                  className="w-20 rounded border border-rattan bg-stage px-2 py-1 text-right tabular-nums text-sounding"
                />
              </label>
              {collidesWithOctave(mode.ratio) ? (
                <p className="mt-1 text-[10px] leading-tight text-cue">{dict.teknik.octaveWarning}</p>
              ) : null}
            </div>

            <label className="flex flex-col gap-1 text-[11px] text-bamboo/55">
              <span>
                {dict.teknik.amplitude}{' '}
                <span className="font-mono tabular-nums text-sounding">
                  {round(mode.amplitude)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={mode.amplitude}
                onChange={(event) => update(index, { amplitude: Number(event.target.value) })}
                className="accent-bamboo"
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-bamboo/55">
              <span>
                {dict.teknik.decay}{' '}
                <span className="font-mono tabular-nums text-sounding">
                  {round(mode.decayT60Sec)}s
                </span>
              </span>
              <input
                type="range"
                min={0.02}
                max={2.5}
                step={0.01}
                value={mode.decayT60Sec}
                onChange={(event) => update(index, { decayT60Sec: Number(event.target.value) })}
                className="accent-bamboo"
              />
            </label>
          </li>
        ))}
      </ul>

      {!isStock ? (
        <div className="space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-widest text-bamboo/45">
            {dict.teknik.exportTitle}
          </p>
          <p className="max-w-3xl text-xs text-bamboo/55">{dict.teknik.exportHint}</p>
          <pre className="overflow-x-auto rounded border border-rattan/50 bg-rattan/5 p-3 font-mono text-[11px] leading-relaxed text-sounding">
            {source}
          </pre>
        </div>
      ) : null}
    </section>
  )
}

function round(value: number): number {
  return Number(value.toFixed(3))
}
