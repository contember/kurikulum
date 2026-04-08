import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import type { HeadlessPartProps } from '../types.ts'
import { MatchingPairContext } from './context.ts'

export function Prompt({ children, class: className }: HeadlessPartProps): VNode {
  const ctx = useContext(MatchingPairContext)
  if (!ctx) throw new Error('Matching.Prompt must be used within Matching.Pair')

  return (
    <span class={className}>
      {children ?? ctx.prompt}
    </span>
  )
}
