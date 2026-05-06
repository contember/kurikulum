import type { PluginOption } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { createCmi5Package } from '../cmi5/package.ts'
import { createScormPackage } from '../scorm/package.ts'
import { contentPlugin, type ContentPluginOptions } from './content-plugin.ts'
import { discoverContent } from './content-utils.ts'
import { searchIndexPlugin, type SearchIndexPluginOptions } from './search-index-plugin.ts'

export type KurikulumTarget = 'standalone' | 'scorm-1.2' | 'scorm-2004' | 'cmi5' | 'xapi'

export interface KurikulumScormOptions {
  title?: string
  identifier?: string
  /** Output zip path. Defaults to <distRoot>/<title>.zip (sibling of outDir). */
  outputZip?: string
}

export interface KurikulumCmi5Options {
  title?: string
  identifier?: string
  activityId?: string
  /** Output zip path. Defaults to <distRoot>/<title>-cmi5.zip. */
  outputZip?: string
}

export interface KurikulumPluginOptions {
  /** Build target. Defaults to process.env.KURIKULUM_TARGET ?? 'standalone'. */
  target?: KurikulumTarget
  /**
   * Active locale, or 'auto' to load every locale (multi-locale dev mode).
   * Defaults: when running `vite` (serve) → 'auto'; when running `vite build` →
   * process.env.KURIKULUM_LOCALE or the first locale found under contentDir.
   */
  locale?: string
  /** Content directory relative to Vite root. Default 'src/content'. */
  contentDir?: string
  /** Output directory. Defaults to `dist/${target}` or `dist/${target}-${locale}` when an explicit locale is set. */
  outDir?: string
  /** Search-index plugin options. Pass false to disable. */
  search?: SearchIndexPluginOptions | false
  /** Content plugin options. Pass false to disable. */
  content?: Omit<ContentPluginOptions, 'locale' | 'contentDir'> | false
  /** Inline assets into a single index.html. Defaults to true (Kurikulum builds are self-contained). */
  singleFile?: boolean
  /** SCORM packaging. Auto-enabled for scorm-1.2 / scorm-2004. Pass false to skip. */
  scorm?: KurikulumScormOptions | false
  /** cmi5 packaging. Auto-enabled for cmi5 target. Pass false to skip. */
  cmi5?: KurikulumCmi5Options | false
  /** Extra import.meta.env.* compile-time constants. */
  env?: Record<string, string>
  /** xAPI activity ID. Defaults to process.env.KURIKULUM_XAPI_ACTIVITY_ID. */
  xapiActivityId?: string
  /** Override Vite root used for content discovery. Defaults to process.cwd(). */
  root?: string
}

/**
 * One-stop Vite plugin that wires up everything Kurikulum needs:
 *   - virtual:kurikulum-content (per-locale content bundles, tree-shaken in single-locale builds)
 *   - virtual:search-index (per-locale search entries)
 *   - single-file bundling for SCORM/cmi5 targets
 *   - import.meta.env defines (KURIKULUM_TARGET, KURIKULUM_LOCALE, KURIKULUM_LOCALES,
 *     KURIKULUM_AVAILABLE_LOCALES, KURIKULUM_DEV_LOCALE_SWITCHER, KURIKULUM_XAPI_ACTIVITY_ID)
 *   - per-target/locale outDir
 *   - post-build SCORM/cmi5 zip packaging
 */
export function kurikulum(options: KurikulumPluginOptions = {}): PluginOption[] {
  const target = (options.target ?? process.env.KURIKULUM_TARGET ?? 'standalone') as KurikulumTarget
  const xapiActivityId = options.xapiActivityId
    ?? process.env.KURIKULUM_XAPI_ACTIVITY_ID
    ?? 'https://example.com/courses/default'
  const contentDirInput = options.contentDir ?? 'src/content'
  const root = options.root ?? process.cwd()

  const isBuild = process.argv.some(a => a === 'build')
  const explicitLocale = options.locale ?? process.env.KURIKULUM_LOCALE

  const info = discoverContent(root, contentDirInput)
  let locale: string
  if (explicitLocale) {
    locale = explicitLocale
  } else {
    locale = isBuild ? (info.locales[0] ?? '') : 'auto'
  }

  if (locale && locale !== 'auto' && !info.locales.includes(locale)) {
    console.warn(`[kurikulum] requested locale '${locale}' not found at ${info.absolute}; available: [${info.locales.join(', ')}]`)
  }

  const activeLocales = locale === 'auto'
    ? info.locales
    : info.locales.includes(locale)
    ? [locale]
    : []
  const devSwitcher = !isBuild && locale === 'auto' && info.locales.length > 1

  const isScorm = target === 'scorm-1.2' || target === 'scorm-2004'
  const isCmi5 = target === 'cmi5'
  const wantsSingleFile = options.singleFile ?? true

  const outDirSuffix = explicitLocale ? `${target}-${explicitLocale}` : target
  const outDir = options.outDir ?? `dist/${outDirSuffix}`

  const plugins: PluginOption[] = []

  plugins.push({
    name: 'kurikulum-config',
    config() {
      return {
        define: {
          'import.meta.env.KURIKULUM_TARGET': JSON.stringify(target),
          'import.meta.env.KURIKULUM_XAPI_ACTIVITY_ID': JSON.stringify(xapiActivityId),
          'import.meta.env.KURIKULUM_LOCALE': JSON.stringify(locale),
          'import.meta.env.KURIKULUM_LOCALES': JSON.stringify(activeLocales),
          'import.meta.env.KURIKULUM_AVAILABLE_LOCALES': JSON.stringify(info.locales),
          'import.meta.env.KURIKULUM_DEV_LOCALE_SWITCHER': JSON.stringify(devSwitcher),
          ...mapDefine(options.env ?? {}),
        },
        build: { outDir },
        // Skip dep pre-bundling for `kurikulum`. Otherwise Vite pre-bundles the
        // root entry but not the `kurikulum/auto` subpath (it pulls in virtual
        // modules), producing two copies of the package — and two distinct
        // CourseContexts — so chrome components throw "useCourse must be used
        // within a CourseProvider". A workspace-symlinked install (the local
        // monorepo case) skips pre-bundling and avoids this; npm-installed
        // consumers hit it.
        optimizeDeps: { exclude: ['kurikulum'] },
      }
    },
  })

  if (options.content !== false) {
    plugins.push(contentPlugin({ contentDir: contentDirInput, locale, ...(options.content ?? {}) }))
  }

  if (options.search !== false) {
    plugins.push(searchIndexPlugin({ contentDir: contentDirInput, ...(options.search ?? {}) }))
  }

  if (wantsSingleFile) {
    plugins.push(viteSingleFile())
  }

  if (isScorm && options.scorm !== false) {
    const scorm = options.scorm ?? {}
    const title = scorm.title ?? 'Course'
    const zipName = explicitLocale ? `${title}-${explicitLocale}` : title
    const outputZip = scorm.outputZip ?? defaultZipPath(outDir, zipName)

    plugins.push({
      name: 'kurikulum-scorm-package',
      apply: 'build',
      async closeBundle() {
        await createScormPackage({
          outputDir: outDir,
          outputZip,
          title,
          scormVersion: target === 'scorm-2004' ? 'scorm-2004' : 'scorm-1.2',
        })
        console.log(`[kurikulum] SCORM package created: ${outputZip}`)
      },
    })
  }

  if (isCmi5 && options.cmi5 !== false) {
    const cmi5 = options.cmi5 ?? {}
    const title = cmi5.title ?? 'Course'
    const zipName = explicitLocale ? `${title}-${explicitLocale}-cmi5` : `${title}-cmi5`
    const outputZip = cmi5.outputZip ?? defaultZipPath(outDir, zipName)
    const activityId = cmi5.activityId ?? xapiActivityId

    plugins.push({
      name: 'kurikulum-cmi5-package',
      apply: 'build',
      async closeBundle() {
        await createCmi5Package({
          outputDir: outDir,
          outputZip,
          title,
          activityId,
        })
        console.log(`[kurikulum] cmi5 package created: ${outputZip}`)
      },
    })
  }

  return plugins
}

function defaultZipPath(outDir: string, name: string): string {
  const distRoot = outDir.replace(/[/\\][^/\\]+$/, '') || '.'
  return `${distRoot}/${name}.zip`
}

function mapDefine(env: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    out[`import.meta.env.${key}`] = JSON.stringify(value)
  }
  return out
}
