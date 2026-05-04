import type { DeliveryAdapter, InteractionRecord } from '../types.ts'
import { createScorm12Adapter } from './scorm12.ts'

interface SCORM2004API {
  Initialize(param: ''): 'true' | 'false'
  Terminate(param: ''): 'true' | 'false'
  GetValue(element: string): string
  SetValue(element: string, value: string): 'true' | 'false'
  Commit(param: ''): 'true' | 'false'
  GetLastError(): string
}

function findAPI(win: Window): SCORM2004API | null {
  if ((win as any).API_1484_11) return (win as any).API_1484_11
  if (win.parent && win.parent !== win) return findAPI(win.parent as Window)
  if (win.opener) return findAPI(win.opener as Window)
  return null
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `PT${hours}H${minutes}M${seconds}S`
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function mapResult(result: InteractionRecord['result']): string {
  switch (result) {
    case 'correct':
      return 'correct'
    case 'wrong':
      return 'incorrect'
    case 'neutral':
      return 'neutral'
  }
}

export function createScorm2004Adapter(win?: Window): DeliveryAdapter {
  const targetWindow = win ?? (typeof window !== 'undefined' ? window : null)
  const api = targetWindow ? findAPI(targetWindow) : null

  if (!api) {
    console.warn('[kurikulum] SCORM 2004 API not found, falling back to SCORM 1.2')
    return createScorm12Adapter(win)
  }

  let interactionCount = 0

  return {
    async initialize() {
      api.Initialize('' as '')
    },

    getSuspendData() {
      const value = api.GetValue('cmi.suspend_data')
      return value || null
    },

    setSuspendData(data: string) {
      api.SetValue('cmi.suspend_data', data)
    },

    setScore(score: number, max: number) {
      api.SetValue('cmi.score.raw', String(score))
      api.SetValue('cmi.score.max', String(max))
      api.SetValue('cmi.score.min', '0')
      api.SetValue('cmi.score.scaled', String(score / max))
    },

    setStatus(status: 'incomplete' | 'completed' | 'passed' | 'failed') {
      switch (status) {
        case 'incomplete':
          api.SetValue('cmi.completion_status', 'incomplete')
          break
        case 'completed':
          api.SetValue('cmi.completion_status', 'completed')
          break
        case 'passed':
          api.SetValue('cmi.completion_status', 'completed')
          api.SetValue('cmi.success_status', 'passed')
          break
        case 'failed':
          api.SetValue('cmi.completion_status', 'completed')
          api.SetValue('cmi.success_status', 'failed')
          break
      }
    },

    setLocation(pageId: string) {
      api.SetValue('cmi.location', pageId)
    },

    getLocation() {
      const value = api.GetValue('cmi.location')
      return value || null
    },

    setSessionTime(ms: number) {
      api.SetValue('cmi.session_time', formatDuration(ms))
    },

    getLanguagePreference() {
      return api.GetValue('cmi.learner_preference.language') || null
    },

    setLanguagePreference(lang: string) {
      api.SetValue('cmi.learner_preference.language', lang)
    },

    recordInteraction(interaction: InteractionRecord) {
      const n = interactionCount++
      const prefix = `cmi.interactions.${n}`
      api.SetValue(`${prefix}.id`, interaction.id)
      api.SetValue(`${prefix}.type`, interaction.type)
      api.SetValue(`${prefix}.learner_response`, interaction.studentResponse)
      api.SetValue(`${prefix}.correct_responses.0.pattern`, interaction.correctResponse)
      api.SetValue(`${prefix}.result`, mapResult(interaction.result))
      api.SetValue(`${prefix}.timestamp`, formatTimestamp())
      if (interaction.weighting !== undefined) {
        api.SetValue(`${prefix}.weighting`, String(interaction.weighting))
      }
      if (interaction.latency !== undefined) {
        api.SetValue(`${prefix}.latency`, formatDuration(interaction.latency))
      }
    },

    commit() {
      api.Commit('' as '')
    },

    terminate() {
      api.Terminate('' as '')
    },
  }
}
