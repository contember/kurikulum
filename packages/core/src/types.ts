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
  initialize(): Promise<void>

  // State persistence
  getSuspendData(): string | null
  setSuspendData(data: string): void

  // SCORM-mapped values
  setScore(score: number, max: number): void
  setStatus(status: 'incomplete' | 'completed' | 'passed' | 'failed'): void
  setLocation(pageId: string): void
  getLocation(): string | null
  setSessionTime(ms: number): void

  // Lifecycle
  commit(): void
  terminate(): void
}
