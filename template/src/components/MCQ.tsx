import type { ComponentChildren, VNode } from 'preact'
import { h, toChildArray } from 'preact'
import { useState, useEffect, useContext, useRef } from 'preact/hooks'
import { useCompletion } from '@kurikulum/core'
import { AssessmentContext, QuestionContext } from './assessment-context.ts'
import { Option } from './Option.tsx'
import { QuestionFeedback } from './QuestionFeedback.tsx'

export interface MCQProps {
  id: string
  question: string
  children: ComponentChildren
}

export function MCQ({ id, question, children }: MCQProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const { markComplete } = useCompletion(id)
  const [selected, setSelected] = useState<number | null>(null)
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const childArray = toChildArray(children)
  const options: { correct: boolean; content: ComponentChildren }[] = []
  const feedbacks: VNode[] = []

  for (const child of childArray) {
    if (typeof child === 'object' && child !== null && 'type' in child) {
      if (child.type === Option) {
        options.push({
          correct: child.props.correct === true,
          content: child.props.children,
        })
      } else if (child.type === QuestionFeedback) {
        feedbacks.push(child as VNode)
      }
    }
  }

  const correctIndex = options.findIndex(o => o.correct)

  // Register evaluate function with Assessment parent
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, () => selectedRef.current === correctIndex)
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setSelected(null)
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const isCorrect = submitted && selected !== null ? selected === correctIndex : null

  // Mark complete on submit
  const markedRef = useRef(false)
  useEffect(() => {
    if (submitted && !markedRef.current) {
      markedRef.current = true
      markComplete()
    }
    if (!submitted) {
      markedRef.current = false
    }
  }, [submitted])

  return h(QuestionContext.Provider, { value: { submitted, correct: isCorrect } },
    h('fieldset', { role: 'radiogroup', 'aria-label': question },
      h('legend', { class: 'font-semibold mb-2' }, question),
      ...options.map((option, i) =>
        h('label', { class: 'flex items-center gap-2 py-1', key: i },
          h('input', {
            type: 'radio',
            name: id,
            checked: selected === i,
            onChange: () => { if (!submitted) setSelected(i) },
            disabled: submitted,
          }),
          h('span', null, option.content),
        ),
      ),
      !assessmentCtx && !submitted
        ? h('button', {
          type: 'button',
          onClick: () => { if (selected !== null) setLocalSubmitted(true) },
          disabled: selected === null,
        }, 'Odeslat')
        : null,
      ...feedbacks,
    ),
  )
}
