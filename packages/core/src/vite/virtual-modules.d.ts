declare module '@kurikulum/content-bundle' {
  import type { ContentBundle } from 'kurikulum'
  export const bundles: Record<string, ContentBundle>
  export const available: string[]
  export const defaultLocale: string
}

declare module 'virtual:kurikulum-content' {
  import type { ContentBundle } from 'kurikulum'
  export const bundles: Record<string, ContentBundle>
  export const available: string[]
  export const defaultLocale: string
}

declare module 'virtual:search-index' {
  import type { SearchEntry } from 'kurikulum'
  const index: Record<string, SearchEntry[]>
  export default index
}

interface ImportMetaEnv {
  readonly KURIKULUM_TARGET: string
  readonly KURIKULUM_LOCALE: string
  readonly KURIKULUM_LOCALES: readonly string[]
  readonly KURIKULUM_AVAILABLE_LOCALES: readonly string[]
  readonly KURIKULUM_DEV_LOCALE_SWITCHER: boolean
  readonly KURIKULUM_XAPI_ACTIVITY_ID: string
}
