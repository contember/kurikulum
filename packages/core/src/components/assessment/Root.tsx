import type { ComponentChildren, VNode } from 'preact'
import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
import { useCourse } from '../../hooks/index.ts'
import { AssessmentContext } from './context.ts'

export interface AssessmentRootProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  children: ComponentChildren
  class?: string
}

export function Root({ id, passThreshold, maxAttempts, children, class: className }: AssessmentRootProps): VNode {
  const runtime = useCourse()
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const evaluatorsRef = useRef<Map<string, { evaluate: () => number; weight: number }>>(new Map())

  const register = useCallback((qId: string, evaluate: () => number, weight: number = 1) => {
    evaluatorsRef.current.set(qId, { evaluate, weight })
    return () => { evaluatorsRef.current.delete(qId) }
  }, [])

  const submit = useCallback(() => {
    const evaluators = evaluatorsRef.current
    let totalWeight = 0
    let weightedScore = 0

    for (const [, { evaluate, weight }] of evaluators) {
      totalWeight += weight
      weightedScore += evaluate() * weight
    }

    if (totalWeight === 0) return

    runtime.submitScore(weightedScore, totalWeight, passThreshold)
    setSubmitted(true)
  }, [runtime, passThreshold])

  const retry = useCallback(() => {
    setSubmitted(false)
    setAttempt(a => a + 1)
  }, [])

  const { score, maxScore, passed, attempts } = runtime.state
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
