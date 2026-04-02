import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { MCQ, MultiSelect, MCQContext, MultiSelectContext } from '@kurikulum/core'

export interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}

const feedbackClass = "mt-2 outline-none [&[data-correct='true']]:text-success [&[data-correct='false']]:text-danger"

export function QuestionFeedback({ correct, incorrect }: QuestionFeedbackProps): VNode | null {
  const msCtx = useContext(MultiSelectContext)

  const correctNode = <>{'✓ '}{correct}</>
  const incorrectNode = <>{'✗ '}{incorrect}</>

  if (msCtx) {
    return (
      <MultiSelect.Feedback
        correct={correctNode}
        incorrect={incorrectNode}
        class={feedbackClass}
      />
    )
  }

  return (
    <MCQ.Feedback
      correct={correctNode}
      incorrect={incorrectNode}
      class={feedbackClass}
    />
  )
}
