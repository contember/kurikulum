// `@kurikulum/content-bundle` is a runtime alias provided by the kurikulum()
// Vite plugin (see vite/content-bundle-alias.ts). Keep this literal in sync
// with the CONTENT_BUNDLE_ALIAS constant — `content-bundle-alias.test.ts`
// enforces that.
import { available, bundles, defaultLocale } from '@kurikulum/content-bundle'
import { coreDictCs, coreDictEn, KurikulumApp as Manual, type KurikulumAppProps as ManualProps } from 'kurikulum'
import type { Dict } from 'kurikulum'
import type { VNode } from 'preact'

const DEFAULT_DICTIONARIES: Record<string, Dict> = { cs: coreDictCs, en: coreDictEn }

export type KurikulumAppProps =
  & Omit<ManualProps, 'bundles' | 'available' | 'defaultLocale' | 'dictionaries'>
  & Partial<Pick<ManualProps, 'bundles' | 'available' | 'defaultLocale' | 'dictionaries'>>

/**
 * Pre-wired Kurikulum app shell. Pulls per-locale bundles, available
 * locales, and the default locale from the generated `@kurikulum/content-bundle`
 * module (set up by the kurikulum() Vite plugin), and falls back to the
 * built-in `coreDictCs` / `coreDictEn` chrome dictionaries unless overridden.
 *
 * The bare-package self-import (`from 'kurikulum'`) is deliberate: it lets
 * the dep optimizer share the kurikulum chunk between `kurikulum/auto` and
 * direct `kurikulum` imports, so they end up holding the same CourseContext
 * singleton at runtime.
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
