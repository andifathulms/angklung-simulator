/**
 * Data gate. Runs before every build (`pnpm build`). Tunings must carry citations,
 * sets must resolve inside their laras, melodies must declare their provenance,
 * and no audio file may exist anywhere in the repository.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { MELODIES } from '../lib/melody'
import { SETS, buildSet } from '../lib/set'
import { TUNINGS, getTuning } from '../lib/tuning'

const problems: string[] = []

function check(condition: boolean, message: string): void {
  if (!condition) problems.push(message)
}

for (const tuning of TUNINGS) {
  check(tuning.source.title.trim().length > 20, `laras ${tuning.id}: kutipan sumber terlalu pendek`)
  check(tuning.source.note.trim().length > 20, `laras ${tuning.id}: catatan sumber terlalu pendek`)
  check(tuning.degrees.length > 0, `laras ${tuning.id}: tidak punya derajat`)
  check(tuning.degrees[0]?.cents === 0, `laras ${tuning.id}: derajat pertama harus 0 sen`)

  let previousCents = -1
  for (const degree of tuning.degrees) {
    check(
      degree.cents > previousCents,
      `laras ${tuning.id}: derajat ${degree.name} tidak menaik (${degree.cents} sen)`,
    )
    check(degree.cents < 1200, `laras ${tuning.id}: derajat ${degree.name} keluar dari satu oktaf`)
    previousCents = degree.cents
  }

  if (tuning.laras !== 'padaeng') {
    check(
      /terdokumentasi/.test(tuning.description),
      `laras ${tuning.id}: deskripsi harus menyatakan bahwa ini satu set terdokumentasi, bukan standar`,
    )
  }
}

for (const set of SETS) {
  check(set.entries.length > 0, `set ${set.id}: kosong`)
  check(set.source.title.trim().length > 20, `set ${set.id}: kutipan sumber terlalu pendek`)
  check(set.numberingNote.trim().length > 20, `set ${set.id}: catatan penomoran terlalu pendek`)
  try {
    const built = buildSet(set, getTuning(set.laras))
    built.forEach((angklung, index) => {
      check(
        angklung.spec.nomor === index + 1,
        `set ${set.id}: nomor ${angklung.spec.nomor} tidak berurutan pada indeks ${index}`,
      )
    })
  } catch (error) {
    problems.push(`set ${set.id}: ${(error as Error).message}`)
  }
}

for (const melody of MELODIES) {
  check(melody.notes.length > 0, `melodi ${melody.id}: kosong`)
  check(
    melody.provenance === 'domain-publik' || melody.provenance === 'ciptaan-sendiri',
    `melodi ${melody.id}: provenance harus domain-publik atau ciptaan-sendiri`,
  )
  check(melody.source.title.trim().length > 10, `melodi ${melody.id}: kutipan sumber terlalu pendek`)
  const set = SETS.find((candidate) => candidate.id === melody.setId)
  if (set === undefined) {
    problems.push(`melodi ${melody.id}: set ${melody.setId} tidak ada`)
  } else {
    const available = new Set(buildSet(set, getTuning(set.laras)).map((a) => a.pitchId))
    for (const note of melody.notes) {
      check(
        available.has(note.pitchId),
        `melodi ${melody.id}: nada ${note.pitchId} tidak ada dalam set ${melody.setId}`,
      )
    }
  }
}

// Invariant 2: no sampled audio, ever.
const AUDIO = /\.(wav|mp3|ogg|flac|aif|aiff|m4a)$/i
const SKIP = new Set(['node_modules', '.next', 'out', '.git'])
function walk(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(path))
    else found.push(path)
  }
  return found
}
for (const path of walk(process.cwd())) {
  if (AUDIO.test(path)) problems.push(`berkas audio ikut terbawa: ${path}`)
}

// The data files themselves must stay readable and non-empty.
for (const dir of ['data/tunings', 'data/sets', 'data/melodies']) {
  const full = join(process.cwd(), dir)
  for (const name of readdirSync(full)) {
    const path = join(full, name)
    check(statSync(path).size > 0, `${path}: kosong`)
    try {
      JSON.parse(readFileSync(path, 'utf8'))
    } catch (error) {
      problems.push(`${path}: JSON tidak valid — ${(error as Error).message}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`data:validate gagal — ${problems.length} masalah:\n`)
  for (const problem of problems) console.error(`  • ${problem}`)
  process.exit(1)
}

console.log(
  `data:validate lolos — ${TUNINGS.length} laras, ${SETS.length} set, ${MELODIES.length} melodi, semuanya berkutipan.`,
)
