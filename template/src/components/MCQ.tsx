import type { ComponentChildren, VNode } from 'preact'
import { MCQ as M } from '@kurikulum/core'

export interface MCQProps {
  id: string
  question: string
  weight?: number
  children?: ComponentChildren
}

export function MCQ({ id, question, weight, children }: MCQProps): VNode {
  return (
    <M.Root id={id} weight={weight} aria-label={question}>
      <M.Label class="font-semibold mb-2">{question}</M.Label>
      {children}
      <M.Submit class="mt-2 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Odeslat
      </M.Submit>
    </M.Root>
  )
}
