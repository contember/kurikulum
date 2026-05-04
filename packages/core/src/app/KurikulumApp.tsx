import type { ComponentChildren, VNode } from 'preact'
import { useMemo, useRef } from 'preact/hooks'
import { CourseProvider } from '../context.tsx'
import { type ContentBundle, ContentBundleContext } from '../i18n/contentBundle.tsx'
import { LocaleProvider, useLocale } from '../i18n/context.tsx'
import type { Dict } from '../i18n/types.ts'
import type { CourseConfig, DeliveryAdapter } from '../types.ts'
import { createDefaultAdapter } from './adapter.ts'
import { detectLocale, persistLocaleChange } from './locale.ts'

export interface KurikulumAppProps {
  /** Course configuration. `title` is filled from the active bundle if omitted. */
  config: Omit<CourseConfig, 'title'> & { title?: string }
  /** Per-locale flat dictionaries (chrome strings). */
  dictionaries: Record<string, Dict>
  /** Per-locale content bundles produced by `virtual:kurikulum-content`. */
  bundles: Record<string, ContentBundle>
  /** Locale codes available in this build. */
  available: string[]
  /** Build-time default locale. */
  defaultLocale: string
  /** Fallback locale when the active bundle is missing a page. Defaults to defaultLocale. */
  fallbackLocale?: string
  /** Override the adapter (default: KURIKULUM_TARGET-driven). */
  adapter?: DeliveryAdapter
  /** Override initial locale (default: URL → adapter pref → navigator → defaultLocale). */
  initialLocale?: string
  /** Override locale-change handler (default: adapter persist + URL push). */
  onLocaleChange?: (locale: string) => void
  /** Locale used for missing-key fallback in t(). Default 'en'. */
  fallbackDictLocale?: string
  children?: ComponentChildren
}

/**
 * Top-level Kurikulum app shell — manual API. Wires LocaleProvider +
 * CourseProvider + ContentBundleContext. Most apps want `kurikulum/auto`
 * which pre-wires bundles/available/defaultLocale from the
 * `virtual:kurikulum-content` module and provides core dict defaults.
 *
 * @example
 *   import { KurikulumApp } from 'kurikulum'
 *   import * as content from 'virtual:kurikulum-content'
 *
 *   <KurikulumApp config={config} dictionaries={dictionaries} {...content}>
 *     <DefaultLayout>
 *       <Page id="intro" completion="mount" />
 *     </DefaultLayout>
 *   </KurikulumApp>
 */
export function KurikulumApp(props: KurikulumAppProps): VNode {
  const adapterRef = useRef<DeliveryAdapter | null>(null)
  if (!adapterRef.current) {
    adapterRef.current = props.adapter ?? createDefaultAdapter()
  }
  const adapter = adapterRef.current

  const initialLocale = useMemo(() => {
    return props.initialLocale
      ?? detectLocale({ available: props.available, defaultLocale: props.defaultLocale, adapter })
  }, [props.initialLocale, props.available, props.defaultLocale, adapter])

  if (!props.bundles[initialLocale]) {
    throw new Error(
      `[kurikulum] no content bundle for locale '${initialLocale}'. Available: [${props.available.join(', ')}]`,
    )
  }

  const fallbackLocale = props.fallbackLocale ?? props.defaultLocale
  const initialBundle = props.bundles[initialLocale]

  const fullConfig: CourseConfig = useMemo(
    () => ({ ...props.config, title: props.config.title ?? initialBundle.title }),
    [props.config, initialBundle.title],
  )

  const onLocaleChange = props.onLocaleChange ?? ((next) => persistLocaleChange(adapter, next))

  return (
    <LocaleProvider
      locale={initialLocale}
      available={props.available}
      fallback={props.fallbackDictLocale}
      dictionaries={props.dictionaries}
      onChange={onLocaleChange}
    >
      <CourseProvider config={fullConfig} adapter={adapter}>
        <ActiveBundle bundles={props.bundles} fallbackLocale={fallbackLocale}>
          {props.children}
        </ActiveBundle>
      </CourseProvider>
    </LocaleProvider>
  )
}

interface ActiveBundleProps {
  bundles: Record<string, ContentBundle>
  fallbackLocale: string
  children?: ComponentChildren
}

function ActiveBundle({ bundles, fallbackLocale, children }: ActiveBundleProps): VNode {
  const { locale } = useLocale()
  const bundle = bundles[locale] ?? bundles[fallbackLocale] ?? null
  return <ContentBundleContext.Provider value={bundle}>{children}</ContentBundleContext.Provider>
}
