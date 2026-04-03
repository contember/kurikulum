import type { ComponentChildren, VNode } from 'preact'
import { toChildArray } from 'preact'
import { useContext } from 'preact/hooks'
import { Ordering as O, OrderingItemContext } from '@kurikulum/core'

export interface OrderingProps {
  id: string
  question: string
  weight?: number
  dragEnabled?: boolean
  children?: ComponentChildren
}

export function Ordering({ id, question, weight, dragEnabled, children }: OrderingProps): VNode {
  const allChildren = toChildArray(children)
  const items = allChildren.filter(c => typeof c === 'object' && c !== null && (c as any).type === OrderingItem)
  const rest = allChildren.filter(c => !items.includes(c))

  return (
    <O.Root id={id} weight={weight} dragEnabled={dragEnabled} aria-label={question}>
      <O.Label class="font-semibold mb-2">{question}</O.Label>
      <O.List class="space-y-2 mt-2">
        {items}
      </O.List>
      {rest}
      <O.Submit class="mt-3 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Odeslat
      </O.Submit>
    </O.Root>
  )
}

export interface OrderingItemProps {
  order: number
  children?: ComponentChildren
}

export function OrderingItem({ order, children }: OrderingItemProps): VNode {
  return (
    <O.Item order={order} class="flex items-center gap-2 p-3 border border-border rounded-default bg-surface transition-all duration-150 data-[dragging]:opacity-50 data-[drag-over]:border-primary data-[drag-over]:border-2 cursor-grab data-[dragging]:cursor-grabbing">
      <ItemControls />
      <span class="flex-1 select-none">{children}</span>
    </O.Item>
  )
}

const btnClass = "px-2 py-1 text-sm border border-border rounded-default bg-surface hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"

function ItemControls(): VNode | null {
  const itemCtx = useContext(OrderingItemContext)
  if (!itemCtx) return null

  return (
    <div class="flex flex-col gap-1">
      <button
        type="button"
        onClick={itemCtx.moveUp}
        disabled={itemCtx.disabled || itemCtx.isFirst}
        aria-disabled={itemCtx.disabled || itemCtx.isFirst}
        aria-label="Move up"
        class={btnClass}
      >
        ▲
      </button>
      <button
        type="button"
        onClick={itemCtx.moveDown}
        disabled={itemCtx.disabled || itemCtx.isLast}
        aria-disabled={itemCtx.disabled || itemCtx.isLast}
        aria-label="Move down"
        class={btnClass}
      >
        ▼
      </button>
    </div>
  )
}
