import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.tsx'

export function useAssessment(assessmentId?: string) {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useAssessment must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  const { state } = ctx.runtime

  if (assessmentId) {
    const result = ctx.runtime.getAssessmentResult(assessmentId)
    return {
      score: result?.score ?? null,
      maxScore: result?.maxScore ?? 0,
      passed: result?.passed ?? null,
      attempts: result?.attempts ?? 0,
      submit: (score: number, max: number) => ctx.runtime.submitAssessmentScore(assessmentId, score, max),
    }
  }

  return {
    score: state.score,
    maxScore: state.maxScore,
    passed: state.passed,
    attempts: state.attempts,
    submit: (score: number, max: number) => ctx.runtime.submitScore(score, max),
  }
}
