import type { VNode } from 'preact'
import { h } from 'preact'

export interface ImageProps {
  src: string
  alt: string
  caption?: string
}

export function Image({ src, alt, caption }: ImageProps): VNode {
  return h('figure', { class: 'my-4' },
    h('img', {
      src,
      alt,
      class: 'max-w-full h-auto',
    }),
    caption ? h('figcaption', { class: 'mt-2 text-sm text-text-secondary' }, caption) : null,
  )
}
