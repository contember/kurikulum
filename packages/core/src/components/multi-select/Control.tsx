import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { MultiSelectContext, MultiSelectItemContext } from './context.ts'

export interface MultiSelectControlProps {
  class?: string
}

export function Control({ class: className }: MultiSelectControlProps): VNode {
  const ctx = useContext(MultiSelectContext)
  const itemCtx = useContext(MultiSelectItemContext)
  if (!ctx) throw new Error('MultiSelect.Control must be used within MultiSelect.Root')
  if (!itemCtx) throw new Error('MultiSelect.Control must be used within MultiSelect.Item')

  return (
    <input
      type="checkbox"
      checked={itemCtx.selected}
      onChange={() => ctx.toggle(itemCtx.index)}
      disabled={itemCtx.disabled}
      aria-disabled={itemCtx.disabled}
      class={className}
    />
  )
}
