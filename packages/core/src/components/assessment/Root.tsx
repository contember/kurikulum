import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useCourse } from '../../hooks/index.ts'
import type { AttemptAnswer } from '../../types.ts'
import { AssessmentContext } from './context.ts'
import { TimerContext } from './timerContext.ts'
import type { TimerContextValue } from './timerContext.ts'

export interface AssessmentRootProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  weight?: number
  timeLimit?: number // seconds, undefined = no limit
  onTimeExpired?: () => void // callback when time runs out (before auto-submit)
  children?: ComponentChildren
  class?: string
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function Root(
  { id, passThreshold, maxAttempts, weight = 1, timeLimit, onTimeExpired, children, class: className }: AssessmentRootProps,
): VNode {
  const runtime = useCourse()
  const [submitted, setSubmitted] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const evaluatorsRef = useRef<Map<string, { evaluate: () => number; weight: number; getResponse?: () => string }>>(new Map())

  // Timer state
  const storedRemaining = timeLimit != null ? runtime.state.timers[id] : undefined
  const initialRemaining = storedRemaining != null ? storedRemaining : (timeLimit ?? 0)
  const [remaining, setRemaining] = useState(initialRemaining)
  const remainingRef = useRef(remaining)
  remainingRef.current = remaining
  const timerStartRef = useRef(Date.now())
  const submittedRef = useRef(false)
  submittedRef.current = submitted

  const register = useCallback((qId: string, evaluate: () => number, qWeight: number = 1, getResponse?: () => string) => {
    evaluatorsRef.current.set(qId, { evaluate, weight: qWeight, getResponse })
    return () => {
      evaluatorsRef.current.delete(qId)
    }
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

    // Report session time for this assessment
    if (timeLimit != null) {
      const elapsed = (timeLimit - remainingRef.current) * 1000
      runtime.state.timers[id] = remainingRef.current
    }
  }, [runtime, id, passThreshold, weight, timeLimit])

  const retry = useCallback(() => {
    setSubmitted(false)
    setAttempt(a => a + 1)
    // Reset timer on retry
    if (timeLimit != null) {
      setRemaining(timeLimit)
      remainingRef.current = timeLimit
      timerStartRef.current = Date.now()
      runtime.state.timers[id] = timeLimit
    }
  }, [timeLimit, runtime, id])

  // Timer countdown
  useEffect(() => {
    if (timeLimit == null || submitted) return

    timerStartRef.current = Date.now()

    const interval = setInterval(() => {
      const newRemaining = Math.max(0, remainingRef.current - 1)
      setRemaining(newRemaining)
      remainingRef.current = newRemaining
      // Persist remaining to state for suspend
      runtime.state.timers[id] = newRemaining

      if (newRemaining <= 0) {
        clearInterval(interval)
        if (!submittedRef.current) {
          onTimeExpired?.()
          // Auto-submit with current answers
          submit()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLimit, submitted, attempt, id, runtime, onTimeExpired, submit])

  const result = runtime.getAssessmentResult(id)
  const score = result?.score ?? null
  const maxScore = result?.maxScore ?? 0
  const passed = result?.passed ?? null
  const attempts = result?.attempts ?? 0
  const history = result?.history ?? []
  const canRetry = submitted && passed === false && (maxAttempts === undefined || attempts < maxAttempts)
  const attemptsExhausted = submitted && passed === false && maxAttempts !== undefined && attempts >= maxAttempts

  // Timer context value
  const timerCtx: TimerContextValue | null = timeLimit != null
    ? {
      remaining,
      total: timeLimit,
      isRunning: !submitted && remaining > 0,
      isExpired: remaining <= 0,
      isWarning: remaining <= 60 && remaining > 0,
      formatted: formatTime(remaining),
    }
    : null

  const content = (
    <AssessmentContext.Provider
      value={{
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
      }}
    >
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

  if (timerCtx) {
    return (
      <TimerContext.Provider value={timerCtx}>
        {content}
      </TimerContext.Provider>
    )
  }

  return content
}
