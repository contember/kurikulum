import { MultiSelect as MS, useLocale } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'

export interface MultiSelectProps {
  id: string
  question: string
  weight?: number
  children?: ComponentChildren
}

export function MultiSelect({ id, question, weight, children }: MultiSelectProps): VNode {
  const { t } = useLocale()
  return (
    <MS.Root id={id} weight={weight} aria-label={question}>
      <MS.Label class="font-semibold mb-2">{question}</MS.Label>
      {children}
      <MS.Submit class="mt-2 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        {t('actions.submit')}
      </MS.Submit>
    </MS.Root>
  )
}
