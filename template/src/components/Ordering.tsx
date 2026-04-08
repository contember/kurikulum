import { Ordering as O, OrderingContext, OrderingItemContext } from '@kurikulum/core'
import type { ComponentChildren, VNode } from 'preact'
import { toChildArray } from 'preact'
import { useContext } from 'preact/hooks'
import { CheckIcon, CrossIcon } from './Icons.tsx'

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
      <O.Label class="text-base font-semibold text-text mb-4">{question}</O.Label>
      <O.List class="gap-2 mt-2">
        {items}
      </O.List>
      {rest}
      <O.Submit class="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
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
    <O.Item
      order={order}
      class="relative flex items-center gap-3 px-3 py-3 border border-border rounded-lg bg-surface shadow-sm transition-all duration-150 data-[dragging]:opacity-40 data-[dragging]:shadow-none cursor-grab data-[dragging]:cursor-grabbing hover:shadow-md data-[correct=true]:border-success/40 data-[correct=true]:bg-success/5 data-[correct=false]:border-danger/40 data-[correct=false]:bg-danger/5"
    >
      <DropIndicator />
      <ItemControls />
      <span class="flex-1 select-none text-sm">{children}</span>
      <ItemCorrectIcon />
    </O.Item>
  )
}

function DropIndicator(): VNode | null {
  const ctx = useContext(OrderingContext)
  const itemCtx = useContext(OrderingItemContext)
  if (!ctx || !itemCtx?.isDragOver || ctx.draggedPosition === null) return null

  // Line goes below the item when dragging downward, above when dragging upward
  const isBelow = ctx.draggedPosition < itemCtx.position

  return (
    <div
      class={`absolute left-2 right-2 h-0.5 bg-primary rounded-full z-10 pointer-events-none ${isBelow ? '-bottom-[5px]' : '-top-[5px]'}`}
      aria-hidden="true"
    >
      <div class="absolute -left-1.5 -top-[3px] w-2 h-2 rounded-full bg-primary" />
      <div class="absolute -right-1.5 -top-[3px] w-2 h-2 rounded-full bg-primary" />
    </div>
  )
}

function ItemCorrectIcon(): VNode | null {
  const itemCtx = useContext(OrderingItemContext)
  if (!itemCtx || itemCtx.correct === null) return null

  return itemCtx.correct
    ? <CheckIcon class="w-5 h-5 text-success shrink-0" />
    : <CrossIcon class="w-5 h-5 text-danger shrink-0" />
}

function ItemControls(): VNode | null {
  const itemCtx = useContext(OrderingItemContext)
  if (!itemCtx) return null

  return (
    <div class="flex items-center gap-2">
      {/* Grip handle */}
      <div class="text-text-muted" aria-hidden="true">
        <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.2" />
          <circle cx="11" cy="3" r="1.2" />
          <circle cx="5" cy="8" r="1.2" />
          <circle cx="11" cy="8" r="1.2" />
          <circle cx="5" cy="13" r="1.2" />
          <circle cx="11" cy="13" r="1.2" />
        </svg>
      </div>

      {/* Up/Down buttons */}
      <div class="flex flex-col -space-y-px">
        <button
          type="button"
          onClick={itemCtx.moveUp}
          disabled={itemCtx.disabled || itemCtx.isFirst}
          aria-disabled={itemCtx.disabled || itemCtx.isFirst}
          aria-label="Move up"
          class="w-6 h-5 flex items-center justify-center rounded-t border border-border bg-surface text-text-muted hover:bg-bg-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 8l4-4 4 4" />
          </svg>
        </button>
        <button
          type="button"
          onClick={itemCtx.moveDown}
          disabled={itemCtx.disabled || itemCtx.isLast}
          aria-disabled={itemCtx.disabled || itemCtx.isLast}
          aria-label="Move down"
          class="w-6 h-5 flex items-center justify-center rounded-b border border-border bg-surface text-text-muted hover:bg-bg-muted hover:text-text disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-colors"
        >
          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 4l4 4 4-4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
