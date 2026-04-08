import type { ComponentChildren, VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { TimerContext } from './timerContext.ts'

export interface TimerProps {
  class?: string
  warningThreshold?: number // seconds — changes style when time is low (default 60)
  children?: (remaining: number, isWarning: boolean) => ComponentChildren
}

export function Timer({ class: className, warningThreshold = 60, children }: TimerProps): VNode | null {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('Assessment.Timer must be used within Assessment.Root with timeLimit')

  const isWarning = ctx.remaining <= warningThreshold && ctx.remaining > 0

  if (typeof children === 'function') {
    return <div class={className} role="timer" aria-live="polite" aria-atomic="true">{children(ctx.remaining, isWarning)}</div>
  }

  return (
    <div
      class={className}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      data-warning={isWarning || undefined}
      data-expired={ctx.isExpired || undefined}
    >
      {ctx.formatted}
    </div>
  )
}
