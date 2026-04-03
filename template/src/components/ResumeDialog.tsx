import type { VNode } from 'preact'
import { useRestore } from '@kurikulum/core'

export function ResumeDialog(): VNode | null {
  const { hasStoredState, storedPage, resume, restart } = useRestore()

  if (!hasStoredState) return null

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label="Pokračovat v kurzu"
    >
      <div class="bg-bg-surface rounded-default shadow-lg max-w-md w-full mx-4 p-6 border border-border">
        <h2 class="text-lg font-semibold text-text mb-2">Pokračovat v kurzu?</h2>
        <p class="text-text-secondary mb-6">
          Máte uložený postup{storedPage ? ` (stránka ${storedPage})` : ''}.
          Chcete pokračovat kde jste skončili, nebo začít od začátku?
        </p>
        <div class="flex gap-3 justify-end">
          <button
            type="button"
            onClick={restart}
            class="px-4 py-2 bg-bg-surface text-text border border-border rounded-default hover:bg-bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Začít znovu
          </button>
          <button
            type="button"
            onClick={resume}
            autoFocus
            class="px-4 py-2 bg-primary text-white rounded-default hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Pokračovat
          </button>
        </div>
      </div>
    </div>
  )
}
