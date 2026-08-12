# CLAUDE.md — Angklung Ensemble

Angklung simulator built around the coordination problem: one angklung is one note, so a song needs many players. Synthesised from a physical model, no sampled audio. Static site, GitHub Pages, no backend, no runtime network.

Read `PRD.md` before starting any task — **§2 and §4 in particular**. It fixes scope; this file describes how to work in the repo.

**Four things shape everything:**

1. **Three techniques, one model.** Kurulung, centok, and tengkep are three *excitation patterns* on one resonator, not three sound files. If they become three samples or three code paths, the project has learned nothing.
2. **No sampled audio, ever.** Sampling real angklung means licensing recordings. The instrument is synthesised. This is both the clean path and the interesting one.
3. **Schedule against the audio clock, never `setTimeout`.** Timer-driven notes drift audibly within seconds, and drift is the one bug that destroys an ensemble simulator.
4. **The ensemble is the product.** A single playable angklung is a soundboard and those already exist. The distribution across players is why this is worth building.

---

## Stack

- Next.js 14, App Router, `output: 'export'` — static only
- TypeScript, `strict: true`
- Tailwind CSS
- Web Audio API directly; Tone.js only if it earns its place for scheduling
- Vitest
- pnpm
- **No sample libraries, no synthesis library, no DSP dependency.** The resonator model is the project.
- Fonts via `next/font`, self-hosted.

## Commands

```bash
pnpm dev
pnpm build                  # static export to ./out; runs data:validate first
pnpm preview                # serve ./out under the production basePath
pnpm test                   # vitest watch
pnpm test:run               # vitest once — before every commit
pnpm test:synth             # offline render: pitch, partials, onsets, determinism
pnpm test:distribution      # assignment properties + brute-force agreement
pnpm bench:voices           # polyphony load at full ensemble size
pnpm data:validate          # tuning citations, angklung set definitions
pnpm typecheck
pnpm lint
```

`pnpm test:synth` gates every commit touching `lib/synth`.

## Layout

```
app/
  [locale]/                 # id (default), en
    rak/                    # the rack — play
    ansambel/               # distribution + play-your-part
    teknik/                 # technique lab
    laras/                  # tuning comparison
    aransemen/              # arrangement + solver
components/
  rack/                     # drawn angklung, sway animation
  timeline/                 # parts, cues, rests
  lab/                      # excitation visualisation
lib/
  synth/                    # THE CORE. Pure. Renders offline. No Web Audio, no DOM.
    resonator.ts            # modal bank per tube
    excitation.ts           # kurulung | centok | tengkep patterns
    angklung.ts             # tube set → mixed render
    render.ts               # params → Float32Array
  audio/                    # Web Audio boundary — context, voices, lookahead scheduler
  tuning/                   # laras definitions, cents, pitch mapping
  set/                      # angklung set definitions, padaeng numbering
  distribute/               # melody + players → assignment; infeasibility reporting
data/
  tunings/                  # padaeng, salendro, pelog degung — cited, editable
  sets/                     # angklung set definitions with numbering
  melodies/                 # public-domain or own-composition only, cited
tests/
  synth/
  distribution/
```

## Invariants

1. **`lib/synth` is pure and renders offline.** `(params) → Float32Array`. No Web Audio, no DOM, no React, no clock, no module-level mutable state. It must run in Node — that is what makes the sound testable rather than judged by ear.

2. **No audio files ship.** No `.wav`, `.mp3`, or `.ogg` in the repo or the bundle. If a reference recording is used for ear-tuning during development, it stays out of the repository.

3. **Excitation and resonance are separate modules.** A technique is an excitation pattern over the same resonator bank. **Never add a technique as a new sound path**, a new sample, or a branch inside the resonator.

4. **Tengkep removes a resonator from the sum.** It is not a filter, not a volume change, not a preset. Muting a tube means that tube's modes are absent from the render — and the tests assert their absence.

5. **The accompaniment chord logic is cited and fixture-locked.** A major accompaniment angklung renders a dominant seventh untengkeped and a major triad tengkeped. This is the project's most distinctive claim; it has a fixture and the fixture does not get relaxed.

6. **Scheduling uses `AudioContext.currentTime` with a lookahead queue.** No `setTimeout` or `setInterval` drives note timing, ever. Timers may drive the *scheduler's own wakeups*, never the note onsets.

7. **Kurulung's shake rate stays within the cited 2–3 Hz range** unless the technique lab explicitly exposes it for experimentation. The default is the documented value, not a tuned-by-feel number.

8. **Tunings are cited data, editable, and never presented as authoritative.** Salendro and pelog vary between sets; `data/tunings/` records each as one documented interval set with its source, and the UI says so.

9. **Distribution never silently drops a note.** A note outside the set, or a player needed in two places at once, produces a named infeasibility in the result. Truncating an arrangement to make it fit is the worst failure this project can have.

10. **Determinism.** Same params and seed render byte-identically. Kurulung's strike irregularity comes from a seeded PRNG carried in params, never `Math.random`.

11. **Sway is driven by the same shake rate as the audio.** The animation and the excitation read from one value. A decorative sway at an unrelated rate would be a lie about the mechanism.

12. **Jade marks the user's own part; cue amber marks the conductor's upcoming signal; sounding brightness marks ringing tubes.** Each has exactly one meaning. See PRD §8.

13. **iOS requires a user gesture before `AudioContext` starts.** Explicit start control, never autostart.

14. **Voice budget is enforced.** A full ensemble is many simultaneous resonators; pool and reuse them, cap polyphony, and drop oldest rather than allowing audio glitching.

15. **Melodies ship only if public domain or own composition**, cited either way. No copyrighted songs in `data/melodies/`.

16. **Sundanese terminology is preserved** in identifiers, comments, and UI: `kurulung`, `centok`, `tengkep`, `tabungDasar`, `angklungMelodi`, `angklungAkompanimen`, `laras`. Do not substitute English approximations.

17. **Nothing is computed in a component.**

## Working style

- **Synthesis before interface.** M0 has no UI on purpose. A beautiful rack playing a wrong instrument is worse than no rack.
- **Write the render tests before the resonator.** Pitch, partials, and onset count are objective; get them green, then tune timbre by ear with the parameters exposed in the technique lab.
- **Benchmark polyphony at M0.** A full ensemble is the design point; discovering the voice model can't carry it after the UI exists is a rewrite.
- **When a synth test fails, the model is wrong.** Not the tolerance. Investigate in that order.
- **Ship the ensemble view at M2**, before the conductor and before extra techniques. Without it this is a soundboard.
- **Cite before you tune.** Shake rates, intervals, and chord structures come from documented sources with the citation in the comment — not from what sounds right.
- **Don't touch `next.config.js`, the Actions workflow, or the scheduler without saying so explicitly.**
- **Don't add an audio, synthesis, or DSP dependency.**
- **Never weaken a test to make something pass**, especially the chord fixture.

## Conventions

- Named exports; defaults only where Next requires them.
- Discriminated unions for techniques, excitations, and distribution results, keyed on `type`. Exhaustive `switch` with a `never` default — this is how adding a technique surfaces every site that must handle it.
- No `any`. No non-null `!` in `lib/synth`.
- Frequencies in Hz as `number`, named `*Hz`. Intervals in cents, named `*Cents`. Times in seconds, named `*Sec`. Convert once, at the boundary.
- Angklung numbers follow the padaeng numbering used for conductor hand signals — that numbering is the user-facing identity, so keep it stable.
- Comments cite the source for any documented figure: shake rate, chord structure, interval set.
- Sundanese and Indonesian terms in code and UI; Western music theory terms in English where they are the standard (`dominant seventh`, `major triad`, `cents`).
- Tailwind utilities inline; semantic tokens in `tailwind.config.ts` — `stage`, `bamboo`, `rattan`, `sounding`, `yourPart`, `cue`, `muted`. Never raw hex in components.

## Testing rules

- `pnpm test:run` before every commit; `pnpm test:synth` before any commit touching `lib/synth`, `lib/tuning`, or `lib/set`.
- Pitch asserted by FFT over the offline render, within a stated cents tolerance.
- Tengkep asserted in **both** directions: muted partials absent when held, present when not.
- Accompaniment chord asserted in both directions: four pitches forming a dominant seventh, three forming a major triad.
- Centok asserted as exactly one onset. Kurulung's strike rate asserted within the cited range.
- Determinism asserted on every render.
- New technique → its own excitation fixture and an onset-pattern assertion.
- New tuning → citation present, cents values asserted against the source.
- Distribution → every note assigned to a holder, no simultaneous conflicts, brute-force agreement on small melodies, infeasibility reported rather than dropped.
- Scheduling → onsets land within tolerance and do not drift across a long piece.
- Bug fix → failing test first.

## Deployment

`main` builds and deploys via Actions. `basePath` must match the repository name; `.nojekyll` must exist in `out/`. No audio assets ship. Verify with `pnpm preview` before pushing, and **test audio startup on a real iOS device before any release touching the audio path**.

## Framing

The site credits Daeng Soetigna for the 1938 diatonic-chromatic angklung and Udjo Ngalagena for the playing technique developed on salendro and pelog, names them on the page rather than in a footnote, and links to Saung Angklung Udjo and real ensembles. It states that this is a personal educational project, not an authority, that tunings and techniques vary between traditions and teachers, and that angklung buhun's ritual context is noted but not simulated. No OIKN or government branding anywhere.

## Current state

M0 — not yet scaffolded. Next: the modal resonator, the three excitation patterns, and the offline render suite. **No UI work until pitch, partials, and onset tests pass and the polyphony benchmark clears.**
