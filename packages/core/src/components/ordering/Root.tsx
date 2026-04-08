import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { CourseContext } from '../../context.tsx'
import { useCompletion } from '../../hooks/index.ts'
import { AssessmentContext } from '../assessment/context.ts'
import { OrderingContext } from './context.ts'
import type { OrderingContextValue, OrderingItemDef } from './context.ts'

export interface OrderingRootProps {
  id: string
  children?: ComponentChildren
  class?: string
  'aria-label'?: string
  weight?: number
  dragEnabled?: boolean
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function Root({
  id,
  children,
  class: className,
  'aria-label': ariaLabel,
  weight,
  dragEnabled = true,
}: OrderingRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const courseCtx = useContext(CourseContext)
  const { markComplete } = useCompletion(id)
  const [items, setItems] = useState<OrderingItemDef[]>([])
  const [currentOrder, setCurrentOrder] = useState<number[]>([])
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const mountTimeRef = useRef(Date.now())

  const currentOrderRef = useRef(currentOrder)
  currentOrderRef.current = currentOrder
  const itemsRef = useRef(items)
  itemsRef.current = items

  // Collect items from Item children via registration
  const itemCounterRef = useRef(0)
  const itemsCollectedRef = useRef<OrderingItemDef[]>([])

  const registerItem = useCallback((order: number): number => {
    const index = itemCounterRef.current++
    itemsCollectedRef.current[index] = { order }
    return index
  }, [])

  // Finalize items after first render and create shuffled order
  useEffect(() => {
    const collected = [...itemsCollectedRef.current]
    setItems(collected)
    const indices = collected.map((_, i) => i)
    setCurrentOrder(shuffle(indices))
  }, [])

  // Evaluate: correctPositions / totalItems
  const evaluate = useCallback((): number => {
    const itms = itemsRef.current
    const order = currentOrderRef.current
    if (itms.length === 0) return 0
    let correct = 0
    for (let i = 0; i < order.length; i++) {
      if (itms[order[i]].order === i) correct++
    }
    return correct / itms.length
  }, [])

  // Register with Assessment
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, evaluate, weight, () => currentOrderRef.current.join(','))
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      const indices = itemsRef.current.map((_, i) => i)
      setCurrentOrder(shuffle(indices))
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
      const order = currentOrderRef.current
      const studentSeq = order.join(',')
      const correctSeq = itemsRef.current.map((item) => item.order).join(',')
      courseCtx?.adapter.recordInteraction({
        id,
        type: 'sequencing',
        studentResponse: studentSeq,
        correctResponse: correctSeq,
        result: evaluate() === 1 ? 'correct' : 'wrong',
        latency: Date.now() - mountTimeRef.current,
        weighting: weight,
      })
    }
    if (!submitted) {
      interactionRecordedRef.current = false
    }
  }, [submitted])

  // DnD state
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null)
  const [dropTargetPosition, setDropTargetPosition] = useState<number | null>(null)

  const onDragStart = useCallback((position: number) => {
    if (submitted) return
    setDraggedPosition(position)
  }, [submitted])

  const onDragOver = useCallback((position: number) => {
    setDropTargetPosition(position)
  }, [])

  const onDragEnd = useCallback(() => {
    setDraggedPosition(null)
    setDropTargetPosition(null)
  }, [])

  const onDrop = useCallback((toPosition: number) => {
    if (submitted) return
    setCurrentOrder(prev => {
      const dragPos = draggedPosition
      if (dragPos === null || dragPos === toPosition) return prev
      const next = [...prev]
      const draggedItem = next[dragPos]
      next.splice(dragPos, 1)
      next.splice(toPosition, 0, draggedItem)
      return next
    })
    setDraggedPosition(null)
    setDropTargetPosition(null)
  }, [submitted, draggedPosition])

  const moveToPosition = useCallback((fromPosition: number, toPosition: number) => {
    if (submitted) return
    if (fromPosition === toPosition) return
    setCurrentOrder(prev => {
      if (fromPosition < 0 || fromPosition >= prev.length) return prev
      if (toPosition < 0 || toPosition >= prev.length) return prev
      const next = [...prev]
      const item = next[fromPosition]
      next.splice(fromPosition, 1)
      next.splice(toPosition, 0, item)
      return next
    })
  }, [submitted])

  const moveUp = useCallback((position: number) => {
    if (submitted) return
    if (position <= 0) return
    setCurrentOrder(prev => {
      const next = [...prev]
      ;[next[position - 1], next[position]] = [next[position], next[position - 1]]
      return next
    })
  }, [submitted])

  const moveDown = useCallback((position: number) => {
    if (submitted) return
    setCurrentOrder(prev => {
      if (position >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[position], next[position + 1]] = [next[position + 1], next[position]]
      return next
    })
  }, [submitted])

  const submit = useCallback(() => {
    if (itemsRef.current.length > 0) {
      setLocalSubmitted(true)
    }
  }, [])

  const ctxValue: OrderingContextValue = useMemo(() => ({
    items,
    currentOrder,
    moveUp,
    moveDown,
    moveToPosition,
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
    score: scoreValue,
    registerItem,
    dragEnabled: dragEnabled && !submitted,
    draggedPosition,
    dropTargetPosition,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  }), [
    items,
    currentOrder,
    moveUp,
    moveDown,
    moveToPosition,
    submitted,
    assessmentCtx,
    submit,
    id,
    isCorrect,
    scoreValue,
    registerItem,
    dragEnabled,
    draggedPosition,
    dropTargetPosition,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
  ])

  return (
    <OrderingContext.Provider value={ctxValue}>
      <fieldset
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </OrderingContext.Provider>
  )
}
