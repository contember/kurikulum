import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'

export interface OptionProps {
  correct?: boolean
  children: ComponentChildren
}

/**
 * Declarative option marker for MCQ/MultiSelect.
 * Rendering is handled by the parent question component.
 */
export function Option({ children }: OptionProps): VNode {
  return h('span', null, children)
}
