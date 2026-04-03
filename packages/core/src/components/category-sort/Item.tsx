import type { ComponentChildren, VNode } from 'preact'
import { useContext, useCallback, useRef } from 'preact/hooks'
import { CategorySortContext } from './context.ts'

export interface CategorySortItemProps {
  id: string
  children?: ComponentChildren
  class?: string
}

export function Item({ id: itemId, children, class: className }: CategorySortItemProps): VNode {
  const ctx = useContext(CategorySortContext)
  if (!ctx) throw new Error('CategorySort.Item must be used within CategorySort.Root')

  const item = ctx.items.find(i => i.id === itemId)
  if (!item) throw new Error(`Item "${itemId}" not found`)

  const isDragging = ctx.draggedItemId === itemId
  const isAssigned = ctx.assignments.has(itemId)
  const assignedCategory = ctx.assignments.get(itemId)
  const isCorrect = ctx.submitted && assignedCategory ? item.category === assignedCategory : null

  const touchStartRef = useRef<{ x: number, y: number } | null>(null)
  const touchElementRef = useRef<HTMLElement | null>(null)

  const onDragStart = useCallback((e: DragEvent) => {
    if (ctx.submitted) return
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', itemId)
    ctx.onDragStart(itemId)
  }, [itemId, ctx.submitted, ctx.onDragStart])

  const onDragEnd = useCallback((_e: DragEvent) => {
    ctx.onDragEnd()
  }, [ctx.onDragEnd])

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (ctx.submitted) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    touchElementRef.current = e.currentTarget as HTMLElement
    ctx.onDragStart(itemId)
  }, [itemId, ctx.submitted, ctx.onDragStart])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    e.preventDefault()
    const touch = e.touches[0]

    // Visual feedback
    if (touchElementRef.current) {
      const dx = touch.clientX - touchStartRef.current.x
      const dy = touch.clientY - touchStartRef.current.y
      touchElementRef.current.style.transform = `translate(${dx}px, ${dy}px)`
      touchElementRef.current.style.zIndex = '1000'
      touchElementRef.current.style.opacity = '0.8'
    }

    // Find category drop zone under touch point
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
    if (el) {
      const categoryEl = el.closest('[data-category]') as HTMLElement | null
      if (categoryEl) {
        const catId = categoryEl.getAttribute('data-category')
        if (catId) ctx.onDragOverCategory(catId)
      }
    }
  }, [ctx.onDragOverCategory])

  const onTouchEnd = useCallback((_e: TouchEvent) => {
    if (!touchStartRef.current) return
    // Reset visual state
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = ''
      touchElementRef.current.style.zIndex = ''
      touchElementRef.current.style.opacity = ''
    }
    if (ctx.dropTargetCategoryId) {
      ctx.onDropOnCategory(ctx.dropTargetCategoryId)
    } else {
      ctx.onDragEnd()
    }
    touchStartRef.current = null
    touchElementRef.current = null
  }, [ctx.dropTargetCategoryId, ctx.onDropOnCategory, ctx.onDragEnd])

  return (
    <div
      class={className}
      data-item={itemId}
      data-dragging={isDragging || undefined}
      data-assigned={isAssigned || undefined}
      data-correct={isCorrect !== null ? String(isCorrect) : undefined}
      aria-grabbed={isDragging}
      role="listitem"
      draggable={!ctx.submitted}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {children ?? item.label}
    </div>
  )
}
