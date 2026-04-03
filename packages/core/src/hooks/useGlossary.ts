import { useContext } from 'preact/hooks'
import { GlossaryContext } from '../components/glossary/context.ts'
import type { GlossaryContextValue } from '../components/glossary/context.ts'

export function useGlossary(): GlossaryContextValue {
  const ctx = useContext(GlossaryContext)
  if (!ctx) {
    throw new Error('useGlossary must be used within a Glossary.Root')
  }
  return ctx
}
