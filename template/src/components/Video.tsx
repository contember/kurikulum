import type { VNode } from 'preact'
import { h } from 'preact'

export interface VideoProps {
  src: string
  poster?: string
  caption?: string
}

export function Video({ src, poster, caption }: VideoProps): VNode {
  return h('figure', { class: 'my-4' },
    h('video', {
      src,
      controls: true,
      poster,
      class: 'max-w-full',
    }),
    caption ? h('figcaption', { class: 'mt-2 text-sm text-gray-600' }, caption) : null,
  )
}
