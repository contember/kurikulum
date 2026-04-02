import { createContext } from 'preact'

export interface AssessmentContextValue {
  register(id: string, evaluate: () => number, weight?: number): () => void
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
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null)
