import { createContext } from 'preact'
import type { ComponentType } from 'preact'
import { useContext } from 'preact/hooks'
import type { GlossaryEntry } from '../components/glossary/context.ts'

/**
 * Per-locale content bundle. Shape of `content/<locale>/index.ts` re-exports.
 * Authors may attach arbitrary extra fields — only `pages` is consumed by Page.
 */
export interface ContentBundle {
  title: string
  glossary?: GlossaryEntry[]
  pages: Record<string, ComponentType>
  [key: string]: unknown
}

export const ContentBundleContext = createContext<ContentBundle | null>(null)

/**
 * Returns the active locale's content bundle, or null if no bundle has been
 * provided (e.g. headless usage without KurikulumApp).
 */
export function useContentBundle(): ContentBundle | null {
  return useContext(ContentBundleContext)
}
