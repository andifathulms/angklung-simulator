# PRD — Angklung Simulator

**One angklung is one note. So a song is a coordination problem — and that is the thing this simulates.**

| | |
|---|---|
| **Status** | Draft — pre-implementation |
| **Owner** | Andi Fathul Mukminin Salahuddin |
| **Type** | Personal portfolio project, open source, educational |
| **Deployment** | GitHub Pages (static export, no server, no runtime network) |
| **Language** | Indonesian-first UI; Sundanese terminology throughout; English secondary |
| **Audio** | Synthesised from a physical model. No sampled recordings — see §4. |

*Name: **Angklung Simulator**, chosen from the shortlist. It is the plainest of the options and the one that reads without explanation. The coordination — a single-instrument angklung toy already exists; the ensemble is what doesn't — remains the differentiator, and the site has to carry that rather than the title. Considered and set aside: **Angklung Ensemble**, **Main Angklung**.*

---

## 1. The premise

An angklung produces **one note**. Shake it and the bamboo tubes strike the frame; that is the whole instrument. As the standard teaching material puts it: one angklung can only sound one note, so it has to be played by many people.

This is the opposite of a piano, and it is why an angklung performance looks the way it does — a room of people, each holding one or two notes, watching a conductor for the moment their note arrives. **The instrument is distributed. Playing it is a coordination problem.**

Every angklung app on the internet is a soundboard: tap a bamboo picture, hear a note. That models the sound and misses the instrument entirely.

## 2. What the simulator is for

**Feel the coordination.** Load a melody. See it distributed across players, each holding their one or two angklung. Take one part and try to play it — you wait, you count, you come in on your note. Then take *all* the parts and discover you can't, which is the point.

**Understand the techniques as one mechanism, not three sounds.** The three basic techniques are documented and specific:

| Technique | What the player does | Result |
|---|---|---|
| **Kurulung** (getar) | Holds the frame, shakes the base tube left-right for as long as the note lasts. Recommended shake frequency **2–3 Hz**. | Sustained, tremolo-like |
| **Centok** (sentak) | Pulls the base tube sharply into the palm. | Sounds **once** — staccato, likened to pizzicato |
| **Tengkep** | Like kurulung, but one tube is held — with the little finger or a stopper — so it does not vibrate. | Softer, fewer partials |

In a physical model these are not three samples. They are **three excitation patterns on the same resonator**, which is exactly what makes them worth simulating.

**Discover what tengkep actually does** — the detail that makes this project more than a toy. On a **melody angklung**, tengkep silences the octave tube, so you hear a pure single note instead of the usual two. On a **major accompaniment angklung**, it does something else entirely: without tengkep, four tubes sound and you get a **dominant seventh chord**; hold one tube and you get a **major triad**.

So tengkep is a chord-quality switch. The accompaniment angklung is not a note — it is a chord, and the player's little finger changes which chord it is. No simulator models this, and it is the single most interesting fact about the instrument's design.

## 3. Non-goals

- **Not a DAW or general sequencer.** No mixing, no effects, no multitrack export.
- **No sampled recordings.** See §4 — synthesis is both the honest path and the technically interesting one.
- **Not a replacement for learning the instrument.** Points to Saung Angklung Udjo and real ensembles.
- **No angklung buhun ritual context.** Traditional angklung is tied to rice cultivation and the veneration of Nyai Sri Pohaci. That is living ritual practice, out of scope, mentioned respectfully and not simulated.
- **No arumba, calung, or other bamboo ensembles in v1.**
- **No accounts, no server, no runtime network.**
- **No ML.** No generated arrangements, no auto-harmonisation.

## 4. Audio — synthesis, not samples

**Sampling real angklung would mean licensing recordings.** Two of this project family's predecessors hit licensing walls late; this one avoids the problem by construction.

**A bamboo tube is a modal resonator**, and the instrument's behaviour falls out of modelling it directly:

- Each tube is a small bank of resonant modes with exponential decay, tuned so the fundamental lands on the target pitch.
- An angklung holds **two or more tubes tuned in octaves** — so the default sound is already two notes, which is why tengkep's single-note result is notable.
- **Excitation is a strike.** The tube hits the frame; that is an impulse.
- **Kurulung is a strike train.** A 2–3 Hz shake with a strike at each direction change gives roughly 4–6 strikes per second, slightly irregular. That irregularity is why kurulung sounds alive rather than like a machine tremolo.
- **Centok is a single, harder impulse.**
- **Tengkep removes a resonator from the sum.**

**Three techniques, one model, three excitation patterns.** Same principle as a sawtooth that must emerge from simulated packets rather than being drawn: if the techniques are three audio files, nothing has been learned.

**Tuning is a cited, editable parameter — never a claim.** Angklung padaeng is diatonic-chromatic, created by Daeng Soetigna in 1938 specifically so angklung could play alongside Western instruments. Traditional angklung uses pentatonic *salendro* and *pelog degung*, and Udjo Ngalagena developed playing technique around those laras. **Salendro and pelog have no fixed standard and vary between sets** — so those tunings ship as cited interval sets, clearly marked as one documented tuning rather than the tuning, and the user can edit the cents.

## 5. Features

### 5.1 The rack — signature view
The ensemble as physical objects: angklung hanging in a frame, graduated by size, each carrying its number in the padaeng numbering the conductor signals with.

**When an angklung sounds, it sways** — and the sway is the point, not decoration. The Sundanese word is *angkleung-angkleungan*, the swaying of the player, and the sound *klung* comes from it. The motion *is* the instrument, so the animation is the mechanism made visible.

The rack is the interface: click to centok, hold to kurulung, hold with a modifier to tengkep.

### 5.2 Distribution view
A melody laid over the ensemble: which player holds which angklung, and when each one comes in. Rests are as visible as notes, because for an angklung player the waiting is most of the job.

This view answers the question the whole project exists for — *what does one person actually do during a song?*

### 5.3 Play your part
Pick a player. The interface shows only your angklung and your cues. Come in on time or don't. This is the closest a browser gets to standing in an ensemble, and it is where the coordination stops being an abstraction.

### 5.4 Play every part
Try to play the whole melody yourself. You will fail, immediately and instructively. Ships as a deliberate demonstration, not as a hard mode.

### 5.5 The conductor
Numbered cues, the way a conductor signals angklung numbers by hand. Tempo control, count-in, and a cue lane showing what's coming.

### 5.6 Accompaniment angklung
The chord instrument, with the tengkep switch: four tubes sounding a dominant seventh, or one tube held for a major triad. Shown as tubes, not as a chord symbol, so the mechanism is visible.

### 5.7 Technique lab
One angklung, isolated, with the excitation exposed: shake rate, strike hardness, which tubes are muted. Watch the strike train and hear the result change. The audible version of the trace view every sibling project has.

### 5.8 Tuning comparison
Padaeng diatonic against salendro and pelog degung on the same phrase. The fastest way to hear why the 1938 innovation mattered — and why an instrument tuned one way cannot simply join an ensemble tuned the other.

### 5.9 Arrangement
Enter or import a melody, get a distribution across a chosen number of players and a chosen angklung set. Reports what is unplayable: notes outside the set, or two notes needed from one player at once.

## 6. Architecture

Static Next.js 14 App Router export. No backend, no runtime network.

```
technique + pitch + tuning
  → excitation pattern (impulse train)
  → modal resonators (per tube)
  → mix → Float32Array

melody + set + player count
  → distribution → assignment per player
  → scheduler (audio clock) → timed excitations
```

**`lib/synth` is pure and renders offline.** `(params) → Float32Array`. No Web Audio, no DOM, no clock. This is what makes the sound testable in Node rather than judged by ear — the same discipline as a pure routing or diffing core.

**Scheduling uses the audio clock, never `setTimeout`.** A lookahead scheduler queues events against `AudioContext.currentTime`. Timer-driven note scheduling drifts audibly within seconds, and in an ensemble simulator drift is the one thing that destroys the point.

**Excitation and resonance are separate.** Techniques are patterns over one resonator model. Adding a technique means adding an excitation pattern, never a new sound path.

**Distribution is a small constraint problem.** Each note needs a player holding that angklung and free at that moment. Brute-forceable at realistic sizes, and it reports infeasibility rather than dropping notes.

**iOS needs a user gesture before `AudioContext` starts.** Handled with an explicit start control, tested on a real device.

## 7. Testing

**Offline render, not ear judgement.** `lib/synth` renders to a buffer; tests assert on the signal:

- **Pitch.** The fundamental of a rendered note lands within cents of target, verified by FFT over the render.
- **Tengkep.** The muted tube's partials are absent, and present without it. Both directions.
- **Chord identity.** The major accompaniment angklung renders four pitches forming a dominant seventh untengkeped, and three forming a major triad tengkeped. Cited, and fixture-tested — this is the project's most distinctive claim and it must be provably right.
- **Centok is one strike.** Exactly one onset in the render.
- **Kurulung strike rate** falls within the cited 2–3 Hz shake range.
- **Determinism.** Same params and seed render byte-identically.

**Distribution properties.** Every note assigned to a player holding that angklung; no player assigned two simultaneous different notes; minimum-player solutions verified against brute force on small melodies; infeasible arrangements reported rather than silently truncated.

**Timing.** Scheduled onsets land within tolerance of target and do not drift across a long piece.

## 8. Design direction

Bamboo on a dark stage. This is a performance instrument, and the one dark-first design in the family after the spectrogram — because bamboo lit against darkness is how an angklung ensemble actually looks, and it makes the sway read.

**Palette.** Stage `#221B14`, warm near-black. Bamboo `#C9A55C` for the tubes. Rattan `#6B4A2B` for lashings, frame, and rules. **Sounding `#F2DFA8`** — tubes brighten as they ring and fade as they decay, so the room's activity is visible at a glance. **Jade `#5E9E86` for your part**, so a player can always find themselves. **Cue amber `#D97B3A` for the conductor's upcoming signal**, and nothing else. Muted `#4A3D2E` for a tube held under tengkep — visibly present and visibly silent.

**Type.** **Instrument Serif** for display — the pun is free and the face has the warmth a performance page wants. **Instrument Sans** for controls and prose. **Recursive** in its mono setting for angklung numbers, timing, and cents readouts; numbers are large here because the conductor signals numbers.

**Structure.** The rack is drawn to scale — tube lengths genuinely graduated by pitch, so the instrument's physical logic is visible. Players are rows; the timeline runs beneath. Rests are drawn as space, not as marks, because that is what waiting feels like.

**Motion.** The sway, and only the sway. An angklung swings on its axis while sounding, damping to rest as the note decays, with the shake rate matching the modelled kurulung. The conductor's cue arrives as a number lighting a beat ahead. Nothing else moves. `prefers-reduced-motion` replaces sway with a static brightness change.

**Copy.** Indonesian first, Sundanese terminology always — *kurulung*, *centok*, *tengkep*, *tabung dasar*, *angklung melodi*, *angklung akompanimen*, *laras* — glossed on first use, never translated away.

## 9. Cultural framing

Angklung is a living UNESCO-recognised tradition with named makers, teachers, and lineages. Three things follow:

- **Credit the people.** Daeng Soetigna for the 1938 diatonic-chromatic angklung, Udjo Ngalagena for the playing technique built on salendro and pelog. Named on the page, not buried in a sources list.
- **Point to the real thing.** Saung Angklung Udjo and local ensembles, linked. A browser simulator is a doorway, not a substitute.
- **Stay out of ritual.** Angklung buhun's role in rice cultivation and the veneration of Nyai Sri Pohaci is noted as context and not simulated.

The site states it is a personal educational project, not an authority, and that tunings and techniques vary between traditions and teachers.

## 10. Milestones

| | | |
|---|---|---|
| **M0** | The tube | Scaffold; modal synthesis; kurulung, centok, and tengkep as three excitation patterns on one model; offline render tests green. **No UI.** |
| **M1** | The rack | Drawn angklung, sway animation, click and hold to play, audio-clock scheduling, technique lab. |
| **M2** | Ensemble | Melody, distribution across players, play-your-part, play-every-part. **Ship publicly here — this is the insight.** |
| **M3** | Conductor | Numbered cues, tempo, count-in, cue lane. |
| **M4** | Accompaniment | Chord angklung, the tengkep dominant-seventh-to-triad switch, fixtures. |
| **M5** | Tuning | Padaeng against salendro and pelog degung, cited and editable, comparison view. |
| **M6** | Arrangement | Melody entry, distribution solver, infeasibility reporting, sharing. |

M0 having no interface is deliberate: if the synthesis is wrong, a beautiful rack plays a wrong instrument.

## 11. Success criteria

- Rendered fundamentals land within a stated cents tolerance across the full set.
- Tengkep provably removes the muted tube's partials; the accompaniment chord provably switches dominant-seventh to major triad.
- Centok renders exactly one onset; kurulung's strike rate falls in the cited range.
- No scheduling drift across a full piece.
- Distribution never silently drops a note; infeasibility is reported with the reason.
- Every tuning ships with a citation and is editable.
- Fully playable with a keyboard, and usable on a phone.
- Zero network requests after first load. JS ≤ 250 KB gzipped.
- A visitor can hear why one person cannot play a melody alone, within two interactions.

## 12. Deployment

`output: 'export'`, `basePath` matching the repository name, `images.unoptimized`, `trailingSlash: true`, `.nojekyll` in the output root. Fonts self-hosted via `next/font`. No audio assets ship — the instrument is synthesised. Verify under the production `basePath` with `pnpm preview`, and test audio startup on a real iOS device before any release.

## 13. Risks

| Risk | Mitigation |
|---|---|
| **Synthesised angklung sounds wrong.** | Offline render tests for pitch and partials give objective correctness; timbre is then tuned by ear against reference listening, with the model's parameters exposed in the technique lab so the tuning is inspectable rather than hidden. |
| **Polyphony load** — a full ensemble is many simultaneous resonators. | Voice budget, resonators pooled and reused, benchmark on a mid-range phone at M0. |
| **`setTimeout` scheduling drift.** | Audio-clock lookahead scheduler from M1. Drift is the one bug that destroys an ensemble simulator. |
| **Overstating tuning authority.** | Salendro and pelog ship as cited documented interval sets, editable, explicitly not presented as the tuning. |
| **iOS audio startup.** | Explicit gesture, tested on device. |
| **Reading as a toy soundboard.** | The ensemble view ships at M2, before the conductor and before extra techniques. The coordination is the product. |
| **Scope creep into a sequencer.** | §3 is binding. |
