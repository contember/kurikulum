import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { AudioContext } from './context.ts'

export interface AudioTimeProps {
  class?: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Time({ class: className }: AudioTimeProps): VNode {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('Audio.Time must be used within Audio.Root')

  return (
    <span class={className} aria-live="off">
      {formatTime(ctx.currentTime)} / {formatTime(ctx.duration)}
    </span>
  )
}
