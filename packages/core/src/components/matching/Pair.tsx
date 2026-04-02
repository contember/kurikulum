import type { ComponentChildren, VNode } from 'preact'
import { useContext, useMemo } from 'preact/hooks'
import { MatchingContext, MatchingPairContext } from './context.ts'
import type { MatchingPairContextValue } from './context.ts'

export interface MatchingPairProps {
  prompt: string
  response: string
  children?: ComponentChildren
  class?: string
}

export function Pair({ prompt, response, children, class: className }: MatchingPairProps): VNode {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.Pair must be used within Matching.Root')

  // Register this pair on first render (synchronous, before effects)
  const pairIndex = useMemo(() => ctx.registerPair(prompt, response), [])

  const selectedResponse = ctx.selections.get(pairIndex) ?? null
  const isCorrect = ctx.submitted ? selectedResponse === response : null

  const pairCtx: MatchingPairContextValue = useMemo(() => ({
    pairIndex,
    prompt,
    response,
    selectedResponse,
    correct: isCorrect,
    disabled: ctx.submitted,
  }), [pairIndex, prompt, response, selectedResponse, isCorrect, ctx.submitted])

  return (
    <MatchingPairContext.Provider value={pairCtx}>
      <div
        class={className}
        data-correct={ctx.submitted ? String(isCorrect) : undefined}
      >
        {children}
      </div>
    </MatchingPairContext.Provider>
  )
}
