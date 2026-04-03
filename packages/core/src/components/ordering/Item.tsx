import type { ComponentChildren, VNode } from 'preact'
import { useContext, useMemo, useRef, useCallback } from 'preact/hooks'
import { OrderingContext, OrderingItemContext } from './context.ts'
import type { OrderingItemContextValue } from './context.ts'

export interface OrderingItemProps {
  order: number
  children?: ComponentChildren
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

  // Touch DnD state
  const touchStartY = useRef<number | null>(null)
  const touchItemHeight = useRef<number>(0)
  const touchElementRef = useRef<HTMLDivElement | null>(null)

  const onDragStartHandler = useCallback((e: DragEvent) => {
    if (ctx.submitted || !ctx.dragEnabled) return
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', String(position))
    ctx.onDragStart(position)
  }, [position, ctx.submitted, ctx.dragEnabled, ctx.onDragStart])

  const onDragOverHandler = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    ctx.onDragOver(position)
  }, [position, ctx.onDragOver])

  const onDragEnterHandler = useCallback((e: DragEvent) => {
    e.preventDefault()
    ctx.onDragOver(position)
  }, [position, ctx.onDragOver])

  const onDragLeaveHandler = useCallback((_e: DragEvent) => {
    // Handled by parent or next dragenter
  }, [])

  const onDragEndHandler = useCallback((_e: DragEvent) => {
    ctx.onDragEnd()
  }, [ctx.onDragEnd])

  const onDropHandler = useCallback((e: DragEvent) => {
    e.preventDefault()
    ctx.onDrop(position)
  }, [position, ctx.onDrop])

  const onTouchStartHandler = useCallback((e: TouchEvent) => {
    if (ctx.submitted || !ctx.dragEnabled) return
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    const el = (e.currentTarget as HTMLElement)
    touchElementRef.current = el as HTMLDivElement
    touchItemHeight.current = el.getBoundingClientRect().height + 8 // include gap
    ctx.onDragStart(position)
  }, [position, ctx.submitted, ctx.dragEnabled, ctx.onDragStart])

  const onTouchMoveHandler = useCallback((e: TouchEvent) => {
    if (touchStartY.current === null) return
    e.preventDefault()
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStartY.current
    const positionDelta = Math.round(deltaY / touchItemHeight.current)
    const newPosition = Math.max(0, Math.min(ctx.currentOrder.length - 1, position + positionDelta))
    ctx.onDragOver(newPosition)

    // Visual feedback: translate the element
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = `translateY(${deltaY}px)`
      touchElementRef.current.style.zIndex = '1000'
      touchElementRef.current.style.opacity = '0.8'
    }
  }, [position, ctx.currentOrder.length, ctx.onDragOver])

  const onTouchEndHandler = useCallback((_e: TouchEvent) => {
    if (touchStartY.current === null) return
    // Reset visual state
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = ''
      touchElementRef.current.style.zIndex = ''
      touchElementRef.current.style.opacity = ''
    }
    if (ctx.dropTargetPosition !== null && ctx.dropTargetPosition !== position) {
      ctx.onDrop(ctx.dropTargetPosition)
    } else {
      ctx.onDragEnd()
    }
    touchStartY.current = null
    touchElementRef.current = null
  }, [position, ctx.dropTargetPosition, ctx.onDrop, ctx.onDragEnd])

  const isDragging = ctx.draggedPosition === position
  const isDragOver = ctx.dropTargetPosition === position && ctx.draggedPosition !== position

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
    dragEnabled: ctx.dragEnabled,
    isDragging,
    isDragOver,
    dragHandlers: {
      draggable: ctx.dragEnabled,
      onDragStart: onDragStartHandler,
      onDragOver: onDragOverHandler,
      onDragEnd: onDragEndHandler,
      onDrop: onDropHandler,
      onDragEnter: onDragEnterHandler,
      onDragLeave: onDragLeaveHandler,
      onTouchStart: onTouchStartHandler,
      onTouchMove: onTouchMoveHandler,
      onTouchEnd: onTouchEndHandler,
    },
  }), [itemIndex, order, position, isCorrect, ctx.submitted, ctx.currentOrder.length, ctx.moveUp, ctx.moveDown, ctx.dragEnabled, isDragging, isDragOver, onDragStartHandler, onDragOverHandler, onDragEndHandler, onDropHandler, onDragEnterHandler, onDragLeaveHandler, onTouchStartHandler, onTouchMoveHandler, onTouchEndHandler])

  return (
    <OrderingItemContext.Provider value={itemCtx}>
      <div
        class={className}
        style={{ order: position }}
        data-correct={ctx.submitted ? String(isCorrect) : undefined}
        data-dragging={isDragging || undefined}
        data-drag-over={isDragOver || undefined}
        aria-grabbed={ctx.dragEnabled ? isDragging : undefined}
        aria-dropeffect={ctx.dragEnabled && ctx.draggedPosition !== null && !isDragging ? 'move' : undefined}
        role="listitem"
        draggable={ctx.dragEnabled}
        onDragStart={onDragStartHandler}
        onDragOver={onDragOverHandler}
        onDragEnd={onDragEndHandler}
        onDrop={onDropHandler}
        onDragEnter={onDragEnterHandler}
        onDragLeave={onDragLeaveHandler}
        onTouchStart={onTouchStartHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
      >
        {children}
      </div>
    </OrderingItemContext.Provider>
  )
}
