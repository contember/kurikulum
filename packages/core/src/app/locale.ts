import type { DeliveryAdapter } from '../types.ts'

export interface DetectLocaleOptions {
  available: string[]
  defaultLocale: string
  adapter?: DeliveryAdapter
}

/**
 * Resolves the initial locale via this chain:
 *   1. ?lang=… in the current URL
 *   2. adapter.getLanguagePreference?.() (SCORM/standalone-localStorage)
 *   3. navigator.language
 *   4. defaultLocale (must be in `available`), else first available, else ''.
 */
export function detectLocale({ available, defaultLocale, adapter }: DetectLocaleOptions): string {
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl && available.includes(fromUrl)) return fromUrl
  }
  const fromAdapter = adapter?.getLanguagePreference?.()?.split('-')[0]
  if (fromAdapter && available.includes(fromAdapter)) return fromAdapter
  if (typeof navigator !== 'undefined') {
    const navLang = navigator.language?.split('-')[0]
    if (navLang && available.includes(navLang)) return navLang
  }
  return available.includes(defaultLocale) ? defaultLocale : available[0] ?? ''
}

/**
 * Default locale-change handler: persist to adapter (if it supports it) and
 * push ?lang=<locale> into the URL via history.replaceState (no reload).
 */
export function persistLocaleChange(adapter: DeliveryAdapter | undefined, locale: string): void {
  adapter?.setLanguagePreference?.(locale)
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('lang', locale)
  window.history.replaceState(null, '', url.toString())
}
