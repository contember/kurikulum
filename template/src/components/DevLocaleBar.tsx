import { LocaleSwitcher } from 'kurikulum'
import type { VNode } from 'preact'
import { useEffect } from 'preact/hooks'

/**
 * Floating locale switcher rendered only when KURIKULUM_DEV_LOCALE_SWITCHER
 * is true (dev mode + auto locale + ≥2 locales available). Adds an Alt+L
 * hotkey that cycles through available locales.
 */
export function DevLocaleBar(): VNode | null {
  if (!import.meta.env.KURIKULUM_DEV_LOCALE_SWITCHER) return null

  return (
    <LocaleSwitcher>
      {(props) => <DevLocaleBarUI {...props} />}
    </LocaleSwitcher>
  )
}

interface DevLocaleBarUIProps {
  locale: string
  available: string[]
  setLocale(locale: string): void
}

function DevLocaleBarUI({ locale, available, setLocale }: DevLocaleBarUIProps): VNode {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.key.toLowerCase() !== 'l') return
      e.preventDefault()
      const idx = available.indexOf(locale)
      const next = available[(idx + 1) % available.length]
      setLocale(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [locale, available, setLocale])

  return (
    <div
      class="fixed bottom-3 left-3 z-[60] flex items-center gap-1 px-2 py-1.5 rounded-lg bg-bg-surface border border-border shadow-lg text-xs font-mono"
      role="group"
      aria-label="Dev locale switcher"
    >
      <span class="text-text-secondary px-1 select-none">lang</span>
      {available.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={l === locale}
          class={`px-2 py-0.5 rounded transition-colors ${l === locale ? 'bg-primary text-white' : 'text-text hover:bg-bg-muted'}`}
        >
          {l}
        </button>
      ))}
      <span class="text-text-muted px-1 select-none">Alt+L</span>
    </div>
  )
}
