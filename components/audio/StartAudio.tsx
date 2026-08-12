'use client'

import { useAudio } from './AudioProvider'
import { Button } from '../ui'
import type { Dictionary } from '@/lib/i18n'

/**
 * The explicit start control. iOS will not start an AudioContext outside a user
 * gesture, so there is no autostart path anywhere in the app (invariant 13).
 *
 * In the header this stays small: once sound is on it is a status dot, because a
 * persistent button for something already done is just noise.
 */
export function StartAudio({ dict }: { dict: Dictionary }) {
  const { status, start, contextState, needsSilentSwitchHint } = useAudio()

  if (status === 'siap') {
    // Safari reports 'interrupted' after a call or Siri, and a context in that
    // state accepts scheduling without making a sound. Say so rather than let the
    // instrument look broken.
    const interrupted = contextState !== null && contextState !== 'running'
    return (
      <div className="flex flex-col gap-1">
        <p
          className={
            interrupted
              ? 'flex items-center gap-1.5 font-mono text-[0.68rem] text-cue-light'
              : 'flex items-center gap-1.5 font-mono text-[0.68rem] text-yourPart-light'
          }
          role="status"
        >
          <span
            aria-hidden="true"
            className={
              interrupted
                ? 'pulse-cue inline-block h-1.5 w-1.5 rounded-full bg-cue'
                : 'inline-block h-1.5 w-1.5 rounded-full bg-yourPart'
            }
          />
          {interrupted ? dict.audio.interrupted : dict.audio.ready}
        </p>
        {needsSilentSwitchHint ? (
          <p className="max-w-[22rem] text-[0.68rem] leading-snug text-ink-faint">
            {dict.audio.silentSwitch}
          </p>
        ) : null}
      </div>
    )
  }

  if (status === 'tidak-didukung' || status === 'gagal') {
    return (
      <p className="font-mono text-[0.68rem] text-cue-light" role="status">
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
