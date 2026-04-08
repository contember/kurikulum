import { Audio } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'

export interface AudioPlayerProps {
  src: string
  autoplay?: boolean
  completeOnEnd?: boolean
  id?: string
  children?: ComponentChildren
}

export function AudioPlayer({ src, autoplay, completeOnEnd, id, children }: AudioPlayerProps): VNode {
  return (
    <Audio.Root
      src={src}
      autoplay={autoplay}
      completeOnEnd={completeOnEnd}
      id={id}
      class="my-4 flex items-center gap-3 rounded-default bg-surface p-3"
    >
      {children ?? (
        <>
          <Audio.Play class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            {(playing: boolean) => <span aria-hidden="true">{playing ? '⏸' : '▶'}</span>}
          </Audio.Play>
          <Audio.Progress class="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-border accent-primary" />
          <Audio.Time class="text-sm tabular-nums text-text-secondary" />
          <Audio.Volume class="h-2 w-20 cursor-pointer appearance-none rounded-full bg-border accent-primary" />
        </>
      )}
    </Audio.Root>
  )
}
