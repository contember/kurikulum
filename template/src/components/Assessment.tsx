import type { ComponentChildren, VNode } from 'preact'
import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
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

  const statusRef = useRef<HTMLDivElement>(null)

  // Focus on status area after submit
  useEffect(() => {
    if (submitted) {
      statusRef.current?.focus()
    }
  }, [submitted])

  const { score, maxScore, passed, attempts } = runtime.state
  const canRetry = submitted && passed === false && (maxAttempts === undefined || attempts < maxAttempts)
  const attemptsExhausted = submitted && passed === false && maxAttempts !== undefined && attempts >= maxAttempts

  return (
    <AssessmentContext.Provider value={{ register, submitted, attempt }}>
      <div role="region" aria-label="Assessment">
        {children}
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            class="mt-4 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Odeslat
          </button>
        ) : null}
        {submitted ? (
          <div ref={statusRef} tabIndex={-1} class="mt-4 outline-none" role="status" aria-live="polite">
            <p>Skóre: {score}/{maxScore}</p>
            {passed === true ? <p class="text-success">✓ Splněno!</p> : null}
            {passed === false ? <p class="text-danger">✗ Nesplněno.</p> : null}
            {canRetry ? (
              <button
                type="button"
                onClick={handleRetry}
                class="mt-2 px-4 py-2 bg-text-secondary text-white rounded-default hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Zkusit znovu
              </button>
            ) : null}
            {attemptsExhausted ? (
              <p class="text-text-secondary">Vyčerpány všechny pokusy ({maxAttempts}).</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </AssessmentContext.Provider>
  )
}
