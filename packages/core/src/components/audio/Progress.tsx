import type { VNode } from 'preact'
import { useContext, useCallback } from 'preact/hooks'
import { AudioContext } from './context.ts'

export interface AudioProgressProps {
  class?: string
}

export function Progress({ class: className }: AudioProgressProps): VNode {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('Audio.Progress must be used within Audio.Root')

  const handleInput = useCallback((e: Event) => {
    const value = Number((e.target as HTMLInputElement).value)
    ctx.seek(value)
  }, [ctx])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const step = 5
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      ctx.seek(Math.max(0, ctx.currentTime - step))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      ctx.seek(Math.min(ctx.duration, ctx.currentTime + step))
    }
  }, [ctx])

  return (
    <input
      type="range"
      class={className}
      min={0}
      max={ctx.duration || 0}
      step={0.1}
      value={ctx.currentTime}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={ctx.duration || 0}
      aria-valuenow={ctx.currentTime}
      aria-valuetext={formatTime(ctx.currentTime)}
    />
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}
