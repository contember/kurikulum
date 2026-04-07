import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { Matching as M, MatchingContext } from '@kurikulum/core'
import type { MatchingSlotRenderProps } from '@kurikulum/core'
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
      <MatchingUI />
      <M.Submit class="mt-5 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
        Odeslat
      </M.Submit>
    </M.Root>
  )
}

export function MatchingPair({ prompt, response }: { prompt: string; response: string }): VNode {
  return <M.Pair prompt={prompt} response={response} />
}

function MatchingUI(): VNode | null {
  const ctx = useContext(MatchingContext)
  if (!ctx || ctx.pairs.length === 0) return null

  return (
    <div class="mt-3">
      {/* Prompt rows with drop slots */}
      <div class="space-y-3">
        {ctx.pairs.map((pair, idx) => (
          <div key={idx} class="flex items-center gap-3">
            <div class="min-w-[140px] shrink-0 font-medium text-text text-sm">
              {pair.prompt}
            </div>

            <svg class="w-4 h-4 text-text-muted shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 8h12M10 4l4 4-4 4" />
            </svg>

            <M.Slot
              pairIndex={idx}
              class="flex-1 min-h-[42px] rounded-lg border-2 border-dashed px-3 py-2 transition-all duration-150 flex items-center border-border/60 bg-bg-muted data-[drag-over]:border-primary data-[drag-over]:bg-primary/5 data-[has-selection]:border-border data-[has-selection]:bg-surface data-[has-selected-response]:border-primary/30 data-[has-selected-response]:cursor-pointer data-[has-selected-response]:hover:border-primary/60 data-[correct=true]:border-success/40 data-[correct=true]:bg-success/5 data-[correct=false]:border-danger/40 data-[correct=false]:bg-danger/5"
            >
              {({ selection, isCorrect, hasSelectedResponse }: MatchingSlotRenderProps) =>
                selection ? (
                  <PlacedChip pairIndex={idx} selection={selection} isCorrect={isCorrect} />
                ) : (
                  <span class="text-sm text-text-muted select-none">
                    {hasSelectedResponse ? 'Klikněte pro přiřazení' : 'Přetáhněte odpověď…'}
                  </span>
                )
              }
            </M.Slot>
          </div>
        ))}
      </div>

      {/* Response chip pool */}
      {ctx.unplacedResponses.length > 0 && !ctx.submitted && (
        <div class="mt-4 pt-4 border-t border-border/50">
          <div class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">Odpovědi</div>
          <div class="flex flex-wrap gap-2" role="list">
            {ctx.unplacedResponses.map(response => (
              <M.ResponseChip
                key={response}
                response={response}
                class="px-3.5 py-2 rounded-lg text-sm font-medium border transition-all duration-150 select-none border-border bg-surface text-text cursor-grab hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm active:cursor-grabbing data-[dragging]:opacity-40 data-[dragging]:border-primary/30 data-[dragging]:bg-primary/5 data-[dragging]:text-primary data-[selected]:border-primary data-[selected]:bg-primary/10 data-[selected]:text-primary data-[selected]:ring-2 data-[selected]:ring-primary/20"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlacedChip({ pairIndex, selection, isCorrect }: { pairIndex: number; selection: string; isCorrect: boolean | null }): VNode {
  const ctx = useContext(MatchingContext)!

  return (
    <span
      class={[
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium transition-colors',
        ctx.submitted
          ? isCorrect
            ? 'bg-success/10 text-success'
            : 'bg-danger/10 text-danger'
          : 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20',
      ].join(' ')}
      onClick={(e) => {
        e.stopPropagation()
        if (!ctx.submitted) ctx.unassign(pairIndex)
      }}
    >
      {selection}
      {!ctx.submitted && <CrossIcon class="w-3.5 h-3.5 opacity-60" />}
      {ctx.submitted && isCorrect && <CheckIcon class="w-3.5 h-3.5" />}
      {ctx.submitted && isCorrect === false && <CrossIcon class="w-3.5 h-3.5" />}
    </span>
  )
}
