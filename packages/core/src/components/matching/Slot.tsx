import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext } from 'preact/hooks'
import { MatchingContext } from './context.ts'

export interface MatchingSlotProps {
  pairIndex: number
  children?: ComponentChildren
  class?: string
}

export interface MatchingSlotRenderProps {
  selection: string | null
  isDragOver: boolean
  isCorrect: boolean | null
  hasSelectedResponse: boolean
}

export function Slot({ pairIndex, children, class: className }: MatchingSlotProps): VNode {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.Slot must be used within Matching.Root')

  const selection = ctx.selections.get(pairIndex) ?? null
  const isDragOver = ctx.dropTargetPairIndex === pairIndex && ctx.draggedResponse !== null
  const isCorrect = ctx.submitted ? selection === ctx.pairs[pairIndex]?.response : null

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    ctx.onDragOverPair(pairIndex)
  }, [pairIndex, ctx.onDragOverPair])

  const onDragLeave = useCallback((e: DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    if (related && current.contains(related)) return
    if (ctx.dropTargetPairIndex === pairIndex) {
      ctx.onDragEnd()
    }
  }, [pairIndex, ctx.dropTargetPairIndex, ctx.onDragEnd])

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    ctx.onDropOnPair(pairIndex)
  }, [pairIndex, ctx.onDropOnPair])

  const onClick = useCallback(() => {
    if (ctx.submitted) return
    if (ctx.selectedResponse) {
      ctx.assignSelectedToPair(pairIndex)
    }
  }, [pairIndex, ctx.submitted, ctx.selectedResponse, ctx.assignSelectedToPair])

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (ctx.submitted) return

    // Enter/Space: assign selected response to this slot
    if ((e.key === 'Enter' || e.key === ' ') && ctx.selectedResponse) {
      e.preventDefault()
      ctx.assignSelectedToPair(pairIndex)
      return
    }

    // Backspace/Delete: unassign this slot
    if ((e.key === 'Backspace' || e.key === 'Delete') && selection) {
      e.preventDefault()
      ctx.unassign(pairIndex)
    }
  }, [pairIndex, ctx.submitted, ctx.selectedResponse, ctx.assignSelectedToPair, selection, ctx.unassign])

  const pair = ctx.pairs[pairIndex]
  const prompt = pair?.prompt ?? `pair ${pairIndex}`
  const stateDesc = selection
    ? `přiřazeno: ${selection}${ctx.submitted && isCorrect !== null ? (isCorrect ? ' (správně)' : ' (špatně)') : '. Delete pro odebrání.'}`
    : ctx.selectedResponse
    ? `Enter pro přiřazení "${ctx.selectedResponse}"`
    : 'prázdné'

  const renderProps: MatchingSlotRenderProps = {
    selection,
    isDragOver,
    isCorrect,
    hasSelectedResponse: ctx.selectedResponse !== null,
  }

  return (
    <div
      class={className}
      data-matching-slot={pairIndex}
      data-drag-over={isDragOver || undefined}
      data-has-selection={selection ? true : undefined}
      data-correct={ctx.submitted && isCorrect !== null ? String(isCorrect) : undefined}
      data-has-selected-response={ctx.selectedResponse !== null || undefined}
      aria-dropeffect={ctx.draggedResponse !== null ? 'move' : undefined}
      aria-label={`${prompt}: ${stateDesc}`}
      role="group"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
    >
      {typeof children === 'function'
        ? (children as (props: MatchingSlotRenderProps) => ComponentChildren)(renderProps)
        : children}
    </div>
  )
}
