'use client'

import { useEffect, useMemo, useState } from 'react'
import { Timeline } from '@/components/timeline/Timeline'
import { describeInfeasibility, distribute } from '@/lib/distribute'
import { formatMelodyText, parseMelodyText } from '@/lib/melody/parse'
import { getMelody } from '@/lib/melody'
import type { MelodyNote, TimedNote } from '@/lib/melody'
import { SETS, buildSet, getSet } from '@/lib/set'
import type { Dictionary } from '@/lib/i18n'

const DEFAULT_BPM = 96

export function ArrangementView({ dict }: { dict: Dictionary }) {
  const [setId, setSetId] = useState('melodi-kromatis')
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [text, setText] = useState(() => formatMelodyText(getMelody('bintang-kecil').notes))
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle')

  // An arrangement travels in the URL, since there is no server to keep it on.
  useEffect(() => {
    const hash = window.location.hash.replace(/^#a=/, '')
    if (hash === '' || hash === window.location.hash) return
    try {
      setText(decodeURIComponent(atob(hash)))
    } catch {
      // A malformed link is not worth an error state; the default melody stands.
    }
  }, [])

  const parsed = useMemo(() => parseMelodyText(text), [text])
  const set = useMemo(() => buildSet(getSet(setId)), [setId])

  const notes: TimedNote[] = useMemo(() => {
    const secPerBeat = 60 / DEFAULT_BPM
    return parsed.notes.map((note: MelodyNote, index) => ({
      pitchId: note.pitchId,
      startSec: note.startBeat * secPerBeat,
      durationSec: note.durationBeats * secPerBeat,
      index,
    }))
  }, [parsed.notes])

  const result = useMemo(
    () => distribute({ notes, set, ...(playerCount === null ? {} : { playerCount }) }),
    [notes, playerCount, set],
  )

  const durationSec = notes.reduce(
    (longest, note) => Math.max(longest, note.startSec + note.durationSec),
    0,
  )

  const share = () => {
    const url = `${window.location.origin}${window.location.pathname}#a=${btoa(encodeURIComponent(text))}`
    window.history.replaceState(null, '', url)
    void navigator.clipboard?.writeText(url).then(() => setShareState('copied'))
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className="flex flex-col gap-1 text-step--1 text-ink-muted">
            {dict.aransemen.input}
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              spellCheck={false}
              rows={16}
              className="w-full rounded-lg border border-stage-line bg-stage p-3 font-mono text-step--1 leading-relaxed text-ink transition hover:border-stage-strong focus:border-bamboo"
            />
          </label>
          <p className="text-step--1 text-ink-faint">{dict.aransemen.inputHint}</p>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-step--1 text-ink-muted">
              {dict.rak.setLabel}
              <select
                value={setId}
                onChange={(event) => setSetId(event.target.value)}
                className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
              >
                {SETS.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-step--1 text-ink-muted">
              {dict.ansambel.playersLabel}
              <select
                value={playerCount === null ? 'min' : String(playerCount)}
                onChange={(event) =>
                  setPlayerCount(event.target.value === 'min' ? null : Number(event.target.value))
                }
                className="cursor-pointer rounded-lg border border-stage-line bg-stage px-3 py-2 pr-8 text-step-0 text-ink transition hover:border-stage-strong focus:border-bamboo"
              >
                <option value="min">{dict.ansambel.minimum}</option>
                {Array.from({ length: 24 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={share}
              className="rounded-full border border-stage-strong bg-stage-raised px-3.5 py-2 text-step--1 text-ink transition hover:border-bamboo hover:bg-stage-hover"
            >
              {shareState === 'copied' ? '✓' : '🔗'}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {parsed.problems.length > 0 ? (
            <section className="space-y-1 rounded border border-cue/60 bg-cue/10 p-4 text-step-0">
              <h2 className="font-display text-xl text-cue-light">{dict.aransemen.notFeasible}</h2>
              <ul className="space-y-1 text-ink-muted">
                {parsed.problems.map((problem) => (
                  <li key={problem.line} className="font-mono text-step--1">
                    {problem.line}: {problem.message}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.type === 'infeasible' ? (
            <section className="space-y-2 rounded-lg border border-cue/60 bg-cue/10 p-5">
              <h2 className="font-display text-step-2 text-cue-light">{dict.aransemen.notFeasible}</h2>
              <ul className="space-y-1 text-step-0 text-ink-muted">
                {result.reasons.map((reason, index) => (
                  <li key={index}>{describeInfeasibility(reason, dict.ansambel)}</li>
                ))}
              </ul>
              <p className="pt-2 text-step--1 text-ink-faint">{dict.aransemen.nothingDropped}</p>
            </section>
          ) : (
            <section className="space-y-4">
              <h2 className="font-display text-step-2 text-sounding">{dict.aransemen.feasible}</h2>
              <p className="font-mono text-step-0 text-ink-muted">
                {dict.ansambel.needs} {result.minimumPlayers} {dict.ansambel.player.toLowerCase()} ·{' '}
                {notes.length} {dict.ansambel.notesCount}
              </p>
              <ol className="grid gap-1 sm:grid-cols-2">
                {result.players.map((player) => (
                  <li
                    key={player.playerIndex}
                    className="flex items-baseline justify-between gap-3 rounded border border-stage-line px-3 py-1.5 font-mono text-step--1 text-ink-muted"
                  >
                    <span>
                      {dict.ansambel.player} {player.playerIndex + 1}
                    </span>
                    <span>
                      {player.angklung.length === 0
                        ? dict.ansambel.holdsNothing
                        : player.angklung
                            .map((angklung) => `${angklung.spec.nomor} (${angklung.pitchId})`)
                            .join(' · ')}
                    </span>
                    <span className="text-ink-faint">
                      {player.notes.length} {dict.ansambel.notesCount}
                    </span>
                  </li>
                ))}
              </ol>
              <Timeline
                players={result.players}
                durationSec={durationSec}
                positionSec={null}
                yourPlayerIndex={null}
                dict={dict}
              />
              <p className="text-step--1 text-ink-faint">{dict.aransemen.nothingDropped}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
