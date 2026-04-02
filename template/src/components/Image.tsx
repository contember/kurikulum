import type { VNode } from 'preact'

export interface ImageProps {
  src: string
  alt: string
  caption?: string
}

export function Image({ src, alt, caption }: ImageProps): VNode {
  return (
    <figure class="my-4">
      <img src={src} alt={alt} class="max-w-full h-auto" />
      {caption ? <figcaption class="mt-2 text-sm text-text-secondary">{caption}</figcaption> : null}
    </figure>
  )
}
