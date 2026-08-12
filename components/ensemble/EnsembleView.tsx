'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Rack } from '@/components/rack/Rack'
import { CueLane } from '@/components/timeline/CueLane'
import { Timeline } from '@/components/timeline/Timeline'
import { useAudio } from '@/components/audio/AudioProvider'
import { Button, Card, Field, SegmentedControl, Select, Stat } from '@/components/ui'
import { audioClock, createScheduler, intervalTimer } from '@/lib/audio'
import type { Scheduler } from '@/lib/audio'
import {
  combineEnsemble,
  describeInfeasibility,
  distribute,
  reportAbsence,
} from '@/lib/distribute'
import type { MinimumDriver, NoteAssignment } from '@/lib/distribute'
import { MELODIES, getMelody, melodyDurationSec, toTimedChords, toTimedNotes } from '@/lib/melody'
import { buildSet, getSet } from '@/lib/set'
import { fill } from '@/lib/i18n'
import type { Dictionary } from '@/lib/i18n'

type Mode = 'dengar' | 'bagian-anda' | 'semua-bagian'

const MODES: readonly Mode[] = ['dengar', 'bagian-anda', 'semua-bagian']

/** How far ahead a cue lights, in beats. A conductor signals a number one beat early. */
const CUE_LEAD_BEATS = 1
const COUNT_IN_CHOICES = [0, 2, 4] as const

/**
 * One or two. Two is the default because a person has two hands, and three is not
 * offered because three is not a thing a person has — a dial that went higher
 * would be the app making a claim about bodies that it cannot support.
 */
const PER_PLAYER_CHOICES = [2, 1] as const

/** The derivation of the minimum, put into words. Data comes from the solver. */
function describeDriver(driver: MinimumDriver, dict: Dictionary): readonly string[] {
  switch (driver.type) {
    case 'tumpang-tindih': {
      const sentence = fill(dict.ansambel.driverOverlap, {
        atSec: driver.peak.atSec.toFixed(1),
        count: driver.peak.count,
      })
      return driver.peak.tied ? [sentence, dict.ansambel.driverOverlapTied] : [sentence]
    }
    case 'jumlah-nada':
      return [
        fill(dict.ansambel.driverNoteCount, {
          distinct: driver.distinctPitches,
          perPlayer: driver.maxAngklungPerPlayer,
        }),
      ]
    case 'penempatan':
      return [fill(dict.ansambel.driverPacking, { distinct: driver.distinctPitches })]
    default: {
      const exhaustive: never = driver
      throw new Error(`Penyebab tidak dikenal: ${JSON.stringify(exhaustive)}`)
    }
  }
}

export function EnsembleView({ dict }: { dict: Dictionary }) {
  const { play, releaseAll, engine, status } = useAudio()
  const [melodyId, setMelodyId] = useState('bintang-kecil')
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [mode, setMode] = useState<Mode>('dengar')
  const [yourPlayerIndex, setYourPlayerIndex] = useState(0)
  const [positionSec, setPositionSec] = useState<number | null>(null)
  const [bpm, setBpm] = useState<number | null>(null)
  const [countInBeats, setCountInBeats] = useState<number>(4)
  const [angklungPerPlayer, setAngklungPerPlayer] = useState<number>(2)
  const [showWhy, setShowWhy] = useState(false)
  const [absentPlayers, setAbsentPlayers] = useState<readonly number[]>([])
  const [withAkompanimen, setWithAkompanimen] = useState(false)

  const schedulerRef = useRef<Scheduler<NoteAssignment | null> | null>(null)
  const frameRef = useRef<number | null>(null)

  const melody = useMemo(() => getMelody(melodyId), [melodyId])
  const set = useMemo(() => buildSet(getSet(melody.setId)), [melody.setId])
  const tempo = bpm ?? melody.bpm
  const beatSec = 60 / tempo
  const countInSec = countInBeats * beatSec
  const notes = useMemo(() => toTimedNotes(melody, tempo), [melody, tempo])
  const durationSec = useMemo(() => melodyDurationSec(melody, tempo), [melody, tempo])

  const result = useMemo(
    () =>
      distribute({
        notes,
        set,
        maxAngklungPerPlayer: angklungPerPlayer,
        ...(playerCount === null ? {} : { playerCount }),
      }),
    [notes, set, playerCount, angklungPerPlayer],
  )

  const minimumPlayers = result.type === 'feasible' ? result.minimumPlayers : null

  /*
   * The accompaniment is solved by the same call as the melody, because it is the
   * same problem: one instrument sounding one thing, one pair of hands that has
   * to be free. Only the set and the track differ.
   */
  const hasAkompanimen = melody.akompanimen !== undefined
  const chordSet = useMemo(
    () =>
      melody.akompanimen === undefined ? null : buildSet(getSet(melody.akompanimen.setId)),
    [melody.akompanimen],
  )
  const chordResult = useMemo(() => {
    if (chordSet === null || !withAkompanimen) return null
    return distribute({
      notes: toTimedChords(melody, tempo, notes.length),
      set: chordSet,
      maxAngklungPerPlayer: angklungPerPlayer,
    })
  }, [chordSet, withAkompanimen, melody, tempo, notes.length, angklungPerPlayer])

  const ensemble = useMemo(
    () => combineEnsemble(result, chordResult),
    [result, chordResult],
  )

  const absence = useMemo(
    () => reportAbsence(ensemble ?? result, absentPlayers),
    [ensemble, result, absentPlayers],
  )

  const yourPart =
    ensemble?.players.find((player) => player.playerIndex === yourPlayerIndex) ?? null

  const stop = useCallback(() => {
    schedulerRef.current?.stop()
    schedulerRef.current = null
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    setPositionSec(null)
    releaseAll()
  }, [releaseAll])

  useEffect(() => stop, [stop])
  // Changing what is being played stops what is playing. Nothing continues under
  // a distribution it no longer matches.
  useEffect(() => {
    stop()
  }, [
    melodyId,
    playerCount,
    mode,
    tempo,
    countInBeats,
    angklungPerPlayer,
    absentPlayers,
    withAkompanimen,
    stop,
  ])

  // A distribution the roster no longer matches would leave people marked absent
  // who do not exist in it, and "you" pointing at a chair that is gone.
  useEffect(() => {
    setAbsentPlayers([])
    setYourPlayerIndex(0)
  }, [melodyId, playerCount, angklungPerPlayer, withAkompanimen])

  useEffect(() => {
    if (!hasAkompanimen) setWithAkompanimen(false)
  }, [hasAkompanimen])

  const start = useCallback(() => {
    if (engine === null || ensemble === null) return
    stop()

    const scheduler = createScheduler<NoteAssignment | null>({
      clock: audioClock(engine.context),
      timer: intervalTimer(),
      onEvent: (event, audioTimeSec) => {
        const assignment = event.payload
        if (assignment === null) {
          // Count-in. A centok on the lowest angklung in the set, quiet — the
          // conductor's beat, made of the same instrument as everything else.
          const lowest = set[0]
          if (lowest !== undefined) {
            play({
              angklung: lowest.spec,
              techniqueType: 'centok',
              atSec: audioTimeSec,
              hardness: 0.9,
              gain: 0.22,
            })
          }
          return
        }
        if (mode === 'semua-bagian') return
        if (mode === 'bagian-anda' && assignment.playerIndex === yourPlayerIndex) return
        // Nobody is holding this angklung. The note stays in the distribution and
        // in the report; it simply has no hands.
        if (absentPlayers.includes(assignment.playerIndex)) return
        // An angklung akompanimen is four tubes against a melody angklung's two,
        // so at equal gain it buries the tune. Accompaniment sits under.
        const isAkompanimen = assignment.playerIndex >= ensemble.melodyPlayers
        play({
          angklung: assignment.angklung.spec,
          techniqueType: 'kurulung',
          atSec: audioTimeSec,
          durationSec: assignment.note.durationSec,
          gain: isAkompanimen ? 0.3 : 0.55,
        })
      },
      onFinished: () => {
        schedulerRef.current = null
        setPositionSec(null)
      },
    })

    schedulerRef.current = scheduler
    scheduler.start([
      ...Array.from({ length: countInBeats }, (_, beat) => ({
        timeSec: beat * beatSec,
        payload: null,
      })),
      ...ensemble.assignments.map((assignment) => ({
        timeSec: countInSec + assignment.note.startSec,
        payload: assignment,
      })),
    ])

    // The playhead reads the audio clock too, so what you see is what you hear.
    const followPlayhead = () => {
      const current = schedulerRef.current
      if (current === null) return
      setPositionSec(current.positionSec())
      frameRef.current = requestAnimationFrame(followPlayhead)
    }
    frameRef.current = requestAnimationFrame(followPlayhead)
  }, [
    absentPlayers,
    beatSec,
    countInBeats,
    countInSec,
    engine,
    ensemble,
    mode,
    play,
    set,
    stop,
    yourPlayerIndex,
  ])

  /** What the conductor is about to signal, from the audio clock's position. */
  const upcoming = useMemo(() => {
    if (ensemble === null || positionSec === null) return []
    const relevant =
      mode === 'bagian-anda'
        ? ensemble.assignments.filter(
            (assignment) => assignment.playerIndex === yourPlayerIndex,
          )
        : ensemble.assignments
    return relevant
      .map((assignment) => ({
        assignment,
        inSec: countInSec + assignment.note.startSec - positionSec,
      }))
      .filter((entry) => entry.inSec >= -0.05 && entry.inSec < beatSec * 6)
      .slice(0, 6)
  }, [beatSec, countInSec, ensemble, mode, positionSec, yourPlayerIndex])

  const cuedNumber =
    upcoming.find((entry) => entry.inSec <= beatSec * CUE_LEAD_BEATS)?.assignment.angklung.spec
      .nomor ?? null

  const isPlaying = positionSec !== null

  return (
    <div className="space-y-8">
      {/*
        * Eight controls used to sit in one flex-wrap row in insertion order, at
        * equal weight, and on a phone they stacked into an eight-item column
        * with the play button at the bottom of it. They are not eight peers.
        * Three describe the piece, three describe the room it needs, and two
        * are transport — so they are grouped that way and the play button gets
        * its own row where the column is narrow.
        */}
      <Card className="space-y-6">
        {/* What is being played. */}
        <div className="flex flex-wrap items-end gap-x-7 gap-y-5">
          <p className="eyebrow w-full">{dict.ansambel.groupPiece}</p>

          <Field label={dict.ansambel.melodyLabel}>
            <Select value={melodyId} onChange={(event) => setMelodyId(event.target.value)}>
              {MELODIES.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.title}
                </option>
              ))}
            </Select>
          </Field>

          {/*
            * The second population. Off by default so the headline number stays
            * the one the home page demonstrated — and so that turning it on, and
            * watching the room grow, is something the visitor does rather than
            * something they arrive to.
            */}
          <SegmentedControl<'tanpa' | 'dengan'>
            label={dict.ansambel.withAkompanimen}
            value={withAkompanimen ? 'dengan' : 'tanpa'}
            onChange={(next) => setWithAkompanimen(next === 'dengan')}
            disabled={!hasAkompanimen}
            options={[
              { value: 'tanpa', label: dict.ansambel.akompanimenOff },
              { value: 'dengan', label: dict.ansambel.akompanimenOn },
            ]}
          />
        </div>

        <div className="rule-fade" aria-hidden="true" />

        {/* Who is in the room, and what you are doing in it. */}
        <div className="flex flex-wrap items-end gap-x-7 gap-y-5">
          <p className="eyebrow w-full">{dict.ansambel.groupRoom}</p>

          <Field label={dict.ansambel.playersLabel}>
            <Select
              value={playerCount === null ? 'min' : String(playerCount)}
              onChange={(event) =>
                setPlayerCount(event.target.value === 'min' ? null : Number(event.target.value))
              }
            >
              <option value="min">{dict.ansambel.minimum}</option>
              {Array.from({ length: 16 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </Select>
          </Field>

          {/*
            * The two-hands assumption, which was a constant in the solver and
            * invisible here. It does the most argumentative work of anything on
            * the page: one angklung each is how most school ensembles actually
            * run, and it changes the number of people a song needs.
            */}
          <SegmentedControl<'2' | '1'>
            label={dict.ansambel.perPlayerLabel}
            value={String(angklungPerPlayer) === '1' ? '1' : '2'}
            onChange={(next) => setAngklungPerPlayer(Number(next))}
            options={PER_PLAYER_CHOICES.map((count) => ({
              value: String(count) as '2' | '1',
              label: count === 1 ? dict.ansambel.perPlayerOne : dict.ansambel.perPlayerTwo,
            }))}
          />

          <SegmentedControl<Mode>
            label={dict.ansambel.mode}
            value={mode}
            onChange={setMode}
            options={MODES.map((candidate) => ({
              value: candidate,
              label:
                candidate === 'dengar'
                  ? dict.ansambel.listen
                  : candidate === 'bagian-anda'
                    ? dict.ansambel.yourPart
                    : dict.ansambel.everyPart,
            }))}
          />
        </div>

        <div className="rule-fade" aria-hidden="true" />

        {/* Transport. The play button ends the card wherever the row breaks. */}
        <div className="flex flex-wrap items-end gap-x-7 gap-y-5">
          <p className="eyebrow w-full">{dict.ansambel.groupTransport}</p>

          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="eyebrow">{dict.ansambel.tempo}</span>
            <span className="flex items-center gap-2">
              <input
                type="range"
                min={40}
                max={180}
                step={1}
                value={tempo}
                onChange={(event) => setBpm(Number(event.target.value))}
                className="w-32 accent-bamboo"
              />
              <span className="font-mono text-step-0 tabular-nums text-sounding">{tempo}</span>
            </span>
          </label>

          <Field label={dict.ansambel.countIn}>
            <Select
              value={countInBeats}
              onChange={(event) => setCountInBeats(Number(event.target.value))}
            >
              {COUNT_IN_CHOICES.map((beats) => (
                <option key={beats} value={beats}>
                  {beats}
                </option>
              ))}
            </Select>
          </Field>

          <Button
            tone="primary"
            size="md"
            className="w-full sm:ml-auto sm:w-auto"
            disabled={status !== 'siap' || ensemble === null}
            onClick={() => (isPlaying ? stop() : start())}
          >
            <span aria-hidden="true">{isPlaying ? '■' : '▶'}</span>
            {isPlaying ? dict.ansambel.stop : dict.ansambel.play}
          </Button>
        </div>
      </Card>

      <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
        {mode === 'dengar'
          ? dict.ansambel.listenHint
          : mode === 'bagian-anda'
            ? dict.ansambel.yourPartHint
            : dict.ansambel.everyPartHint}
      </p>

      {result.type === 'infeasible' ? (
        <section className="space-y-2 rounded-lg border border-cue/60 bg-cue/10 p-5">
          <h2 className="font-display text-step-2 text-cue-light">{dict.ansambel.infeasible}</h2>
          <ul className="space-y-1 text-step-0 text-ink-muted">
            {result.reasons.map((reason, index) => (
              <li key={index}>{describeInfeasibility(reason, dict.ansambel)}</li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <div className="space-y-4 rounded-card border border-stage-line bg-stage-raised/60 px-6 py-5">
            <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
              <Stat
                value={String(minimumPlayers ?? '—')}
                label={`${dict.ansambel.needs} ${dict.ansambel.player.toLowerCase()}`}
                tone="sounding"
                size="lead"
              />
              <Stat
                value={String(ensemble?.totalPlayers ?? 0)}
                label={dict.ansambel.playersLabel}
              />
              <Stat value={String(melody.notes.length)} label={dict.ansambel.notesCount} />
              <Stat value={`${Math.round(durationSec)}s`} label={melody.title} />

              {/* The headline number is the one figure a visitor cannot check.
                  This is where it stops being an assertion. */}
              <button
                type="button"
                onClick={() => setShowWhy((current) => !current)}
                aria-expanded={showWhy}
                className="ml-auto rounded-full border border-stage-strong px-3.5 py-1.5 text-step--1 text-ink-muted transition duration-200 ease-physical hover:border-bamboo hover:text-ink"
              >
                {showWhy ? dict.ansambel.hideWhy : dict.ansambel.whyThisNumber}
              </button>
            </div>

            {showWhy ? (
              <div className="rise-in space-y-2 border-t border-stage-line pt-4">
                {describeDriver(result.minimumDriver, dict).map((sentence) => (
                  <p key={sentence} className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
                    {sentence}
                  </p>
                ))}
                <p className="text-step--1 text-ink-faint">{dict.ansambel.perPlayerHint}</p>
              </div>
            ) : null}
          </div>

          {/*
            * What the second population costs and what it teaches. The chord
            * angklung has been a solo exhibit in the technique lab; here it is
            * a person standing in a room with a different job from everyone
            * else's, and the timeline shows the difference better than prose.
            */}
          {withAkompanimen && ensemble !== null && ensemble.akompanimenPlayers > 0 ? (
            <section className="rise-in space-y-2 rounded-card border border-bamboo/30 bg-bamboo/[0.05] p-5 sm:p-6">
              <p className="text-step-0 leading-relaxed text-ink">
                {fill(dict.ansambel.akompanimenAdds, {
                  added: ensemble.akompanimenPlayers,
                  total: ensemble.totalPlayers,
                })}
              </p>
              <p className="max-w-readable text-step-0 leading-relaxed text-ink-muted">
                {dict.ansambel.akompanimenBody}
              </p>
              <p className="max-w-readable text-step--1 leading-relaxed text-ink-faint">
                {melody.akompanimen?.source.caveat}
              </p>
            </section>
          ) : null}

          {!hasAkompanimen ? (
            <p className="text-step--1 text-ink-faint">{dict.ansambel.akompanimenNone}</p>
          ) : null}

          {/*
            * The cost of an empty chair, itemised. Invariant 9 says the solver
            * never silently drops a note; a player taken out of the room is not
            * the solver dropping anything, but the notes still have to be
            * accounted for or the feature becomes exactly what the invariant
            * forbids. So they are counted and named here.
            */}
          {absence.silenced.length > 0 ? (
            <section className="rise-in space-y-3 rounded-card border border-stage-strong bg-stage-raised/40 p-5 sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-step-2 text-ink">{dict.ansambel.absenceTitle}</h2>
                <button
                  type="button"
                  onClick={() => setAbsentPlayers([])}
                  className="text-step--1 text-bamboo transition hover:text-sounding"
                >
                  {dict.ansambel.restoreAll}
                </button>
              </div>
              <p className="max-w-prose text-step-0 leading-relaxed text-ink-muted">
                {fill(dict.ansambel.absenceBody, {
                  players: absence.absentPlayers
                    .map((index) => `${dict.ansambel.player} ${index + 1}`)
                    .join(', '),
                  silenced: absence.silenced.length,
                  total: absence.totalNotes,
                })}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {absence.silenced.map((assignment) => (
                  <li
                    key={assignment.note.index}
                    className="rounded border border-dashed border-stage-strong px-2 py-0.5 font-mono text-step--2 text-ink-faint"
                  >
                    {assignment.angklung.spec.nomor} · {assignment.note.startSec.toFixed(1)}s
                  </li>
                ))}
              </ul>
              <p className="max-w-prose text-step--1 leading-relaxed text-ink-faint">
                {dict.ansambel.absenceHint}
              </p>
            </section>
          ) : null}

          <CueLane upcoming={upcoming} beatSec={beatSec} dict={dict} />

          <section className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)]">
            <ol className="space-y-1">
              {(ensemble?.players ?? []).map((player) => {
                const isYours = player.playerIndex === yourPlayerIndex
                const isAbsent = absentPlayers.includes(player.playerIndex)
                const restShare =
                  1 -
                  player.notes.reduce((total, note) => total + note.durationSec, 0) /
                    Math.max(durationSec, 0.001)
                return (
                  <li
                    key={player.playerIndex}
                    className={[
                      'flex items-stretch gap-1 rounded-lg border transition duration-200 ease-physical',
                      isAbsent
                        ? 'border-dashed border-stage-strong bg-transparent'
                        : isYours
                          ? 'border-yourPart bg-yourPart/10'
                          : 'border-stage-line bg-stage-raised/50 hover:border-bamboo/60 hover:bg-stage-hover',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      onClick={() => setYourPlayerIndex(player.playerIndex)}
                      aria-pressed={isYours}
                      className={[
                        'flex min-w-0 flex-1 items-baseline justify-between gap-3 rounded-l-lg px-3.5 py-2.5 text-left text-step-0',
                        isAbsent
                          ? 'text-ink-faint line-through decoration-1'
                          : isYours
                            ? 'text-yourPart-light'
                            : 'text-ink-muted',
                      ].join(' ')}
                    >
                      <span className="flex min-w-0 items-baseline gap-2 font-mono">
                        {dict.ansambel.player} {player.playerIndex + 1}
                        {player.role === 'akompanimen' ? (
                          <span className="shrink-0 rounded-full border border-stage-strong px-1.5 text-step--2 uppercase tracking-wider text-ink-faint">
                            {dict.ansambel.roleAkompanimen}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-step--1">
                        {player.angklung.length === 0
                          ? dict.ansambel.holdsNothing
                          : player.angklung.map((angklung) => angklung.spec.nomor).join(' · ')}
                      </span>
                      <span className="font-mono text-step--1 text-ink-faint">
                        {Math.round(restShare * 100)}% {dict.ansambel.rests}
                      </span>
                    </button>

                    {/* Absence is a separate act from choosing whose part is
                        yours, so it is a separate control rather than a fourth
                        mode — you can take out a player and still be one. */}
                    <button
                      type="button"
                      onClick={() =>
                        setAbsentPlayers((current) =>
                          current.includes(player.playerIndex)
                            ? current.filter((index) => index !== player.playerIndex)
                            : [...current, player.playerIndex],
                        )
                      }
                      aria-pressed={isAbsent}
                      aria-label={`${isAbsent ? dict.ansambel.bringBack : dict.ansambel.markAbsent} — ${dict.ansambel.player} ${player.playerIndex + 1}`}
                      title={isAbsent ? dict.ansambel.bringBack : dict.ansambel.markAbsent}
                      className={[
                        // Neutral ink, never cue amber: amber is the conductor's
                        // upcoming signal and nothing else (invariant 12).
                        'shrink-0 rounded-r-lg px-3 font-mono text-step--1 transition duration-200',
                        isAbsent
                          ? 'text-ink hover:text-ink'
                          : 'text-ink-faint hover:bg-stage-hover hover:text-ink',
                      ].join(' ')}
                    >
                      <span aria-hidden="true">{isAbsent ? '＋' : '−'}</span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <Timeline
              players={ensemble?.players ?? []}
              durationSec={durationSec}
              positionSec={positionSec}
              yourPlayerIndex={yourPlayerIndex}
              peakSec={showWhy ? result.peak.atSec : null}
              peakNoteIndexes={showWhy ? result.peak.noteIndexes : []}
              absentPlayers={absentPlayers}
              dict={dict}
            />
          </section>

          {mode !== 'dengar' ? (
            <section className="space-y-3">
              <h2 className="font-display text-step-2 text-sounding">
                {mode === 'bagian-anda' ? dict.ansambel.yourPart : dict.ansambel.everyPart}
              </h2>
              {mode === 'semua-bagian' ? (
                <p className="max-w-2xl text-step-0 text-ink-muted">{dict.ansambel.cannotAlone}</p>
              ) : null}
              <Rack
                set={
                  mode === 'bagian-anda'
                    ? (yourPart?.angklung ?? [])
                    : set
                }
                technique="kurulung"
                numberLabel={dict.rak.nomor}
                yourPartNumbers={(yourPart?.angklung ?? []).map((angklung) => angklung.spec.nomor)}
                cuedNumber={cuedNumber}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  )
}
