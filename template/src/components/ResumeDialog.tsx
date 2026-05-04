import { useFocusTrap, useLocale, useRestore } from 'kurikulum'
import type { VNode } from 'preact'
import { useRef } from 'preact/hooks'

export function ResumeDialog(): VNode | null {
  const { hasStoredState, storedPage, resume, restart } = useRestore()
  const { t } = useLocale()
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusTrap(dialogRef, hasStoredState)

  if (!hasStoredState) return null

  const locationFragment = storedPage ? t('resume.body.location', { page: storedPage }) : ''

  return (
    <div
      ref={dialogRef}
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={t('resume.aria')}
    >
      <div class="bg-bg-surface rounded-default shadow-lg max-w-md w-full mx-4 p-6 border border-border">
        <h2 class="text-lg font-semibold text-text mb-2">{t('resume.title')}</h2>
        <p class="text-text-secondary mb-6">
          {t('resume.body', { location: locationFragment })}
        </p>
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            onClick={restart}
            class="px-4 py-2 bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('resume.restart')}
          </button>
          <button
            type="button"
            onClick={resume}
            autoFocus
            class="px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('resume.continue')}
          </button>
        </div>
      </div>
    </div>
  )
}
