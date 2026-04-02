import type { VNode } from 'preact'
import { useContext } from 'preact/hooks'
import { FillBlankContext } from './context.ts'

export interface FillBlankInputProps {
  class?: string
  placeholder?: string
}

export function Input({ class: className, placeholder }: FillBlankInputProps): VNode {
  const ctx = useContext(FillBlankContext)
  if (!ctx) throw new Error('FillBlank.Input must be used within FillBlank.Root')

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && ctx.isStandalone && !ctx.submitted) {
      ctx.submit()
    }
  }

  return (
    <input
      type="text"
      id={`${ctx.id}-input`}
      value={ctx.value}
      onInput={(e) => ctx.setValue((e.target as HTMLInputElement).value)}
      onKeyDown={handleKeyDown}
      disabled={ctx.submitted}
      placeholder={placeholder}
      class={className}
      aria-disabled={ctx.submitted}
      data-correct={ctx.submitted ? String(ctx.correct) : undefined}
    />
  )
}
