import type { ComponentChildren, VNode } from 'preact'
import { useState, useRef, useCallback } from 'preact/hooks'
import { useCourse } from '../../hooks/index.ts'
import { AssessmentContext } from './context.ts'
import type { AttemptAnswer } from '../../types.ts'

export interface AssessmentRootProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  weight?: number
  children: ComponentChildren
  class?: string
}

export function Root({ id, passThreshold, maxAttempts, weight = 1, children, class: className }: AssessmentRootProps): VNode {
  const runtime = useCourse()
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const evaluatorsRef = useRef<Map<string, { evaluate: () => number; weight: number; getResponse?: () => string }>>(new Map())

  const register = useCallback((qId: string, evaluate: () => number, qWeight: number = 1, getResponse?: () => string) => {
    evaluatorsRef.current.set(qId, { evaluate, weight: qWeight, getResponse })
    return () => { evaluatorsRef.current.delete(qId) }
  }, [])

  const submit = useCallback(() => {
    const evaluators = evaluatorsRef.current
    let totalWeight = 0
    let weightedScore = 0
    const answers: Record<string, AttemptAnswer> = {}

    for (const [qId, { evaluate, weight: qWeight, getResponse }] of evaluators) {
      const qScore = evaluate()
      totalWeight += qWeight
      weightedScore += qScore * qWeight
      answers[qId] = {
        response: getResponse?.() ?? '',
        correct: qScore >= 1,
        score: qScore,
      }
    }

    if (totalWeight === 0) return

    runtime.submitAssessmentScore(id, weightedScore, totalWeight, passThreshold, weight, answers)
    setSubmitted(true)
  }, [runtime, id, passThreshold, weight])

  const retry = useCallback(() => {
    setSubmitted(false)
    setAttempt(a => a + 1)
  }, [])

  const result = runtime.getAssessmentResult(id)
  const score = result?.score ?? null
  const maxScore = result?.maxScore ?? 0
  const passed = result?.passed ?? null
  const attempts = result?.attempts ?? 0
  const history = result?.history ?? []
  const canRetry = submitted && passed === false && (maxAttempts === undefined || attempts < maxAttempts)
  const attemptsExhausted = submitted && passed === false && maxAttempts !== undefined && attempts >= maxAttempts

  return (
    <AssessmentContext.Provider value={{
      register,
      submitted,
      attempt,
      submit,
      retry,
      score,
      maxScore,
      passed,
      attempts,
      canRetry,
      attemptsExhausted,
      history,
    }}>
      <div
        role="region"
        aria-label="Assessment"
        class={className}
        data-submitted={submitted || undefined}
        data-passed={submitted ? String(passed) : undefined}
      >
        {children}
      </div>
    </AssessmentContext.Provider>
  )
}
