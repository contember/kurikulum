import type { ComponentChildren, VNode } from 'preact'
import { useState, useEffect, useContext, useRef, useCallback } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { AssessmentContext } from '../assessment/context.ts'
import { MCQContext } from './context.ts'

export interface MCQRootProps {
  id: string
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}

export function Root({ id, children, class: className, 'aria-label': ariaLabel }: MCQRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const { markComplete } = useCompletion(id)
  const [selected, setSelected] = useState<number | null>(null)
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const selectedRef = useRef(selected)
  selectedRef.current = selected

  // Item registration
  const counterRef = useRef(0)
  const itemsRef = useRef<{ correct: boolean }[]>([])

  const registerItem = useCallback((correct: boolean): number => {
    const index = counterRef.current++
    itemsRef.current[index] = { correct }
    return index
  }, [])

  const correctIndex = (): number => itemsRef.current.findIndex(item => item.correct)

  // Register evaluate function with Assessment parent
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, () => selectedRef.current === correctIndex())
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setSelected(null)
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const isCorrect = submitted && selected !== null ? selected === correctIndex() : null

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

  const select = useCallback((index: number) => {
    if (!submitted) setSelected(index)
  }, [submitted])

  const submit = useCallback(() => {
    if (selected !== null) setLocalSubmitted(true)
  }, [selected])

  const ctxValue = {
    registerItem,
    selected,
    select,
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
  }

  return (
    <MCQContext.Provider value={ctxValue}>
      <fieldset
        role="radiogroup"
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </MCQContext.Provider>
  )
}
