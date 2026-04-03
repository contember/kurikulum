import type { ComponentChildren, VNode } from 'preact'
import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { CourseContext } from '../../context.tsx'
import { AssessmentContext } from '../assessment/context.ts'
import { CategorySortContext } from './context.ts'
import type { CategoryDef, CategoryItemDef, CategorySortContextValue } from './context.ts'

export interface CategorySortRootProps {
  id: string
  categories: CategoryDef[]
  items: CategoryItemDef[]
  partialCredit?: boolean
  children?: ComponentChildren
  class?: string
  'aria-label'?: string
  weight?: number
}

export function Root({
  id,
  categories,
  items,
  partialCredit = true,
  children,
  class: className,
  'aria-label': ariaLabel,
  weight,
}: CategorySortRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const courseCtx = useContext(CourseContext)
  const { markComplete } = useCompletion(id)
  const [assignments, setAssignments] = useState<Map<string, string>>(new Map())
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const mountTimeRef = useRef(Date.now())

  const assignmentsRef = useRef(assignments)
  assignmentsRef.current = assignments

  // DnD state
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dropTargetCategoryId, setDropTargetCategoryId] = useState<string | null>(null)

  // Evaluate: correctAssignments / totalItems
  const evaluate = useCallback((): number => {
    const sel = assignmentsRef.current
    if (items.length === 0) return 0
    let correct = 0
    for (const item of items) {
      if (sel.get(item.id) === item.category) correct++
    }
    if (partialCredit) {
      return correct / items.length
    }
    return correct === items.length ? 1 : 0
  }, [items, partialCredit])

  // Register with Assessment
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, evaluate, weight, () => {
      const sel = assignmentsRef.current
      return items.map(item => `${item.id}:${sel.get(item.id) ?? ''}`).join(',')
    })
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setAssignments(new Map())
      setLocalSubmitted(false)
    }
  }, [assessmentCtx?.attempt])

  const submitted = assessmentCtx ? assessmentCtx.submitted : localSubmitted
  const scoreValue = submitted ? evaluate() : null
  const isCorrect = scoreValue !== null ? scoreValue === 1 : null

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
      const sel = assignmentsRef.current
      const studentPairs = items.map(item => `${item.id}[.]${sel.get(item.id) ?? ''}`).join('[,]')
      const correctPairs = items.map(item => `${item.id}[.]${item.category}`).join('[,]')
      courseCtx?.adapter.recordInteraction({
        id,
        type: 'matching',
        studentResponse: studentPairs,
        correctResponse: correctPairs,
        result: evaluate() === 1 ? 'correct' : 'wrong',
        latency: Date.now() - mountTimeRef.current,
        weighting: weight,
      })
    }
    if (!submitted) {
      interactionRecordedRef.current = false
    }
  }, [submitted])

  const assign = useCallback((itemId: string, categoryId: string) => {
    if (submitted) return
    setAssignments(prev => {
      const next = new Map(prev)
      next.set(itemId, categoryId)
      return next
    })
  }, [submitted])

  const unassign = useCallback((itemId: string) => {
    if (submitted) return
    setAssignments(prev => {
      const next = new Map(prev)
      next.delete(itemId)
      return next
    })
  }, [submitted])

  const submit = useCallback(() => {
    if (assignmentsRef.current.size >= items.length) {
      setLocalSubmitted(true)
    }
  }, [items.length])

  // DnD handlers
  const onDragStart = useCallback((itemId: string) => {
    if (submitted) return
    setDraggedItemId(itemId)
  }, [submitted])

  const onDragOverCategory = useCallback((categoryId: string) => {
    setDropTargetCategoryId(categoryId)
  }, [])

  const onDragEnd = useCallback(() => {
    setDraggedItemId(null)
    setDropTargetCategoryId(null)
  }, [])

  const onDropOnCategory = useCallback((categoryId: string) => {
    if (submitted) return
    const itemId = draggedItemId
    if (itemId) {
      setAssignments(prev => {
        const next = new Map(prev)
        next.set(itemId, categoryId)
        return next
      })
    }
    setDraggedItemId(null)
    setDropTargetCategoryId(null)
  }, [submitted, draggedItemId])

  const ctxValue: CategorySortContextValue = useMemo(() => ({
    categories,
    items,
    assignments,
    assign,
    unassign,
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
    score: scoreValue,
    draggedItemId,
    dropTargetCategoryId,
    onDragStart,
    onDragOverCategory,
    onDragEnd,
    onDropOnCategory,
  }), [categories, items, assignments, assign, unassign, submitted, assessmentCtx, submit, id, isCorrect, scoreValue, draggedItemId, dropTargetCategoryId, onDragStart, onDragOverCategory, onDragEnd, onDropOnCategory])

  return (
    <CategorySortContext.Provider value={ctxValue}>
      <fieldset
        aria-label={ariaLabel ?? `Category sort: ${id}`}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </CategorySortContext.Provider>
  )
}
