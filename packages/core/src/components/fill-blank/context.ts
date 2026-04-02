import { createContext } from 'preact'

export interface FillBlankContextValue {
  value: string
  setValue(value: string): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
}

export const FillBlankContext = createContext<FillBlankContextValue | null>(null)
