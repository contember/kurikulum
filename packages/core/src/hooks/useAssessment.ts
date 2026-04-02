import { useContext, useEffect, useReducer } from 'preact/hooks'
import { CourseContext } from '../context.tsx'

export function useAssessment() {
  const ctx = useContext(CourseContext)
  if (!ctx) {
    throw new Error('useAssessment must be used within a CourseProvider')
  }

  const [, forceUpdate] = useReducer((c: number) => c + 1, 0)
  useEffect(() => ctx.subscribe(forceUpdate), [ctx])

  const { state } = ctx.runtime

  return {
    score: state.score,
    maxScore: state.maxScore,
    passed: state.passed,
    attempts: state.attempts,
    submit: (score: number, max: number) => ctx.runtime.submitScore(score, max),
  }
}
