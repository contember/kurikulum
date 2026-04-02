import { createContext } from 'preact'

export interface NavigationContextValue {
  currentPage: string
  next(): void
  prev(): void
  goTo(id: string): void
  canGoNext: boolean
  canGoPrev: boolean
  pageIndex: number
  totalPages: number
}

export const NavigationContext = createContext<NavigationContextValue | null>(null)
