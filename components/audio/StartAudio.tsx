'use client'

import Link from 'next/link'
import { useAudio } from './AudioProvider'
import { Button } from '../ui'
import { localePath } from '@/lib/i18n'
import type { Dictionary, Locale } from '@/lib/i18n'

/**
 * The explicit start control. iOS will not start an AudioContext outside a user
 * gesture, so there is no autostart path anywhere in the app (invariant 13).
 *
 * In the header this stays small: once sound is on it is a status dot, because a
 * persistent button for something already done is just noise.
 */
export function StartAudio({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const { status, start, resume, contextState, needsSilentSwitchHint } = useAudio()

  if (status === 'siap') {
    // Safari reports 'interrupted' after a call or Siri, and a context in that
    // state accepts scheduling without making a sound. Say so rather than let the
    // instrument look broken.
    const interrupted = contextState !== null && contextState !== 'running'

    // Interrupted is not just a status: it is something the visitor can fix, and
    // a browser suspends the context of any tab you are not looking at — so this
    // state is common, not exotic, and it has to be a button.
    if (interrupted) {
      return (
        <Button tone="danger" size="sm" onClick={() => void resume()}>
          <span aria-hidden="true" className="pulse-cue">
            ●
          </span>
          {dict.audio.resume}
        </Button>
      )
    }

    return (
      <div className="flex flex-col gap-1">
        <p
          className="flex items-center gap-1.5 font-mono text-step--2 text-yourPart-light"
          role="status"
        >
          <span
            aria-hidden="true"
            className="inline-block h-1.5 w-1.5 rounded-full bg-yourPart"
          />
          {dict.audio.ready}
        </p>
        {needsSilentSwitchHint ? (
          <p className="max-w-[22rem] text-step--2 leading-snug text-ink-faint">
            {dict.audio.silentSwitch}
          </p>
        ) : null}

        {/*
          * The way out of "everything says it is playing and I hear nothing".
          *
          * /diagnostik has always existed and was only ever linked from the
          * footer, which is the wrong place: someone who cannot hear anything
          * is looking at the sound indicator, not scrolling to the bottom of
          * the page. It sits next to the indicator now, and only once sound is
          * supposedly on — which is exactly when the question gets asked.
          */}
        <Link
          href={localePath(locale, '/diagnostik')}
          className="font-mono text-step--2 text-ink-faint underline decoration-stage-strong underline-offset-4 transition hover:text-ink hover:decoration-bamboo"
        >
          {dict.audio.noSound}
        </Link>
      </div>
    )
  }

  if (status === 'tidak-didukung' || status === 'gagal') {
    return (
      <p className="font-mono text-step--2 text-cue-light" role="status">
        {dict.audio.failed}
      </p>
    )
  }

  return (
    <Button
      tone="primary"
      size="sm"
      onClick={() => void start()}
      disabled={status === 'menyalakan'}
      title={dict.audio.hint}
    >
      <span aria-hidden="true">♪</span>
      {status === 'menyalakan' ? dict.audio.starting : dict.audio.start}
    </Button>
  )
}
