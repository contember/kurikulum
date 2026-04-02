export interface CourseState {
  // Navigation
  currentPage: string
  pages: string[]

  // Completion — flat registry
  completions: Record<string, boolean>

  // Assessment
  score: number | null
  maxScore: number
  passed: boolean | null
  attempts: number

  // Time
  sessionStart: number
  totalTimeMs: number
}

export interface CourseRuntime {
  state: CourseState

  // Navigation
  navigateTo(pageId: string): void
  nextPage(): void
  prevPage(): void

  // Completion
  markComplete(id: string): void
  isComplete(id: string): boolean
  isPageComplete(pageId: string): boolean

  // Assessment
  submitScore(score: number, max: number, passThreshold?: number): void

  // Lifecycle
  suspend(): void
  restore(): void
}

export type CompletionStrategy = 'mount' | 'timer' | 'scroll' | 'manual' | 'interactive'

export interface CourseConfig {
  title: string
  pages: string[]
  defaultCompletion?: CompletionStrategy
  passThreshold?: number // 0-1, default 0.7
}

export interface DeliveryAdapter {
  commit(): void
  setSuspendData(data: string): void
  getSuspendData(): string
  setLocation(pageId: string): void
}
