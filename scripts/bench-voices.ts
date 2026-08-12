/**
 * Polyphony load at full ensemble size, benchmarked at M0 — before any UI exists.
 * A full ensemble is many simultaneous resonators, and discovering that the voice
 * model cannot carry it after the rack is drawn would be a rewrite (PRD §13).
 *
 * This measures the synthesis core, not Web Audio: if the model cannot render an
 * ensemble far faster than realtime here, it will not survive a phone.
 */
import { buildSet, getSet } from '../lib/set'
import { KURULUNG_DEFAULT_SHAKE_RATE_HZ, render, renderMix } from '../lib/synth'
import type { RenderParams } from '../lib/synth'

const SAMPLE_RATE_HZ = 48000
const NOTE_SEC = 1.5
const PIECE_SEC = 8

const set = buildSet(getSet('melodi-kromatis'))
const chords = buildSet(getSet('akompanimen-dasar'))

function voiceParams(index: number, angklung = set[index % set.length]): RenderParams {
  if (angklung === undefined) throw new Error('set kosong')
  return {
    angklung: angklung.spec,
    technique: {
      type: 'kurulung',
      shakeRateHz: KURULUNG_DEFAULT_SHAKE_RATE_HZ,
      durationSec: NOTE_SEC,
      hardness: 0.5,
      seed: 1000 + index,
    },
    sampleRateHz: SAMPLE_RATE_HZ,
    durationSec: NOTE_SEC + 1.2,
    gain: 0.25,
  }
}

function timed<T>(label: string, run: () => T): T {
  const started = process.hrtime.bigint()
  const result = run()
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6
  console.log(`  ${label.padEnd(46)} ${elapsedMs.toFixed(1).padStart(8)} ms`)
  return result
}

console.log('\nbench:voices — beban polifoni pada ukuran ansambel penuh\n')
console.log(`  ${set.length} angklung melodi, ${chords.length} angklung akompanimen`)
console.log(`  ${SAMPLE_RATE_HZ} Hz, satu nada ${NOTE_SEC}s\n`)

const single = timed('satu nada, satu angklung', () => render(voiceParams(0)))
const singleMs = (single.length / SAMPLE_RATE_HZ) * 1000

for (const voices of [8, 16, 32, 64]) {
  const started = process.hrtime.bigint()
  renderMix(
    Array.from({ length: voices }, (_, index) => ({
      params: voiceParams(index),
      // Spread the entries across the piece the way an arrangement would.
      startSec: (index % 16) * 0.25,
    })),
    SAMPLE_RATE_HZ,
    PIECE_SEC,
  )
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6
  const realtimeFactor = (PIECE_SEC * 1000) / elapsedMs
  const verdict = realtimeFactor >= 20 ? 'lolos' : realtimeFactor >= 5 ? 'ketat' : 'GAGAL'
  console.log(
    `  ${String(voices).padStart(3)} suara serentak → ${elapsedMs.toFixed(1).padStart(8)} ms ` +
      `untuk ${PIECE_SEC}s audio  (${realtimeFactor.toFixed(1)}× realtime, ${verdict})`,
  )
}

const chordVoices = chords.map((angklung, index) => ({
  params: { ...voiceParams(index, angklung) },
  startSec: index * 0.5,
}))
timed(`${chords.length} angklung akompanimen (4 tabung tiap satu)`, () =>
  renderMix(chordVoices, SAMPLE_RATE_HZ, PIECE_SEC),
)

console.log(
  `\n  Acuan: satu nada berdurasi ${singleMs.toFixed(0)} ms audio.` +
    '\n  Target: ≥20× realtime pada 64 suara di mesin pengembangan,' +
    '\n  agar ponsel kelas menengah masih punya ruang di atas Web Audio.\n',
)
