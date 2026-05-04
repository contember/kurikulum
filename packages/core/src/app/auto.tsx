import type { VNode } from 'preact'
import { available, bundles, defaultLocale } from 'virtual:kurikulum-content'
import { coreDictCs, coreDictEn } from '../i18n/dicts.ts'
import type { Dict } from '../i18n/types.ts'
import { KurikulumApp as Manual, type KurikulumAppProps as ManualProps } from './KurikulumApp.tsx'

const DEFAULT_DICTIONARIES: Record<string, Dict> = { cs: coreDictCs, en: coreDictEn }

export type KurikulumAppProps =
  & Omit<ManualProps, 'bundles' | 'available' | 'defaultLocale' | 'dictionaries'>
  & Partial<Pick<ManualProps, 'bundles' | 'available' | 'defaultLocale' | 'dictionaries'>>

/**
 * Pre-wired Kurikulum app shell. Pulls per-locale bundles, available
 * locales, and the default locale from `virtual:kurikulum-content` (set
 * up by the kurikulum() Vite plugin), and falls back to the built-in
 * `coreDictCs` / `coreDictEn` chrome dictionaries unless overridden.
 *
 * @example
 *   import { KurikulumApp } from 'kurikulum/auto'
 *   import { Page } from './components/Page.tsx'
 *   import { DefaultLayout } from './layout.tsx'
 *
 *   const config = {
 *     pages: ['intro', 'quiz'],
 *     version: '1',
 *   }
 *
 *   render(
 *     <KurikulumApp config={config}>
 *       <DefaultLayout>
 *         <Page id="intro" completion="mount" />
 *         <Page id="quiz" completion="interactive" />
 *       </DefaultLayout>
 *     </KurikulumApp>,
 *     document.getElementById('app')!,
 *   )
 */
export function KurikulumApp(props: KurikulumAppProps): VNode {
  return (
    <Manual
      bundles={props.bundles ?? bundles}
      available={props.available ?? available}
      defaultLocale={props.defaultLocale ?? defaultLocale}
      dictionaries={props.dictionaries ?? DEFAULT_DICTIONARIES}
      {...props}
    />
  )
}
