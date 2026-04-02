import type { CourseConfig, CourseRuntime, CourseState, DeliveryAdapter } from './types.ts'

function createInitialState(config: CourseConfig): CourseState {
  return {
    currentPage: config.pages[0] ?? '',
    pages: [...config.pages],
    completions: {},
    score: null,
    maxScore: 0,
    passed: null,
    attempts: 0,
    sessionStart: Date.now(),
    totalTimeMs: 0,
  }
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
      state.score = score
      state.maxScore = max
      state.passed = score / max >= (threshold ?? passThreshold)
      state.attempts += 1
      debouncedCommit()
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
