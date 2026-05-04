import { coreDictCs, coreDictEn, type Dict } from 'kurikulum'

/**
 * Per-locale dictionaries for this template. Built from kurikulum's chrome
 * defaults; spread your own course-specific overrides into a locale entry to
 * customise.
 */
export const dictionaries: Record<string, Dict> = {
  cs: { ...coreDictCs },
  en: { ...coreDictEn },
}
