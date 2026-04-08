import {
  FillBlank,
  FillBlankContext,
  Matching,
  MatchingContext,
  MCQ,
  MCQContext,
  MultiSelect,
  MultiSelectContext,
  Ordering,
  OrderingContext,
} from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'

export interface QuestionFeedbackProps {
  correct?: ComponentChildren
  incorrect?: ComponentChildren
}

const feedbackClass = "mt-2 outline-none [&[data-correct='true']]:text-success [&[data-correct='false']]:text-danger"

export function QuestionFeedback({ correct, incorrect }: QuestionFeedbackProps): VNode | null {
  const msCtx = useContext(MultiSelectContext)
  const fbCtx = useContext(FillBlankContext)
  const matchCtx = useContext(MatchingContext)
  const orderCtx = useContext(OrderingContext)

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

  if (fbCtx) {
    return (
      <FillBlank.Feedback
        correct={correctNode}
        incorrect={incorrectNode}
        class={feedbackClass}
      />
    )
  }

  if (matchCtx) {
    return (
      <Matching.Feedback
        correct={correctNode}
        incorrect={incorrectNode}
        class={feedbackClass}
      />
    )
  }

  if (orderCtx) {
    return (
      <Ordering.Feedback
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
