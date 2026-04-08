import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { CourseContext } from '../../context.tsx'
import { useCompletion } from '../../hooks/index.ts'
import { AssessmentContext } from '../assessment/context.ts'
import { MultiSelectContext } from './context.ts'

export interface MultiSelectRootProps {
  id: string
  weight?: number
  children?: ComponentChildren
  class?: string
  'aria-label'?: string
}

export function Root({ id, weight, children, class: className, 'aria-label': ariaLabel }: MultiSelectRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const courseCtx = useContext(CourseContext)
  const { markComplete } = useCompletion(id)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const selectedRef = useRef(selected)
  selectedRef.current = selected
  const mountTimeRef = useRef(Date.now())

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

  const evaluate = (): number => {
    const sel = selectedRef.current
    const correct = correctIndices()
    const totalCorrect = correct.size
    if (totalCorrect === 0) return 1

    let correctSelected = 0
    let incorrectSelected = 0

    for (const idx of sel) {
      if (correct.has(idx)) {
        correctSelected++
      } else {
        incorrectSelected++
      }
    }

    return Math.max(0, (correctSelected - incorrectSelected) / totalCorrect)
  }

  // Register evaluate function with Assessment parent
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, evaluate, weight, () => [...selectedRef.current].sort((a, b) => a - b).join(','))
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setSelected(new Set())
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const isCorrect = submitted ? evaluate() === 1 : null

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

  // Record interaction on submit
  const interactionRecordedRef = useRef(false)
  useEffect(() => {
    if (submitted && !interactionRecordedRef.current) {
      interactionRecordedRef.current = true
      const sel = [...selectedRef.current].sort((a, b) => a - b).join(',')
      const correct = [...correctIndices()].sort((a, b) => a - b).join(',')
      courseCtx?.adapter.recordInteraction({
        id,
        type: 'choice',
        studentResponse: sel,
        correctResponse: correct,
        result: evaluate() === 1 ? 'correct' : 'wrong',
        latency: Date.now() - mountTimeRef.current,
        weighting: weight,
      })
    }
    if (!submitted) {
      interactionRecordedRef.current = false
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

  const fieldsetRef = useRef<HTMLFieldSetElement>(null)

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (submitted) return
    const isArrow = e.key === 'ArrowDown' || e.key === 'ArrowUp'
    if (!isArrow) return

    const checkboxes = fieldsetRef.current?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    if (!checkboxes?.length) return

    const currentIdx = Array.from(checkboxes).indexOf(document.activeElement as HTMLInputElement)
    if (currentIdx === -1) return

    e.preventDefault()
    let nextIdx: number
    if (e.key === 'ArrowDown') {
      nextIdx = (currentIdx + 1) % checkboxes.length
    } else {
      nextIdx = (currentIdx - 1 + checkboxes.length) % checkboxes.length
    }
    checkboxes[nextIdx].focus()
  }, [submitted])

  const ctxValue = useMemo(() => ({
    registerItem,
    selected,
    toggle,
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
  }), [registerItem, selected, toggle, submitted, assessmentCtx, submit, id, isCorrect])

  return (
    <MultiSelectContext.Provider value={ctxValue}>
      <fieldset
        ref={fieldsetRef}
        role="group"
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
        onKeyDown={onKeyDown}
      >
        {children}
      </fieldset>
    </MultiSelectContext.Provider>
  )
}
