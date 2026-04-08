import { MCQ, MCQContext, MultiSelect, MultiSelectContext } from '@kurikulum/core'
import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'

export interface OptionProps {
  correct?: boolean
  children?: ComponentChildren
}

export function Option({ correct, children }: OptionProps): VNode {
  const msCtx = useContext(MultiSelectContext)
  const mcqCtx = useContext(MCQContext)

  if (msCtx) {
    return (
      <MultiSelect.Item correct={correct} class="flex items-center gap-2 py-1">
        <MultiSelect.Control class="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
        <MultiSelect.ItemLabel>{children}</MultiSelect.ItemLabel>
      </MultiSelect.Item>
    )
  }

  if (mcqCtx) {
    return (
      <MCQ.Item correct={correct} class="flex items-center gap-2 py-1">
        <MCQ.Control class="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" />
        <MCQ.ItemLabel>{children}</MCQ.ItemLabel>
      </MCQ.Item>
    )
  }

  // Fallback when rendered outside question context (e.g. standalone test)
  return <span>{children}</span>
}
