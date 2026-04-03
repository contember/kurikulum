import type { ComponentChildren, VNode } from 'preact'
import { Assessment as A } from '@kurikulum/core'

export interface AssessmentProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  children?: ComponentChildren
}

export function Assessment({ id, passThreshold, maxAttempts, children }: AssessmentProps): VNode {
  return (
    <A.Root id={id} passThreshold={passThreshold} maxAttempts={maxAttempts}>
      {children}
      <A.Submit class="mt-4 px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Odeslat
      </A.Submit>
      <A.Status class="mt-4 outline-none">
        {({ score, maxScore, passed }) => (
          <>
            <p>Skóre: {score !== null && score % 1 !== 0 ? score.toFixed(1) : score}/{maxScore % 1 !== 0 ? maxScore.toFixed(1) : maxScore}</p>
            {passed === true ? <p class="text-success">✓ Splněno!</p> : null}
            {passed === false ? <p class="text-danger">✗ Nesplněno.</p> : null}
          </>
        )}
      </A.Status>
      <A.Retry class="mt-2 px-4 py-2 bg-text-secondary text-white rounded-default hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Zkusit znovu
      </A.Retry>
      <A.AttemptsExhausted class="text-text-secondary">
        Vyčerpány všechny pokusy.
      </A.AttemptsExhausted>
      <A.History class="mt-4 text-sm text-text-secondary" />
    </A.Root>
  )
}
