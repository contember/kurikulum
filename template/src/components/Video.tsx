import type { VNode } from 'preact'

export interface VideoProps {
  src: string
  poster?: string
  caption?: string
}

export function Video({ src, poster, caption }: VideoProps): VNode {
  return (
    <figure class="my-4">
      <video src={src} controls poster={poster} class="max-w-full" />
      {caption ? <figcaption class="mt-2 text-sm text-text-secondary">{caption}</figcaption> : null}
    </figure>
  )
}
