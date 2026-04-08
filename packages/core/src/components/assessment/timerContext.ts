import { createContext } from 'preact'

export interface TimerContextValue {
  remaining: number // remaining seconds
  total: number // total limit in seconds
  isRunning: boolean
  isExpired: boolean
  isWarning: boolean // below warningThreshold
  formatted: string // "04:32"
}

export const TimerContext = createContext<TimerContextValue | null>(null)
