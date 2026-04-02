import { createContext } from 'preact'

export interface MatchingPairDef {
  prompt: string
  response: string
}

export interface MatchingContextValue {
  pairs: MatchingPairDef[]
  responses: string[]
  selections: Map<number, string>
  select(pairIndex: number, response: string): void
  submitted: boolean
  isStandalone: boolean
  submit(): void
  id: string
  correct: boolean | null
  score: number | null
  registerPair(prompt: string, response: string): number
}

export const MatchingContext = createContext<MatchingContextValue | null>(null)

export interface MatchingPairContextValue {
  pairIndex: number
  prompt: string
  response: string
  selectedResponse: string | null
  correct: boolean | null
  disabled: boolean
}

export const MatchingPairContext = createContext<MatchingPairContextValue | null>(null)
