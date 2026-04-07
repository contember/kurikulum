import type { VNode } from 'preact'

export function CheckIcon({ class: className }: { class?: string }): VNode {
  return (
    <svg class={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.485 3.929a.75.75 0 0 1 .086 1.056l-6 7a.75.75 0 0 1-1.1.043l-3-3a.75.75 0 1 1 1.06-1.06l2.419 2.418 5.48-6.371a.75.75 0 0 1 1.055-.086z" />
    </svg>
  )
}

export function CrossIcon({ class: className }: { class?: string }): VNode {
  return (
    <svg class={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  )
}
