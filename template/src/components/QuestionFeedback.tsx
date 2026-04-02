import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'
import { useContext, useEffect, useRef } from 'preact/hooks'
import { QuestionContext } from './assessment-context.ts'

export interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}

export function QuestionFeedback({ correct, incorrect }: QuestionFeedbackProps): VNode | null {
  const ctx = useContext(QuestionContext)
  const feedbackRef = useRef<HTMLDivElement>(null)

  const isVisible = ctx?.submitted ?? false
  const message = isVisible ? (ctx!.correct ? correct : incorrect) : null

  // Focus on feedback message after submit
  useEffect(() => {
    if (isVisible && message) {
      feedbackRef.current?.focus()
    }
  }, [isVisible])

  if (!isVisible || !message) return null

  // Use icon prefix (✓/✗) alongside color — not color-only indication
  const icon = ctx!.correct ? '✓ ' : '✗ '

  return h('div', {
    ref: feedbackRef,
    tabIndex: -1,
    role: 'status',
    'aria-live': 'polite',
    class: ctx!.correct
      ? 'mt-2 text-green-700 outline-none'
      : 'mt-2 text-red-700 outline-none',
  }, icon, message)
}
