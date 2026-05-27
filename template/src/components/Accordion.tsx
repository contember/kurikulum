import type { ComponentChildren, VNode } from 'preact'
import { ChevronIcon } from './Icons.tsx'

export interface AccordionProps {
  children?: ComponentChildren
}

/**
 * Stacked, expandable sections. Wrap one or more `<AccordionItem>` children.
 * Built on native `<details>`/`<summary>` so it stays keyboard- and
 * screen-reader-accessible without extra wiring. Pure presentation — does not
 * participate in page completion.
 */
export function Accordion({ children }: AccordionProps): VNode {
  return <div class="my-4 divide-y divide-border overflow-hidden rounded-lg border border-border">{children}</div>
}

export interface AccordionItemProps {
  title: string
  /** Render the section expanded on first paint. */
  open?: boolean
  children?: ComponentChildren
}

export function AccordionItem({ title, open = false, children }: AccordionItemProps): VNode {
  return (
    <details open={open} class="group">
      <summary class="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium text-text marker:hidden hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronIcon class="h-4 w-4 shrink-0 text-text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div class="prose prose-sm max-w-none px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}
