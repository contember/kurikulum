import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { useLocale } from '../../i18n/index.ts'
import { GlossaryContext } from './context.ts'

export interface GlossarySearchProps {
  class?: string
  placeholder?: string
  'aria-label'?: string
}

export function Search({ class: className, placeholder, 'aria-label': ariaLabel }: GlossarySearchProps): VNode {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('Glossary.Search must be used within Glossary.Root')
  const { t } = useLocale()

  return (
    <input
      type="search"
      class={className}
      placeholder={placeholder ?? t('glossary.search')}
      value={ctx.query}
      onInput={(e) => ctx.setQuery((e.target as HTMLInputElement).value)}
      aria-label={ariaLabel ?? t('glossary.search')}
    />
  )
}
