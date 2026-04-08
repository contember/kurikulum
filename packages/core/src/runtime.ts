import type {
  AssessmentResult,
  AttemptAnswer,
  CourseConfig,
  CourseRuntime,
  CourseState,
  DeliveryAdapter,
  RestoreInfo,
  SuspendEnvelope,
} from './types.ts'

export const CURRENT_SCHEMA_VERSION = 1

function createInitialState(config: CourseConfig): CourseState {
  return {
    currentPage: config.pages[0] ?? '',
    pages: [...config.pages],
    completions: {},
    score: null,
    maxScore: 0,
    passed: null,
    attempts: 0,
    assessments: {},
    notepad: '',
    timers: {},
    sessionStart: Date.now(),
    totalTimeMs: 0,
  }
}

function recomputeAggregateScore(state: CourseState): void {
  const assessments = Object.values(state.assessments)
  if (assessments.length === 0) {
    state.score = null
    state.maxScore = 0
    state.passed = null
    state.attempts = 0
    return
  }

  const totalWeight = assessments.reduce((sum, a) => sum + a.weight, 0)
  if (totalWeight === 0) return

  state.score = assessments.reduce((sum, a) => sum + a.score * a.weight, 0) / totalWeight
  state.maxScore = assessments.reduce((sum, a) => sum + a.maxScore * a.weight, 0) / totalWeight
  state.passed = assessments.every(a => a.passed)
  state.attempts = Math.max(...assessments.map(a => a.attempts))
}

export function createCourseRuntime(
  config: CourseConfig,
  adapter: DeliveryAdapter,
): CourseRuntime {
  const state = createInitialState(config)
  const passThreshold = config.passThreshold ?? 0.7

  let commitTimer: ReturnType<typeof setTimeout> | null = null

  function debouncedCommit() {
    if (commitTimer !== null) {
      clearTimeout(commitTimer)
    }
    commitTimer = setTimeout(() => {
      adapter.commit()
      commitTimer = null
    }, 100)
  }

  const runtime: CourseRuntime = {
    state,

    navigateTo(pageId: string) {
      if (!state.pages.includes(pageId)) return
      state.currentPage = pageId
      adapter.setLocation(pageId)
      debouncedCommit()
    },

    nextPage() {
      const idx = state.pages.indexOf(state.currentPage)
      if (idx < state.pages.length - 1) {
        runtime.navigateTo(state.pages[idx + 1])
      }
    },

    prevPage() {
      const idx = state.pages.indexOf(state.currentPage)
      if (idx > 0) {
        runtime.navigateTo(state.pages[idx - 1])
      }
    },

    markComplete(id: string) {
      state.completions[id] = true
      debouncedCommit()
    },

    isComplete(id: string) {
      return state.completions[id] === true
    },

    isPageComplete(pageId: string) {
      return state.completions[pageId] === true
    },

    submitScore(score: number, max: number, threshold?: number) {
      runtime.submitAssessmentScore('__default__', score, max, threshold)
    },

    submitAssessmentScore(
      assessmentId: string,
      score: number,
      max: number,
      threshold?: number,
      weight?: number,
      answers?: Record<string, AttemptAnswer>,
    ) {
      const existing = state.assessments[assessmentId]
      const passed = score / max >= (threshold ?? passThreshold)
      const record = {
        score,
        maxScore: max,
        passed,
        timestamp: Date.now(),
        answers: answers ?? {},
      }
      state.assessments[assessmentId] = {
        id: assessmentId,
        score,
        maxScore: max,
        passed,
        attempts: (existing?.attempts ?? 0) + 1,
        weight: weight ?? existing?.weight ?? 1,
        history: [...(existing?.history ?? []), record],
      }
      recomputeAggregateScore(state)
      adapter.setScore(state.score!, state.maxScore)
      adapter.setStatus(state.passed ? 'passed' : 'failed')
      debouncedCommit()
    },

    getAssessmentResult(assessmentId: string): AssessmentResult | null {
      return state.assessments[assessmentId] ?? null
    },

    suspend() {
      state.totalTimeMs += Date.now() - state.sessionStart
      const envelope: SuspendEnvelope = {
        v: CURRENT_SCHEMA_VERSION,
        courseVersion: config.version,
        state,
      }
      adapter.setSuspendData(JSON.stringify(envelope))
      adapter.commit()
    },

    restore(): RestoreInfo {
      const noRestore: RestoreInfo = { restored: false, storedPage: null }
      const data = adapter.getSuspendData()
      if (!data) return noRestore

      let parsed: unknown
      try {
        parsed = JSON.parse(data)
      } catch {
        console.warn('[kurikulum] Invalid suspend_data JSON, resetting')
        return noRestore
      }

      // Old format (no envelope) — safely discard
      if (!parsed || typeof parsed !== 'object' || !('v' in parsed)) {
        console.warn('[kurikulum] Legacy suspend_data without envelope, resetting')
        return noRestore
      }

      const envelope = parsed as SuspendEnvelope

      // Schema version mismatch → reset
      if (envelope.v !== CURRENT_SCHEMA_VERSION) {
        console.warn('[kurikulum] Incompatible suspend_data schema, resetting')
        return noRestore
      }

      // Course version changed → try migration
      if (envelope.courseVersion !== config.version) {
        if (config.onMigrate) {
          const migrated = config.onMigrate(envelope.state, envelope.courseVersion ?? '')
          if (migrated) {
            Object.assign(state, migrated)
            state.pages = config.pages
            state.sessionStart = Date.now()
            if (!config.pages.includes(state.currentPage)) {
              state.currentPage = config.pages[0] ?? ''
            }
            return { restored: true, storedPage: state.currentPage }
          }
        }
        console.warn('[kurikulum] Course version changed, resetting progress')
        return noRestore
      }

      // Same version → normal restore
      const pages = state.pages
      Object.assign(state, envelope.state)
      state.pages = pages
      state.sessionStart = Date.now()
      if (!pages.includes(state.currentPage)) {
        state.currentPage = pages[0] ?? ''
      }
      return { restored: true, storedPage: state.currentPage }
    },

    reset() {
      const initial = createInitialState(config)
      Object.assign(state, initial)
      adapter.setSuspendData('')
      adapter.setLocation(state.currentPage)
      adapter.setScore(0, 0)
      adapter.setStatus('incomplete')
      debouncedCommit()
    },
  }

  return runtime
}
