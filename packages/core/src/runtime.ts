import type { AssessmentResult, CourseConfig, CourseRuntime, CourseState, DeliveryAdapter } from './types.ts'

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

    submitAssessmentScore(assessmentId: string, score: number, max: number, threshold?: number, weight?: number) {
      const existing = state.assessments[assessmentId]
      state.assessments[assessmentId] = {
        id: assessmentId,
        score,
        maxScore: max,
        passed: score / max >= (threshold ?? passThreshold),
        attempts: (existing?.attempts ?? 0) + 1,
        weight: weight ?? existing?.weight ?? 1,
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
      adapter.setSuspendData(JSON.stringify(state))
      adapter.commit()
    },

    restore() {
      const data = adapter.getSuspendData()
      if (!data) return
      const restored = JSON.parse(data) as CourseState
      const pages = state.pages
      Object.assign(state, restored)
      state.pages = pages
      state.sessionStart = Date.now()
      if (!pages.includes(state.currentPage)) {
        state.currentPage = pages[0] ?? ''
      }
    },
  }

  return runtime
}
