'use client'

import { useAudio } from './AudioProvider'
import type { Dictionary } from '@/lib/i18n'

/**
 * The explicit start control. iOS will not start an AudioContext outside a user
 * gesture, so there is no autostart path anywhere in the app (invariant 13).
 */
export function StartAudio({ dict }: { dict: Dictionary }) {
  const { status, start } = useAudio()

  if (status === 'siap') {
    return (
      <p className="font-mono text-xs text-yourPart" role="status">
        ● {dict.audio.ready}
      </p>
    )
  }

  if (status === 'tidak-didukung' || status === 'gagal') {
    return (
      <p className="font-mono text-xs text-cue" role="status">
        {dict.audio.failed}
      </p>
    )
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void start()}
        disabled={status === 'menyalakan'}
        className="rounded-full border border-bamboo/60 bg-bamboo/10 px-4 py-1.5 text-sm text-sounding transition hover:bg-bamboo/20 disabled:opacity-50"
      >
        {status === 'menyalakan' ? dict.audio.starting : dict.audio.start}
      </button>
      <p className="max-w-xs text-xs text-bamboo/60">{dict.audio.hint}</p>
    </div>
  )
}
