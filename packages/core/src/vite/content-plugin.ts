import type { Plugin } from 'vite'
import { type ContentDirInfo, discoverContent } from './content-utils.ts'

export interface ContentPluginOptions {
  /** Content directory relative to Vite root (default 'src/content'). */
  contentDir?: string
  /**
   * Active build locale. Pass 'auto' to load every locale (multi-locale dev mode).
   * Pass an explicit code (e.g. 'cs') to bake just that one in (single-locale build).
   */
  locale: string | 'auto'
  /** Fallback when locale='auto' and no runtime selection is made. Defaults to first available. */
  defaultLocale?: string
  /** Virtual module ID. Default 'virtual:kurikulum-content'. */
  moduleId?: string
}

/**
 * Generates a virtual module that exposes per-locale content bundles.
 *
 * Single-locale mode emits one static `import * as` so Vite can tree-shake.
 * Auto mode emits an eager `import.meta.glob` so every locale is in the bundle
 * (used by dev where the locale switcher needs all variants live).
 *
 * Generated shape:
 *   import bundles from 'virtual:kurikulum-content'
 *   bundles.bundles[locale]    // re-exports of content/<locale>/index.ts
 *   bundles.available          // string[]
 *   bundles.defaultLocale      // string
 */
export function contentPlugin(options: ContentPluginOptions): Plugin {
  const moduleId = options.moduleId ?? 'virtual:kurikulum-content'
  const resolvedId = '\0' + moduleId
  const contentDirInput = options.contentDir ?? 'src/content'

  let info: ContentDirInfo
  let activeLocales: string[]
  let defaultLocale: string

  return {
    name: 'kurikulum-content',
    enforce: 'pre',

    configResolved(config) {
      info = discoverContent(config.root, contentDirInput)
      const isAuto = options.locale === 'auto'
      activeLocales = isAuto ? info.locales : info.locales.includes(options.locale) ? [options.locale] : []
      defaultLocale = options.defaultLocale ?? activeLocales[0] ?? info.locales[0] ?? ''

      if (activeLocales.length === 0) {
        const hint = info.locales.length === 0
          ? `no locales found at ${info.absolute}`
          : `requested '${options.locale}' but only have [${info.locales.join(', ')}]`
        config.logger.warn(`[kurikulum-content] ${hint}`)
      }
    },

    resolveId(id) {
      if (id === moduleId) return resolvedId
    },

    load(id) {
      if (id !== resolvedId) return

      if (options.locale === 'auto') {
        const pattern = `${info.rootRelative}/*/index.ts`
        return [
          `const eager = import.meta.glob(${JSON.stringify(pattern)}, { eager: true })`,
          `export const bundles = Object.fromEntries(`,
          `  Object.entries(eager).map(([path, mod]) => {`,
          `    const m = path.match(/[/\\\\]([^/\\\\]+)[/\\\\]index\\.ts$/)`,
          `    return [m ? m[1] : path, mod]`,
          `  })`,
          `)`,
          `export const available = Object.keys(bundles).sort()`,
          `export const defaultLocale = ${JSON.stringify(defaultLocale)}`,
        ].join('\n')
      }

      const lines = activeLocales.map((loc, i) => `import * as __${i} from ${JSON.stringify(`${info.rootRelative}/${loc}/index.ts`)}`)
      const entries = activeLocales.map((loc, i) => `  ${JSON.stringify(loc)}: __${i}`).join(',\n')

      return [
        ...lines,
        `export const bundles = {\n${entries}\n}`,
        `export const available = ${JSON.stringify(activeLocales)}`,
        `export const defaultLocale = ${JSON.stringify(defaultLocale)}`,
      ].join('\n')
    },
  }
}
