import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext, useRef } from 'preact/hooks'
import { MatchingContext } from './context.ts'

const DRAG_THRESHOLD = 8 // px of movement before touch becomes a drag

export interface MatchingResponseChipProps {
  response: string
  children?: ComponentChildren
  class?: string
}

export function ResponseChip({ response, children, class: className }: MatchingResponseChipProps): VNode {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.ResponseChip must be used within Matching.Root')

  const isDragging = ctx.draggedResponse === response
  const isSelected = ctx.selectedResponse === response

  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const touchElementRef = useRef<HTMLElement | null>(null)
  const touchDragStartedRef = useRef(false)

  const onDragStart = useCallback((e: DragEvent) => {
    if (ctx.submitted) return
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', response)
    ctx.onDragStartResponse(response)
  }, [response, ctx.submitted, ctx.onDragStartResponse])

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
      ctx.onDragStartResponse(response)
    }

    e.preventDefault()

    // Visual feedback
    if (touchElementRef.current) {
      touchElementRef.current.style.transform = `translate(${dx}px, ${dy}px)`
      touchElementRef.current.style.zIndex = '1000'
      touchElementRef.current.style.opacity = '0.8'
    }

    // Find drop slot under touch point
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
    if (el) {
      const slotEl = el.closest('[data-matching-slot]') as HTMLElement | null
      if (slotEl) {
        const pairIndex = Number(slotEl.dataset.matchingSlot)
        ctx.onDragOverPair(pairIndex)
      }
    }
  }, [response, ctx.onDragStartResponse, ctx.onDragOverPair])

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
      if (ctx.dropTargetPairIndex !== null) {
        ctx.onDropOnPair(ctx.dropTargetPairIndex)
      } else {
        ctx.onDragEnd()
      }
    }
    // If drag never started, let the click event handle it
    touchStartRef.current = null
    touchElementRef.current = null
    touchDragStartedRef.current = false
  }, [ctx.dropTargetPairIndex, ctx.onDropOnPair, ctx.onDragEnd])

  const onClick = useCallback(() => {
    if (ctx.submitted) return
    ctx.toggleSelectResponse(response)
  }, [response, ctx.submitted, ctx.toggleSelectResponse])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (ctx.submitted) return

    // Space/Enter: toggle selection (same as click)
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      ctx.toggleSelectResponse(response)
      return
    }

    // Number keys 1-9: assign directly to pair at that index
    const num = parseInt(e.key, 10)
    if (num >= 1 && num <= ctx.pairs.length) {
      e.preventDefault()
      ctx.assignResponse(num - 1, response)
    }
  }, [response, ctx.submitted, ctx.toggleSelectResponse, ctx.pairs.length, ctx.assignResponse])

  return (
    <div
      class={className}
      data-response={response}
      data-dragging={isDragging || undefined}
      data-selected={isSelected || undefined}
      aria-grabbed={isDragging}
      aria-label={`${response}. Klávesy 1–${ctx.pairs.length} pro přiřazení.`}
      role="listitem"
      tabIndex={0}
      draggable={!ctx.submitted}
      onKeyDown={onKeyDown}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={onClick}
    >
      {children ?? response}
    </div>
  )
}
