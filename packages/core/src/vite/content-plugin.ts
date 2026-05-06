import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
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
  /**
   * If set, the generated module is also written to this absolute path so
   * other modules (notably `kurikulum/auto`) can import it as a real file.
   * Real-file imports are resolvable by the Vite/Rolldown dep optimizer,
   * which virtual modules are not.
   */
  outFile?: string
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
 *
 * When `outFile` is set, the same module is also written to disk (using
 * absolute import paths instead of `import.meta.glob`) so it can be imported
 * from a non-Vite-aware entry point and pre-bundled by the optimizer.
 */
export function contentPlugin(options: ContentPluginOptions): Plugin {
  const moduleId = options.moduleId ?? 'virtual:kurikulum-content'
  const resolvedId = '\0' + moduleId
  const contentDirInput = options.contentDir ?? 'src/content'

  let info: ContentDirInfo
  let activeLocales: string[]
  let defaultLocale: string

  function refreshLocales() {
    const isAuto = options.locale === 'auto'
    activeLocales = isAuto ? info.locales : info.locales.includes(options.locale) ? [options.locale] : []
  }

  function generate(forFile: boolean): string {
    const isAuto = options.locale === 'auto'

    if (isAuto && !forFile) {
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

    const locales = isAuto ? info.locales : activeLocales
    const lines = locales.map((loc, i) => {
      const path = forFile
        ? resolve(info.absolute, loc, 'index.ts')
        : `${info.rootRelative}/${loc}/index.ts`
      return `import * as __${i} from ${JSON.stringify(path)}`
    })
    const entries = locales.map((loc, i) => `  ${JSON.stringify(loc)}: __${i}`).join(',\n')

    return [
      ...lines,
      `export const bundles = {\n${entries}\n}`,
      `export const available = ${JSON.stringify(locales)}`,
      `export const defaultLocale = ${JSON.stringify(defaultLocale)}`,
    ].join('\n')
  }

  function writeOutFile() {
    if (!options.outFile) return
    const out = options.outFile
    const next = generate(true)
    try {
      mkdirSync(dirname(out), { recursive: true })
      try {
        if (readFileSync(out, 'utf-8') === next) return
      } catch {
        // file doesn't exist yet — fall through to write
      }
      writeFileSync(out, next)
    } catch (err) {
      console.warn(`[kurikulum-content] failed to write ${out}: ${(err as Error).message}`)
    }
  }

  return {
    name: 'kurikulum-content',
    enforce: 'pre',

    configResolved(config) {
      info = discoverContent(config.root, contentDirInput)
      refreshLocales()
      defaultLocale = options.defaultLocale ?? activeLocales[0] ?? info.locales[0] ?? ''

      if (activeLocales.length === 0) {
        const hint = info.locales.length === 0
          ? `no locales found at ${info.absolute}`
          : `requested '${options.locale}' but only have [${info.locales.join(', ')}]`
        config.logger.warn(`[kurikulum-content] ${hint}`)
      }

      writeOutFile()
    },

    handleHotUpdate(ctx) {
      if (!info || !ctx.file.startsWith(info.absolute)) return
      const prevLocales = activeLocales.slice()
      info = discoverContent(ctx.server.config.root, contentDirInput)
      refreshLocales()
      writeOutFile()

      // Adding/removing a locale changes the structure of the disk-written
      // content module (different `bundles` keys, different imports). The
      // file change alone doesn't trigger HMR for modules that import it
      // because Vite ignores node_modules/** by default — invalidate the
      // disk file's module record explicitly so consumers re-fetch.
      const localesChanged = prevLocales.length !== activeLocales.length
        || prevLocales.some((l, i) => l !== activeLocales[i])
      if (localesChanged && options.outFile) {
        const mod = ctx.server.moduleGraph.getModuleById(options.outFile)
        if (mod) ctx.server.moduleGraph.invalidateModule(mod)
        const virtualMod = ctx.server.moduleGraph.getModuleById(resolvedId)
        if (virtualMod) ctx.server.moduleGraph.invalidateModule(virtualMod)
        ctx.server.ws.send({ type: 'full-reload' })
      }
    },

    resolveId(id) {
      if (id === moduleId) return resolvedId
    },

    load(id) {
      if (id !== resolvedId) return
      return generate(false)
    },
  }
}
