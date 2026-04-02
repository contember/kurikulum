import type { ComponentChildren, VNode } from 'preact'

export interface OptionProps {
  correct?: boolean
  children: ComponentChildren
}

/**
 * Declarative option marker for MCQ/MultiSelect.
 * Rendering is handled by the parent question component.
 */
export function Option({ children }: OptionProps): VNode {
  return <span>{children}</span>
}
