import { Assessment as A, useLocale } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'

export interface AssessmentProps {
  id: string
  passThreshold?: number
  maxAttempts?: number
  timeLimit?: number
  onTimeExpired?: () => void
  children?: ComponentChildren
}

export function Assessment({ id, passThreshold, maxAttempts, timeLimit, onTimeExpired, children }: AssessmentProps): VNode {
  const { t } = useLocale()
  return (
    <A.Root id={id} passThreshold={passThreshold} maxAttempts={maxAttempts} timeLimit={timeLimit} onTimeExpired={onTimeExpired}>
      {timeLimit != null && (
        <A.Timer
          warningThreshold={60}
          class="mb-4 text-lg font-mono font-semibold text-text-primary data-[warning]:text-danger data-[warning]:animate-pulse data-[expired]:text-text-secondary"
        />
      )}
      <div class="space-y-8">
        {children}
      </div>
      <A.Submit class="mt-8 px-6 py-3 bg-primary text-white text-sm font-medium rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
        {t('actions.submit')}
      </A.Submit>
      <A.Status class="mt-4 outline-none">
        {({ score, maxScore, passed }) => {
          const scoreText = score !== null && score % 1 !== 0 ? score.toFixed(1) : score
          const maxText = maxScore % 1 !== 0 ? maxScore.toFixed(1) : maxScore
          return (
            <>
              <p class="text-sm">{t('assess.score', { score: scoreText ?? '—', max: maxText })}</p>
              {passed === true ? <p class="text-success font-medium">{t('assess.passed')}</p> : null}
              {passed === false ? <p class="text-danger font-medium">{t('assess.failed')}</p> : null}
            </>
          )
        }}
      </A.Status>
      <A.Retry class="mt-2 px-5 py-2.5 bg-text-secondary text-white text-sm font-medium rounded-default hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
        {t('actions.retry')}
      </A.Retry>
      <A.AttemptsExhausted class="text-text-secondary text-sm">
        {t('assess.exhausted')}
      </A.AttemptsExhausted>
      <A.History class="mt-4 text-sm text-text-secondary" />
    </A.Root>
  )
}
