import type { ComponentChildren, VNode } from 'preact'
import { useState, useEffect, useContext, useRef, useCallback } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { AssessmentContext } from '../assessment/context.ts'
import { FillBlankContext } from './context.ts'

export interface FillBlankRootProps {
  id: string
  accept: string | string[] | RegExp
  caseSensitive?: boolean
  weight?: number
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}

function evaluate(value: string, accept: string | string[] | RegExp, caseSensitive: boolean): boolean {
  const trimmed = value.trim()
  if (accept instanceof RegExp) {
    return accept.test(trimmed)
  }
  if (Array.isArray(accept)) {
    return accept.some(a =>
      caseSensitive ? trimmed === a : trimmed.toLowerCase() === a.toLowerCase()
    )
  }
  return caseSensitive ? trimmed === accept : trimmed.toLowerCase() === accept.toLowerCase()
}

export function Root({
  id,
  accept,
  caseSensitive = false,
  weight,
  children,
  class: className,
  'aria-label': ariaLabel,
}: FillBlankRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const { markComplete } = useCompletion(id)
  const [value, setValue] = useState('')
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const valueRef = useRef(value)
  valueRef.current = value

  // Register evaluate function with Assessment parent
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(
      id,
      () => evaluate(valueRef.current, accept, caseSensitive) ? 1 : 0,
      weight,
    )
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setValue('')
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const isCorrect = submitted ? evaluate(value, accept, caseSensitive) : null

  // Mark complete on submit
  const markedRef = useRef(false)
  useEffect(() => {
    if (submitted && !markedRef.current) {
      markedRef.current = true
      markComplete()
    }
    if (!submitted) {
      markedRef.current = false
    }
  }, [submitted])

  const submit = useCallback(() => {
    if (value.trim() !== '') setLocalSubmitted(true)
  }, [value])

  const ctxValue = {
    value,
    setValue: useCallback((v: string) => {
      if (!submitted) setValue(v)
    }, [submitted]),
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
  }

  return (
    <FillBlankContext.Provider value={ctxValue}>
      <fieldset
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </FillBlankContext.Provider>
  )
}
