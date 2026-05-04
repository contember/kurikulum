import type { Plugin, PluginOption } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { createCmi5Package } from '../cmi5/package.ts'
import { createScormPackage } from '../scorm/package.ts'
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
  /** Output directory. Defaults to `dist/${target}`. */
  outDir?: string
  /** Search-index plugin options. Pass false to disable. */
  search?: SearchIndexPluginOptions | false
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
}

/**
 * One-stop Vite plugin that wires up everything Kurikulum needs:
 *   - search-index virtual module
 *   - single-file bundling for SCORM/cmi5 targets
 *   - import.meta.env.KURIKULUM_TARGET / KURIKULUM_XAPI_ACTIVITY_ID defines
 *   - per-target outDir
 *   - post-build SCORM/cmi5 zip packaging
 *
 * Usage:
 *   import { kurikulum } from 'kurikulum/vite'
 *   export default defineConfig({ plugins: [preact(), kurikulum()] })
 */
export function kurikulum(options: KurikulumPluginOptions = {}): PluginOption[] {
  const target = (options.target ?? process.env.KURIKULUM_TARGET ?? 'standalone') as KurikulumTarget
  const outDir = options.outDir ?? `dist/${target}`
  const xapiActivityId = options.xapiActivityId
    ?? process.env.KURIKULUM_XAPI_ACTIVITY_ID
    ?? 'https://example.com/courses/default'

  const isScorm = target === 'scorm-1.2' || target === 'scorm-2004'
  const isCmi5 = target === 'cmi5'
  const wantsSingleFile = options.singleFile ?? true

  const plugins: PluginOption[] = []

  if (options.search !== false) {
    plugins.push(searchIndexPlugin(options.search ?? {}) as Plugin)
  }

  if (wantsSingleFile) {
    plugins.push(viteSingleFile())
  }

  plugins.push({
    name: 'kurikulum-config',
    config() {
      return {
        define: {
          'import.meta.env.KURIKULUM_TARGET': JSON.stringify(target),
          'import.meta.env.KURIKULUM_XAPI_ACTIVITY_ID': JSON.stringify(xapiActivityId),
          ...mapDefine(options.env ?? {}),
        },
        build: { outDir },
      }
    },
  })

  if (isScorm && options.scorm !== false) {
    const scorm = options.scorm ?? {}
    const title = scorm.title ?? 'Course'
    const outputZip = scorm.outputZip ?? defaultZipPath(outDir, title)

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
    const outputZip = cmi5.outputZip ?? defaultZipPath(outDir, `${title}-cmi5`)
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
