import type { ComponentChildren, VNode } from 'preact'
import { useState, useEffect, useContext, useRef, useCallback } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { AssessmentContext } from '../assessment/context.ts'
import { MultiSelectContext } from './context.ts'

export interface MultiSelectRootProps {
  id: string
  children: ComponentChildren
  class?: string
  'aria-label'?: string
}

export function Root({ id, children, class: className, 'aria-label': ariaLabel }: MultiSelectRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const { markComplete } = useCompletion(id)
  const [selected, setSelected] = useState<Set<number>>(new Set())
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

  const correctIndices = (): Set<number> => {
    const result = new Set<number>()
    for (let i = 0; i < itemsRef.current.length; i++) {
      if (itemsRef.current[i].correct) result.add(i)
    }
    return result
  }

  const evaluate = (): boolean => {
    const sel = selectedRef.current
    const correct = correctIndices()
    if (sel.size !== correct.size) return false
    for (const idx of correct) {
      if (!sel.has(idx)) return false
    }
    return true
  }

  // Register evaluate function with Assessment parent
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, evaluate)
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setSelected(new Set())
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const isCorrect = submitted ? evaluate() : null

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

  const toggle = useCallback((index: number) => {
    if (submitted) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [submitted])

  const submit = useCallback(() => {
    setLocalSubmitted(true)
  }, [])

  return (
    <MultiSelectContext.Provider value={{
      registerItem,
      selected,
      toggle,
      submitted,
      isStandalone: !assessmentCtx,
      submit,
      id,
      correct: isCorrect,
    }}>
      <fieldset
        role="group"
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </MultiSelectContext.Provider>
  )
}
