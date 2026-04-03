import type { ComponentChildren, VNode } from 'preact'
import { useState, useContext, useCallback, useMemo } from 'preact/hooks'
import { GlossaryContext } from './context.ts'

export interface GlossaryTermProps {
  term: string
  class?: string
  children?: ComponentChildren
}

export function Term({ term, class: className, children }: GlossaryTermProps): VNode {
  const ctx = useContext(GlossaryContext)
  if (!ctx) throw new Error('Glossary.Term must be used within Glossary.Root')

  const [showTooltip, setShowTooltip] = useState(false)

  const entry = useMemo(
    () =>
      ctx.entries.find(
        (e) =>
          e.term.toLowerCase() === term.toLowerCase() ||
          (e.aliases ?? []).some((a) => a.toLowerCase() === term.toLowerCase()),
      ),
    [ctx.entries, term],
  )

  const show = useCallback(() => setShowTooltip(true), [])
  const hide = useCallback(() => setShowTooltip(false), [])

  if (!entry) {
    return <span class={className}>{children ?? term}</span>
  }

  return (
    <span
      class={className}
      role="button"
      tabIndex={0}
      aria-describedby={showTooltip ? `glossary-tooltip-${entry.term}` : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => ctx.open()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          ctx.open()
        }
      }}
    >
      {children ?? term}
      {showTooltip && (
        <span
          id={`glossary-tooltip-${entry.term}`}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
          }}
        >
          <strong>{entry.term}</strong>: {entry.definition}
        </span>
      )}
    </span>
  )
}
