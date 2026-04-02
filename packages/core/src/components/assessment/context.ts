import { createContext } from 'preact'
import type { AttemptRecord } from '../../types.ts'

export interface AssessmentContextValue {
  register(id: string, evaluate: () => number, weight?: number, getResponse?: () => string): () => void
  submitted: boolean
  attempt: number
  submit(): void
  retry(): void
  score: number | null
  maxScore: number
  passed: boolean | null
  attempts: number
  canRetry: boolean
  attemptsExhausted: boolean
  history: AttemptRecord[]
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null)
