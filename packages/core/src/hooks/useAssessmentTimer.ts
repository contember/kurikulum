import { useContext } from 'preact/hooks'
import { TimerContext } from '../components/assessment/timerContext.ts'
import type { TimerContextValue } from '../components/assessment/timerContext.ts'

export function useAssessmentTimer(): TimerContextValue {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error('useAssessmentTimer must be used within an Assessment.Root with timeLimit')
  }
  return ctx
}
