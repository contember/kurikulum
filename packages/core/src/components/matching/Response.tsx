import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { MatchingContext, MatchingPairContext } from './context.ts'

export interface MatchingResponseProps {
  class?: string
}

export function Response({ class: className }: MatchingResponseProps): VNode {
  const ctx = useContext(MatchingContext)
  if (!ctx) throw new Error('Matching.Response must be used within Matching.Root')
  const pairCtx = useContext(MatchingPairContext)
  if (!pairCtx) throw new Error('Matching.Response must be used within Matching.Pair')

  return (
    <select
      class={className}
      value={pairCtx.selectedResponse ?? ''}
      onChange={(e) => ctx.select(pairCtx.pairIndex, (e.target as HTMLSelectElement).value)}
      disabled={pairCtx.disabled}
      aria-disabled={pairCtx.disabled}
      aria-label={`Response for ${pairCtx.prompt}`}
    >
      <option value="" disabled>—</option>
      {ctx.responses.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  )
}
