import type { ComponentChildren, VNode } from 'preact'
import { useContext, useMemo } from 'preact/hooks'
import { OrderingContext, OrderingItemContext } from './context.ts'
import type { OrderingItemContextValue } from './context.ts'

export interface OrderingItemProps {
  order: number
  children: ComponentChildren
  class?: string
}

export function Item({ order, children, class: className }: OrderingItemProps): VNode | null {
  const ctx = useContext(OrderingContext)
  if (!ctx) throw new Error('Ordering.Item must be used within Ordering.Root')

  // Register this item on first render (synchronous, before effects)
  const itemIndex = useMemo(() => ctx.registerItem(order), [])

  // Find current position of this item in the display order
  const position = ctx.currentOrder.indexOf(itemIndex)
  if (position === -1) return null

  const isCorrect = ctx.submitted ? ctx.items[itemIndex]?.order === position : null

  const itemCtx: OrderingItemContextValue = useMemo(() => ({
    itemIndex,
    order,
    position,
    correct: isCorrect,
    disabled: ctx.submitted,
    isFirst: position === 0,
    isLast: position === ctx.currentOrder.length - 1,
    moveUp: () => ctx.moveUp(position),
    moveDown: () => ctx.moveDown(position),
  }), [itemIndex, order, position, isCorrect, ctx.submitted, ctx.currentOrder.length, ctx.moveUp, ctx.moveDown])

  return (
    <OrderingItemContext.Provider value={itemCtx}>
      <div
        class={className}
        style={{ order: position }}
        data-correct={ctx.submitted ? String(isCorrect) : undefined}
      >
        {children}
      </div>
    </OrderingItemContext.Provider>
  )
}
