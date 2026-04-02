import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'
import { useContext } from 'preact/hooks'
import { QuestionContext } from './assessment-context.ts'

export interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}

export function QuestionFeedback({ correct, incorrect }: QuestionFeedbackProps): VNode | null {
  const ctx = useContext(QuestionContext)
  if (!ctx || !ctx.submitted) return null

  const message = ctx.correct ? correct : incorrect
  if (!message) return null

  return h('div', {
    role: 'status',
    'aria-live': 'polite',
    class: ctx.correct ? 'mt-2 text-green-700' : 'mt-2 text-red-700',
  }, message)
}
