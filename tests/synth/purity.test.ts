import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Invariant 1 and 10, enforced by reading the source rather than by remembering.
 * lib/synth must run in Node: no Web Audio, no DOM, no React, no clock, no
 * module-level mutable state, no Math.random.
 */
const SYNTH_DIR = join(process.cwd(), 'lib', 'synth')

/** Comments discuss what the code must not do, so they are stripped before scanning. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

const sources = readdirSync(SYNTH_DIR)
  .filter((name) => name.endsWith('.ts'))
  .map((name) => [name, stripComments(readFileSync(join(SYNTH_DIR, name), 'utf8'))] as const)

const FORBIDDEN: readonly (readonly [string, RegExp])[] = [
  ['Web Audio', /\bAudioContext\b|\bAudioNode\b|\bcreateOscillator\b|\bAudioWorklet\b/],
  ['DOM', /\bdocument\b|\bwindow\b|\bnavigator\b/],
  ['React', /from ['"]react['"]/],
  ['a clock', /\bsetTimeout\b|\bsetInterval\b|\brequestAnimationFrame\b|performance\.now/],
  ['Math.random', /Math\.random/],
  ['any', /:\s*any\b/],
  ['a non-null assertion', /\w!\./],
]

describe('lib/synth purity', () => {
  it('has sources to check', () => {
    expect(sources.length).toBeGreaterThan(4)
  })

  it.each(sources.map(([name]) => name))('%s stays pure', (name) => {
    const source = sources.find(([candidate]) => candidate === name)?.[1] ?? ''
    for (const [label, pattern] of FORBIDDEN) {
      expect(pattern.test(source), `${name} references ${label}`).toBe(false)
    }
  })

  it('holds no module-level mutable state', () => {
    for (const [name, source] of sources) {
      const topLevelLet = /^let\s/m.test(source)
      const topLevelVar = /^var\s/m.test(source)
      expect(topLevelLet || topLevelVar, `${name} declares module-level mutable state`).toBe(false)
    }
  })

  it('ships no audio files anywhere in the repository', () => {
    // Invariant 2. Sampling real angklung would mean licensing recordings.
    const offenders = walk(process.cwd()).filter((path) =>
      /\.(wav|mp3|ogg|flac|aif|aiff|m4a)$/i.test(path),
    )
    expect(offenders).toEqual([])
  })
})

function walk(dir: string): string[] {
  const skip = new Set(['node_modules', '.next', 'out', '.git'])
  const found: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) found.push(...walk(path))
    else found.push(path)
  }
  return found
}
