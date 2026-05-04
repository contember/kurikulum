import { createContext } from 'preact'
import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useState } from 'preact/hooks'
import { coreDictEn } from './dicts.ts'
import type { Dict, LocaleContextValue } from './types.ts'

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export interface LocaleProviderProps {
  /** Active locale code (e.g. 'cs', 'en'). */
  locale: string
  /** Locale codes the consumer should expose to a switcher. Defaults to Object.keys(dictionaries). */
  available?: string[]
  /** Locale used when a key is missing from the active dictionary. Default 'en'. */
  fallback?: string
  /** Map of locale code → flat dictionary. */
  dictionaries: Record<string, Dict>
  /** Called whenever the user (or system) changes the locale. */
  onChange?: (locale: string) => void
  children?: ComponentChildren
}

export function LocaleProvider(props: LocaleProviderProps): VNode {
  const { locale, available, fallback = 'en', dictionaries, onChange, children } = props
  const [current, setCurrent] = useState(locale)

  useEffect(() => {
    setCurrent(locale)
  }, [locale])

  const setLocale = useCallback(
    (next: string) => {
      setCurrent(next)
      onChange?.(next)
    },
    [onChange],
  )

  const value = useMemo<LocaleContextValue>(() => {
    const dict = dictionaries[current] ?? {}
    const fbDict = dictionaries[fallback] ?? coreDictEn

    function t(key: string, vars?: Record<string, string | number>): string {
      let template = dict[key]
      if (template === undefined) template = fbDict[key]
      if (template === undefined) template = coreDictEn[key]
      if (template === undefined) {
        if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
          console.warn(`[kurikulum i18n] missing key "${key}" (locale "${current}")`)
        }
        template = key
      }
      if (!vars) return template
      return template.replace(/\{(\w+)\}/g, (_, name) => {
        const v = vars[name]
        return v === undefined ? `{${name}}` : String(v)
      })
    }

    return {
      locale: current,
      available: available ?? Object.keys(dictionaries),
      setLocale,
      t,
    }
  }, [current, available, fallback, dictionaries, setLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

const FALLBACK_LOCALE_VALUE: LocaleContextValue = {
  locale: 'en',
  available: ['en'],
  setLocale: () => {},
  t(key, vars) {
    const template = coreDictEn[key] ?? key
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, name) => {
      const v = vars[name]
      return v === undefined ? `{${name}}` : String(v)
    })
  },
}

/**
 * Returns the active locale context. If no LocaleProvider is mounted, returns
 * a fallback that reads from core English defaults — so headless components
 * keep working without forcing consumers to wire i18n.
 */
export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  return ctx ?? FALLBACK_LOCALE_VALUE
}
