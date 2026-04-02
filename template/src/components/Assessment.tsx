import type { ComponentChildren, VNode } from 'preact'
import { h } from 'preact'
import { useState, useRef, useCallback } from 'preact/hooks'
import { useCourse } from '@kurikulum/core'
import { AssessmentContext } from './assessment-context.ts'

export interface AssessmentProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  children: ComponentChildren
}

export function Assessment({ id, passThreshold, maxAttempts, children }: AssessmentProps): VNode {
  const runtime = useCourse()
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const evaluatorsRef = useRef<Map<string, () => boolean>>(new Map())

  const register = useCallback((qId: string, evaluate: () => boolean) => {
    evaluatorsRef.current.set(qId, evaluate)
    return () => { evaluatorsRef.current.delete(qId) }
  }, [])

  const handleSubmit = () => {
    const evaluators = evaluatorsRef.current
    let correct = 0
    let total = 0

    for (const [, evaluate] of evaluators) {
      total++
      if (evaluate()) correct++
    }

    if (total === 0) return

    runtime.submitScore(correct, total, passThreshold)
    setSubmitted(true)
  }

  const handleRetry = () => {
    setSubmitted(false)
    setAttempt(a => a + 1)
  }

  const { score, maxScore, passed, attempts } = runtime.state
  const canRetry = submitted && passed === false && (maxAttempts === undefined || attempts < maxAttempts)
  const attemptsExhausted = submitted && passed === false && maxAttempts !== undefined && attempts >= maxAttempts

  return h(AssessmentContext.Provider, { value: { register, submitted, attempt } },
    h('div', { role: 'region', 'aria-label': 'Assessment' },
      children,
      !submitted
        ? h('button', {
          type: 'button',
          onClick: handleSubmit,
          class: 'mt-4 px-4 py-2 bg-blue-600 text-white rounded',
        }, 'Odeslat')
        : null,
      submitted
        ? h('div', { class: 'mt-4', role: 'status', 'aria-live': 'polite' },
          h('p', null, `Skóre: ${score}/${maxScore}`),
          passed === true ? h('p', { class: 'text-green-700' }, 'Splněno!') : null,
          passed === false ? h('p', { class: 'text-red-700' }, 'Nesplněno.') : null,
          canRetry
            ? h('button', {
              type: 'button',
              onClick: handleRetry,
              class: 'mt-2 px-4 py-2 bg-gray-600 text-white rounded',
            }, 'Zkusit znovu')
            : null,
          attemptsExhausted
            ? h('p', { class: 'text-gray-600' }, `Vyčerpány všechny pokusy (${maxAttempts}).`)
            : null,
        )
        : null,
    ),
  )
}
