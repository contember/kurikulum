export type Dict = Record<string, string>

export interface LocaleContextValue {
  locale: string
  available: string[]
  setLocale(locale: string): void
  t(key: string, vars?: Record<string, string | number>): string
}
