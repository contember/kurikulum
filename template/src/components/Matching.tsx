import type { ComponentChildren, VNode } from 'preact'
import { Matching as M } from '@kurikulum/core'

export interface MatchingProps {
  id: string
  question: string
  weight?: number
  children: ComponentChildren
}

export function Matching({ id, question, weight, children }: MatchingProps): VNode {
  return (
    <M.Root id={id} weight={weight} aria-label={question}>
      <M.Label class="font-semibold mb-2">{question}</M.Label>
      <div class="space-y-3 mt-2">
        {children}
      </div>
      <M.Submit class="mt-3 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Odeslat
      </M.Submit>
    </M.Root>
  )
}

// Re-export Pair as a styled version
export function MatchingPair({ prompt, response }: { prompt: string; response: string }): VNode {
  return (
    <M.Pair prompt={prompt} response={response} class="flex items-center gap-3">
      <M.Prompt class="flex-1 font-medium" />
      <M.Response class="flex-1 px-3 py-2 border border-border rounded-default bg-surface text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" />
    </M.Pair>
  )
}
