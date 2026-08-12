/**
 * After the static export: the GitHub Pages marker, and a last check that no
 * sampled audio slipped into the bundle.
 */
import { readdirSync, statSync, writeFileSync } from 'node:fs'
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

// PRD §11: JS ≤ 250 KB gzipped. Reported here so a regression is visible at build.
const scripts = files.filter((path) => path.endsWith('.js'))
const totalBytes = scripts.reduce((total, path) => total + statSync(path).size, 0)

console.log(
  `postbuild: ${files.length} berkas, ${scripts.length} berkas JS ` +
    `(${(totalBytes / 1024).toFixed(0)} KB mentah), .nojekyll ditulis, tanpa berkas audio.`,
)
