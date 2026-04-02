import type { ComponentChildren, VNode } from 'preact'
import { MCQ } from '@kurikulum/core'

export interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}

export function QuestionFeedback({ correct, incorrect }: QuestionFeedbackProps): VNode | null {
  return (
    <MCQ.Feedback
      correct={<>{'✓ '}{correct}</>}
      incorrect={<>{'✗ '}{incorrect}</>}
      class="mt-2 outline-none [&[data-correct='true']]:text-success [&[data-correct='false']]:text-danger"
    />
  )
}
