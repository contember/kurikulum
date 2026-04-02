import type { DeliveryAdapter, InteractionRecord } from '../types.ts'
import { createStandaloneAdapter } from './standalone.ts'

interface SCORM12API {
  LMSInitialize(param: ''): 'true' | 'false'
  LMSFinish(param: ''): 'true' | 'false'
  LMSGetValue(element: string): string
  LMSSetValue(element: string, value: string): 'true' | 'false'
  LMSCommit(param: ''): 'true' | 'false'
  LMSGetLastError(): string
}

function findAPI(win: Window): SCORM12API | null {
  if ((win as any).API) return (win as any).API
  if (win.parent && win.parent !== win) return findAPI(win.parent as Window)
  if (win.opener) return findAPI(win.opener as Window)
  return null
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.00`
}

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function mapStatus(status: string): string {
  switch (status) {
    case 'incomplete': return 'incomplete'
    case 'completed': return 'completed'
    case 'passed': return 'passed'
    case 'failed': return 'failed'
    default: return 'incomplete'
  }
}

function formatLatency(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}

function formatTimeOfDay(): string {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

function mapResult(result: InteractionRecord['result']): string {
  switch (result) {
    case 'correct': return 'correct'
    case 'wrong': return 'wrong'
    case 'neutral': return 'neutral'
  }
}

export function createScorm12Adapter(win?: Window): DeliveryAdapter {
  const targetWindow = win ?? (typeof window !== 'undefined' ? window : null)
  const api = targetWindow ? findAPI(targetWindow) : null

  if (!api) {
    console.warn('[kurikulum] SCORM API not found, falling back to standalone')
    return createStandaloneAdapter()
  }

  let interactionCount = 0

  return {
    async initialize() {
      api.LMSInitialize('' as '')
    },

    getSuspendData() {
      const value = api.LMSGetValue('cmi.suspend_data')
      return value || null
    },

    setSuspendData(data: string) {
      api.LMSSetValue('cmi.suspend_data', data)
    },

    setScore(score: number, max: number) {
      api.LMSSetValue('cmi.core.score.raw', String(score))
      api.LMSSetValue('cmi.core.score.max', String(max))
    },

    setStatus(status: 'incomplete' | 'completed' | 'passed' | 'failed') {
      api.LMSSetValue('cmi.core.lesson_status', mapStatus(status))
    },

    setLocation(pageId: string) {
      api.LMSSetValue('cmi.core.lesson_location', pageId)
    },

    getLocation() {
      const value = api.LMSGetValue('cmi.core.lesson_location')
      return value || null
    },

    setSessionTime(ms: number) {
      api.LMSSetValue('cmi.core.session_time', formatTime(ms))
    },

    recordInteraction(interaction: InteractionRecord) {
      const n = interactionCount++
      const prefix = `cmi.interactions.${n}`
      api.LMSSetValue(`${prefix}.id`, interaction.id)
      api.LMSSetValue(`${prefix}.type`, interaction.type)
      api.LMSSetValue(`${prefix}.student_response`, interaction.studentResponse)
      api.LMSSetValue(`${prefix}.correct_responses.0.pattern`, interaction.correctResponse)
      api.LMSSetValue(`${prefix}.result`, mapResult(interaction.result))
      api.LMSSetValue(`${prefix}.time`, formatTimeOfDay())
      if (interaction.weighting !== undefined) {
        api.LMSSetValue(`${prefix}.weighting`, String(interaction.weighting))
      }
      if (interaction.latency !== undefined) {
        api.LMSSetValue(`${prefix}.latency`, formatLatency(interaction.latency))
      }
    },

    commit() {
      api.LMSCommit('' as '')
    },

    terminate() {
      api.LMSFinish('' as '')
    },
  }
}
