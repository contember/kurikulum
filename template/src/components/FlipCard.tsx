import { useCompletion, useLocale } from 'kurikulum'
import type { ComponentChildren, VNode } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import { FlipIcon } from './Icons.tsx'

let flipCardCounter = 0

export interface FlipCardProps {
  /** Content shown before the card is flipped (the prompt / term / question). */
  front: ComponentChildren
  /** Content revealed after the card is flipped (the answer / definition). */
  back: ComponentChildren
  /** Required when `completeOnFlip` is used so completion can be tracked and restored. */
  id?: string
  /** When the page uses `completion="interactive"`, flipping the card marks it complete. */
  completeOnFlip?: boolean
}

/**
 * A click-to-flip card. The learner sees the `front`, taps it, and the `back`
 * is revealed. Pure engagement element (no scoring); set `completeOnFlip` on an
 * `interactive` page to require the learner to flip it before continuing.
 */
export function FlipCard({ front, back, id, completeOnFlip = false }: FlipCardProps): VNode {
  const { t } = useLocale()
  const [flipped, setFlipped] = useState(false)
  const [fallbackId] = useState(() => `flipcard-${++flipCardCounter}`)
  const completionId = id ?? fallbackId

  return (
    <div class="my-4">
      {completeOnFlip && <FlipCompletion id={completionId} flipped={flipped} />}
      <button
        type="button"
        onClick={() => setFlipped(f => !f)}
        aria-pressed={flipped}
        aria-label={t('flip.aria')}
        data-flipped={flipped}
        class="block w-full rounded-lg border border-border bg-bg-surface p-6 text-left transition-colors hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[flipped=true]:bg-bg-muted"
      >
        <div class="prose prose-sm max-w-none">{flipped ? back : front}</div>
        <span class="mt-4 flex items-center gap-1.5 text-xs font-medium text-text-muted">
          <FlipIcon class="h-3.5 w-3.5" />
          {t('flip.hint')}
        </span>
      </button>
    </div>
  )
}

function FlipCompletion({ id, flipped }: { id: string; flipped: boolean }): null {
  const { markComplete } = useCompletion(id)
  const markedRef = useRef(false)

  useEffect(() => {
    if (flipped && !markedRef.current) {
      markedRef.current = true
      markComplete()
    }
  }, [flipped, markComplete])

  return null
}
