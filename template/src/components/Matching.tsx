import type { ComponentChildren, VNode } from 'preact'
import { useContext, useState, useRef, useCallback } from 'preact/hooks'
import { Matching as M, MatchingContext } from '@kurikulum/core'
import { CheckIcon, CrossIcon } from './Icons.tsx'

export interface MatchingProps {
  id: string
  question: string
  weight?: number
  children?: ComponentChildren
}

export function Matching({ id, question, weight, children }: MatchingProps): VNode {
  return (
    <M.Root id={id} weight={weight} aria-label={question}>
      <M.Label class="text-base font-semibold text-text mb-4">{question}</M.Label>
      {/* Pair registrations (hidden — only used for state management) */}
      <div class="hidden">{children}</div>
      <MatchingDnDUI />
      <M.Submit class="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
        Odeslat
      </M.Submit>
    </M.Root>
  )
}

// Still exported for declaring pairs — rendering is handled by MatchingDnDUI
export function MatchingPair({ prompt, response }: { prompt: string; response: string }): VNode {
  return <M.Pair prompt={prompt} response={response} />
}

function MatchingDnDUI(): VNode | null {
  const ctx = useContext(MatchingContext)
  if (!ctx || ctx.pairs.length === 0) return null

  const [draggedResponse, setDraggedResponse] = useState<string | null>(null)
  const [dropTargetPair, setDropTargetPair] = useState<number | null>(null)
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)

  // Touch DnD state
  const touchItemRef = useRef<string | null>(null)
  const touchCloneRef = useRef<HTMLElement | null>(null)
  const touchStartPos = useRef({ x: 0, y: 0 })

  // Which responses are already placed
  const placedResponses = new Set(ctx.selections.values())
  const unplacedResponses = ctx.responses.filter(r => !placedResponses.has(r))

  // --- HTML5 DnD handlers ---
  const onDragStart = useCallback((e: DragEvent, response: string) => {
    e.dataTransfer!.effectAllowed = 'move'
    e.dataTransfer!.setData('text/plain', response)
    setDraggedResponse(response)
  }, [])

  const onDragEnd = useCallback(() => {
    setDraggedResponse(null)
    setDropTargetPair(null)
  }, [])

  const onDragOverSlot = useCallback((e: DragEvent, pairIndex: number) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'move'
    setDropTargetPair(pairIndex)
  }, [])

  const onDragLeaveSlot = useCallback((e: DragEvent, pairIndex: number) => {
    const related = e.relatedTarget as HTMLElement | null
    const current = e.currentTarget as HTMLElement
    if (related && current.contains(related)) return
    setDropTargetPair(prev => prev === pairIndex ? null : prev)
  }, [])

  const onDropOnSlot = useCallback((e: DragEvent, pairIndex: number) => {
    e.preventDefault()
    const response = e.dataTransfer!.getData('text/plain')
    if (response) {
      // If this response was assigned to another pair, clear that
      for (const [idx, sel] of ctx.selections.entries()) {
        if (sel === response && idx !== pairIndex) {
          ctx.select(idx, '')
        }
      }
      ctx.select(pairIndex, response)
    }
    setDraggedResponse(null)
    setDropTargetPair(null)
  }, [ctx])

  // --- Touch handlers ---
  const onTouchStart = useCallback((e: TouchEvent, response: string) => {
    if (ctx.submitted) return
    const touch = e.touches[0]
    touchItemRef.current = response
    touchStartPos.current = { x: touch.clientX, y: touch.clientY }

    // Create visual clone
    const target = e.currentTarget as HTMLElement
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.left = `${touch.clientX - target.offsetWidth / 2}px`
    clone.style.top = `${touch.clientY - target.offsetHeight / 2}px`
    clone.style.zIndex = '1000'
    clone.style.opacity = '0.9'
    clone.style.pointerEvents = 'none'
    clone.style.transform = 'scale(1.05)'
    clone.style.transition = 'none'
    document.body.appendChild(clone)
    touchCloneRef.current = clone
  }, [ctx.submitted])

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchItemRef.current || !touchCloneRef.current) return
    e.preventDefault()
    const touch = e.touches[0]
    const clone = touchCloneRef.current
    clone.style.left = `${touch.clientX - clone.offsetWidth / 2}px`
    clone.style.top = `${touch.clientY - clone.offsetHeight / 2}px`

    // Find drop target
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
    const slot = el?.closest('[data-matching-slot]') as HTMLElement | null
    if (slot) {
      setDropTargetPair(Number(slot.dataset.matchingSlot))
    } else {
      setDropTargetPair(null)
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchItemRef.current && dropTargetPair !== null) {
      const response = touchItemRef.current
      for (const [idx, sel] of ctx.selections.entries()) {
        if (sel === response && idx !== dropTargetPair) {
          ctx.select(idx, '')
        }
      }
      ctx.select(dropTargetPair, response)
    }
    touchItemRef.current = null
    setDropTargetPair(null)
    if (touchCloneRef.current) {
      document.body.removeChild(touchCloneRef.current)
      touchCloneRef.current = null
    }
  }, [ctx, dropTargetPair])

  // --- Click-to-assign (mobile fallback) ---
  const onClickResponse = useCallback((response: string) => {
    if (ctx.submitted) return
    setSelectedResponse(prev => prev === response ? null : response)
  }, [ctx.submitted])

  const onClickSlot = useCallback((pairIndex: number) => {
    if (ctx.submitted || !selectedResponse) return
    // If already placed elsewhere, clear
    for (const [idx, sel] of ctx.selections.entries()) {
      if (sel === selectedResponse && idx !== pairIndex) {
        ctx.select(idx, '')
      }
    }
    ctx.select(pairIndex, selectedResponse)
    setSelectedResponse(null)
  }, [ctx, selectedResponse])

  // Click placed chip to unassign
  const onClickPlaced = useCallback((pairIndex: number) => {
    if (ctx.submitted) return
    ctx.select(pairIndex, '')
  }, [ctx])

  return (
    <div class="mt-3">
      {/* Prompt rows with drop slots */}
      <div class="space-y-3">
        {ctx.pairs.map((pair, idx) => {
          const selection = ctx.selections.get(idx) ?? null
          const isDropTarget = dropTargetPair === idx
          const isCorrect = ctx.submitted ? selection === pair.response : null

          return (
            <div
              key={idx}
              class="flex items-center gap-3"
            >
              {/* Prompt label */}
              <div class="min-w-[140px] shrink-0 font-medium text-text text-sm">
                {pair.prompt}
              </div>

              {/* Arrow */}
              <svg class="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M2 8h12M10 4l4 4-4 4" />
              </svg>

              {/* Drop slot */}
              <div
                data-matching-slot={idx}
                class={[
                  'flex-1 min-h-[42px] rounded-lg border-2 border-dashed px-3 py-2 transition-all duration-150 flex items-center',
                  isDropTarget && !ctx.submitted
                    ? 'border-primary bg-primary/5'
                    : selection
                      ? ctx.submitted
                        ? isCorrect
                          ? 'border-success/40 bg-success/5'
                          : 'border-danger/40 bg-danger/5'
                        : 'border-border bg-surface'
                      : selectedResponse
                        ? 'border-primary/30 bg-bg-muted cursor-pointer hover:border-primary/60'
                        : 'border-border/60 bg-bg-muted',
                ].filter(Boolean).join(' ')}
                onDragOver={(e: DragEvent) => onDragOverSlot(e, idx)}
                onDragLeave={(e: DragEvent) => onDragLeaveSlot(e, idx)}
                onDrop={(e: DragEvent) => onDropOnSlot(e, idx)}
                onClick={() => onClickSlot(idx)}
              >
                {selection ? (
                  <span
                    class={[
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors',
                      ctx.submitted
                        ? isCorrect
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                        : 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20',
                    ].join(' ')}
                    onClick={(e) => { e.stopPropagation(); onClickPlaced(idx) }}
                  >
                    {selection}
                    {!ctx.submitted && (
                      <CrossIcon class="w-3.5 h-3.5 opacity-60" />
                    )}
                    {ctx.submitted && isCorrect && (
                      <CheckIcon class="w-3.5 h-3.5" />
                    )}
                    {ctx.submitted && !isCorrect && (
                      <CrossIcon class="w-3.5 h-3.5" />
                    )}
                  </span>
                ) : (
                  <span class="text-sm text-text-muted select-none">
                    {selectedResponse ? 'Klikněte pro přiřazení' : 'Přetáhněte odpověď…'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Response chip pool */}
      {unplacedResponses.length > 0 && !ctx.submitted && (
        <div class="mt-4 pt-4 border-t border-border/50">
          <div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Odpovědi</div>
          <div class="flex flex-wrap gap-2">
            {unplacedResponses.map(response => (
              <div
                key={response}
                draggable={!ctx.submitted}
                onDragStart={(e: DragEvent) => onDragStart(e, response)}
                onDragEnd={onDragEnd}
                onTouchStart={(e: TouchEvent) => onTouchStart(e, response)}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => onClickResponse(response)}
                class={[
                  'px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-150 select-none',
                  draggedResponse === response
                    ? 'opacity-40 border-primary/30 bg-primary/5 text-primary'
                    : selectedResponse === response
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-surface text-text cursor-grab hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:cursor-grabbing',
                ].join(' ')}
              >
                {response}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
