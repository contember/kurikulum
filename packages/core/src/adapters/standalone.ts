import type { DeliveryAdapter, InteractionRecord } from '../types.ts'

const SUSPEND_KEY = 'kurikulum:suspend'
const LOCATION_KEY = 'kurikulum:location'
const LOCALE_KEY = 'kurikulum:locale'

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

    getLanguagePreference() {
      return localStorage.getItem(LOCALE_KEY)
    },

    setLanguagePreference(lang: string) {
      localStorage.setItem(LOCALE_KEY, lang)
    },

    recordInteraction(interaction: InteractionRecord) {
      console.log('[kurikulum]', 'recordInteraction', interaction)
    },

    commit() {},

    terminate() {
      console.log('[kurikulum] terminated')
    },
  }
}
