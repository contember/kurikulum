import { createContext } from 'preact'

export interface AssessmentContextValue {
  register(id: string, evaluate: () => boolean): () => void
  submitted: boolean
  attempt: number
}

export const AssessmentContext = createContext<AssessmentContextValue | null>(null)

export interface QuestionContextValue {
  submitted: boolean
  correct: boolean | null
}

export const QuestionContext = createContext<QuestionContextValue | null>(null)
