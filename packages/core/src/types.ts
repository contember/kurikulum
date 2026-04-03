export interface Note {
  pageId: string
  text: string
  createdAt: number
}

export interface AttemptAnswer {
  response: string
  correct: boolean
  score: number
}

export interface AttemptRecord {
  score: number
  maxScore: number
  passed: boolean
  timestamp: number
  answers: Record<string, AttemptAnswer>
}

export interface AssessmentResult {
  id: string
  score: number
  maxScore: number
  passed: boolean
  attempts: number
  weight: number
  history: AttemptRecord[]
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

  // Notes
  notes: Note[]

  // Time
  sessionStart: number
  totalTimeMs: number
}

export interface RestoreInfo {
  restored: boolean
  storedPage: string | null
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
  submitAssessmentScore(assessmentId: string, score: number, max: number, threshold?: number, weight?: number, answers?: Record<string, AttemptAnswer>): void
  getAssessmentResult(assessmentId: string): AssessmentResult | null

  // Lifecycle
  suspend(): void
  restore(): RestoreInfo
  reset(): void
}

export type CompletionStrategy = 'mount' | 'timer' | 'scroll' | 'manual' | 'interactive'

export interface CourseConfig {
  title: string
  pages: string[]
  defaultCompletion?: CompletionStrategy
  passThreshold?: number // 0-1, default 0.7
  version?: string
  onMigrate?: (old: CourseState, oldVersion: string) => CourseState | null
}

export interface SuspendEnvelope {
  v: number
  courseVersion?: string
  state: CourseState
}

export interface InteractionRecord {
  id: string
  type: 'choice' | 'true-false' | 'fill-in' | 'matching' | 'sequencing'
  studentResponse: string
  correctResponse: string
  result: 'correct' | 'wrong' | 'neutral'
  latency?: number       // ms
  weighting?: number
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

  // Interactions
  recordInteraction(interaction: InteractionRecord): void

  // Lifecycle
  commit(): void
  terminate(): void
}
