import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { AudioContext } from './context.ts'

export interface AudioPlayProps {
  class?: string
  children?: ComponentChildren | ((playing: boolean) => ComponentChildren)
}

export function Play({ class: className, children }: AudioPlayProps): VNode {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('Audio.Play must be used within Audio.Root')

  const label = ctx.playing ? 'Pause' : 'Play'

  return (
    <button
      type="button"
      class={className}
      onClick={ctx.toggle}
      aria-label={label}
    >
      {typeof children === 'function' ? children(ctx.playing) : children ?? label}
    </button>
  )
}
