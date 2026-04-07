import type { ComponentChildren, VNode } from 'preact'
import { useContext, useCallback, useRef } from 'preact/hooks'
import { CategorySortContext } from './context.ts'

const DRAG_THRESHOLD = 8 // px of movement before touch becomes a drag

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
  const touchDragStartedRef = useRef(false)

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
    touchDragStartedRef.current = false
  }, [ctx.submitted])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y

    // Start drag only after exceeding threshold
    if (!touchDragStartedRef.current) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return
      touchDragStartedRef.current = true
      ctx.onDragStart(itemId)
    }

    e.preventDefault()

    // Visual feedback
    if (touchElementRef.current) {
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
  }, [itemId, ctx.onDragStart, ctx.onDragOverCategory])

  const onTouchEnd = useCallback((_e: TouchEvent) => {
    if (!touchStartRef.current) return
    // Reset visual state
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = ''
      touchElementRef.current.style.zIndex = ''
      touchElementRef.current.style.opacity = ''
    }
    if (touchDragStartedRef.current) {
      // Was a real drag — complete drop or cancel
      if (ctx.dropTargetCategoryId) {
        ctx.onDropOnCategory(ctx.dropTargetCategoryId)
      } else {
        ctx.onDragEnd()
      }
    }
    // If drag never started, let the click event handle it
    touchStartRef.current = null
    touchElementRef.current = null
    touchDragStartedRef.current = false
  }, [ctx.dropTargetCategoryId, ctx.onDropOnCategory, ctx.onDragEnd])

  const isSelected = ctx.selectedItemId === itemId

  const onClick = useCallback(() => {
    if (ctx.submitted) return
    ctx.toggleSelectItem(itemId)
  }, [itemId, ctx.submitted, ctx.toggleSelectItem])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (ctx.submitted) return

    // Space/Enter: toggle selection
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      ctx.toggleSelectItem(itemId)
      return
    }

    // Number keys 1-9 assign to category at that index
    const num = parseInt(e.key, 10)
    if (num >= 1 && num <= ctx.categories.length) {
      e.preventDefault()
      ctx.assign(itemId, ctx.categories[num - 1].id)
      return
    }

    // Backspace/Delete to unassign
    if ((e.key === 'Backspace' || e.key === 'Delete') && isAssigned) {
      e.preventDefault()
      ctx.unassign(itemId)
    }
  }, [itemId, ctx.submitted, ctx.toggleSelectItem, ctx.categories, ctx.assign, ctx.unassign, isAssigned])

  return (
    <div
      class={className}
      data-item={itemId}
      data-dragging={isDragging || undefined}
      data-selected={isSelected || undefined}
      data-assigned={isAssigned || undefined}
      data-correct={isCorrect !== null ? String(isCorrect) : undefined}
      aria-grabbed={isDragging}
      aria-label={`${item.label}${isAssigned && assignedCategory ? `, assigned to ${ctx.categories.find(c => c.id === assignedCategory)?.label ?? assignedCategory}` : ', unassigned'}. Use keys 1-${ctx.categories.length} to assign.`}
      role="listitem"
      tabIndex={0}
      draggable={!ctx.submitted}
      onClick={onClick}
      onKeyDown={onKeyDown}
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
