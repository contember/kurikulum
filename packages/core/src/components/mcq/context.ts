import { createContext } from 'preact'

export interface MCQContextValue {
  registerItem(correct: boolean): number
  selected: number | null
  select(index: number): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
}

export const MCQContext = createContext<MCQContextValue | null>(null)

export interface MCQItemContextValue {
  index: number
  correct: boolean
  selected: boolean
  disabled: boolean
}

export const MCQItemContext = createContext<MCQItemContextValue | null>(null)
