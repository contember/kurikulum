export interface AssessmentResult {
  id: string
  score: number
  maxScore: number
  passed: boolean
  attempts: number
  weight: number
}

export interface CourseState {
  // Navigation
  currentPage: string
  pages: string[]

  // Completion — flat registry
  completions: Record<string, boolean>

  // Assessment — computed from assessments record
  score: number | null
  maxScore: number
  passed: boolean | null
  attempts: number

  // Per-assessment tracking
  assessments: Record<string, AssessmentResult>

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

  // Assessment — backward compatible
  submitScore(score: number, max: number, passThreshold?: number): void

  // Assessment — per-assessment
  submitAssessmentScore(assessmentId: string, score: number, max: number, threshold?: number, weight?: number): void
  getAssessmentResult(assessmentId: string): AssessmentResult | null

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
