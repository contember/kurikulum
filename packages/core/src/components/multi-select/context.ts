import { createContext } from 'preact'

export interface MultiSelectContextValue {
  registerItem(correct: boolean): number
  selected: Set<number>
  toggle(index: number): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
}

export const MultiSelectContext = createContext<MultiSelectContextValue | null>(null)

export interface MultiSelectItemContextValue {
  index: number
  correct: boolean
  selected: boolean
  disabled: boolean
}

export const MultiSelectItemContext = createContext<MultiSelectItemContextValue | null>(null)
