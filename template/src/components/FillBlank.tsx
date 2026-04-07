import type { ComponentChildren, VNode } from 'preact'
import { FillBlank as FB } from '@kurikulum/core'

export interface FillBlankProps {
  id: string
  question: string
  accept: string | string[] | RegExp
  caseSensitive?: boolean
  weight?: number
  placeholder?: string
  children?: ComponentChildren
}

export function FillBlank({ id, question, accept, caseSensitive, weight, placeholder, children }: FillBlankProps): VNode {
  return (
    <FB.Root id={id} accept={accept} caseSensitive={caseSensitive} weight={weight} aria-label={question}>
      <FB.Label class="text-base font-semibold text-text mb-3">{question}</FB.Label>
      <FB.Input
        placeholder={placeholder}
        class="mt-1 w-full px-3 py-2 border border-border rounded-default bg-surface text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed data-[correct=true]:border-success data-[correct=false]:border-error"
      />
      {children}
      <FB.Submit class="mt-3 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
        Odeslat
      </FB.Submit>
    </FB.Root>
  )
}
