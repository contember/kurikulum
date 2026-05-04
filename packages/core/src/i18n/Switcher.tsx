import type { VNode } from 'preact'
import { useLocale } from './context.tsx'

export interface LocaleSwitcherProps {
  children: (props: {
    locale: string
    available: string[]
    setLocale(locale: string): void
  }) => VNode | null
  /**
   * Render even when only one locale is available. Default false — there is
   * nothing to switch between, so the component returns null.
   */
  alwaysRender?: boolean
}

/**
 * Headless render-prop component that exposes the active locale, the list of
 * available locales, and a setter to swap. By default renders nothing when
 * fewer than two locales are available.
 */
export function LocaleSwitcher({ children, alwaysRender = false }: LocaleSwitcherProps): VNode | null {
  const { locale, available, setLocale } = useLocale()
  if (!alwaysRender && available.length < 2) return null
  return children({ locale, available, setLocale })
}
