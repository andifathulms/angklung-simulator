/**
 * After the static export: the GitHub Pages marker, and a last check that no
 * sampled audio slipped into the bundle.
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')

writeFileSync(join(OUT, '.nojekyll'), '')

function walk(dir) {
  const found = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(path))
    else found.push(path)
  }
  return found
}

const files = walk(OUT)
const audio = files.filter((path) => /\.(wav|mp3|ogg|flac|aif|aiff|m4a)$/i.test(path))
if (audio.length > 0) {
  console.error('Berkas audio ikut terekspor — angklung di sini disintesis, bukan direkam:')
  for (const path of audio) console.error(`  • ${path}`)
  process.exit(1)
}

/*
 * The .card-row layout gives every card in a row one shared set of tracks, which
 * only works while each card has exactly as many direct children as there are
 * tracks. Get that wrong and the cards silently shear apart by one row — the
 * exact misalignment the layout exists to prevent, and invisible from the code.
 * Checked here so it fails the build instead of the page.
 */
const VOID_TAGS = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source'])

function countDirectChildren(html, from) {
  let depth = 0
  let children = 0
  const tag = /<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g
  tag.lastIndex = from
  let match
  while ((match = tag.exec(html)) !== null) {
    const [, closing, name, attributes, selfClosing] = match
    const isVoid = VOID_TAGS.has(name.toLowerCase()) || selfClosing === '/' || attributes.endsWith('/')
    if (closing === '/') {
      if (depth === 0) return children
      depth -= 1
      continue
    }
    if (depth === 0) children += 1
    if (!isVoid) depth += 1
  }
  return children
}

const layoutProblems = []
for (const path of files.filter((candidate) => candidate.endsWith('.html'))) {
  const html = readFileSync(path, 'utf8')
  const rows = /<[^>]*class="[^"]*\bcard-row\b[^"]*"[^>]*style="[^"]*--card-row-rows:\s*(\d+)/g
  let row
  while ((row = rows.exec(html)) !== null) {
    const expected = Number(row[1])
    const cards = /<[^>]*class="card-row-card[^"]*"[^>]*>/g
    cards.lastIndex = row.index
    let card
    let checked = 0
    while ((card = cards.exec(html)) !== null && checked < 12) {
      const actual = countDirectChildren(html, card.index + card[0].length)
      if (actual !== expected) {
        layoutProblems.push(
          `${path}: a .card-row-card has ${actual} sections but its row declares ${expected}`,
        )
      }
      checked += 1
      if (checked >= 3) break
    }
  }
}

if (layoutProblems.length > 0) {
  console.error('Tata letak kartu tidak sejajar:')
  for (const problem of layoutProblems) console.error(`  • ${problem}`)
  process.exit(1)
}

// PRD §11: JS ≤ 250 KB gzipped. Reported here so a regression is visible at build.
const scripts = files.filter((path) => path.endsWith('.js'))
const totalBytes = scripts.reduce((total, path) => total + statSync(path).size, 0)

console.log(
  `postbuild: ${files.length} berkas, ${scripts.length} berkas JS ` +
    `(${(totalBytes / 1024).toFixed(0)} KB mentah), .nojekyll ditulis, tanpa berkas audio.`,
)
