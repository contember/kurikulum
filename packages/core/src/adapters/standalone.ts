import type { DeliveryAdapter } from '../types.ts'

const SUSPEND_KEY = 'kurikulum:suspend'
const LOCATION_KEY = 'kurikulum:location'

export function createStandaloneAdapter(): DeliveryAdapter {
  return {
    async initialize() {},

    getSuspendData() {
      return localStorage.getItem(SUSPEND_KEY)
    },

    setSuspendData(data: string) {
      localStorage.setItem(SUSPEND_KEY, data)
    },

    setScore(score: number, max: number) {
      console.log('[kurikulum]', 'setScore', score, max)
    },

    setStatus(status: 'incomplete' | 'completed' | 'passed' | 'failed') {
      console.log('[kurikulum]', 'setStatus', status)
    },

    setLocation(pageId: string) {
      localStorage.setItem(LOCATION_KEY, pageId)
      console.log('[kurikulum]', 'setLocation', pageId)
    },

    getLocation() {
      return localStorage.getItem(LOCATION_KEY)
    },

    setSessionTime(ms: number) {
      console.log('[kurikulum]', 'setSessionTime', ms)
    },

    commit() {},

    terminate() {
      console.log('[kurikulum] terminated')
    },
  }
}
