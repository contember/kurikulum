import type { ComponentChildren, VNode } from 'preact'
import { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { CourseContext } from '../../context.tsx'
import { AssessmentContext } from '../assessment/context.ts'
import { MatchingContext } from './context.ts'
import type { MatchingPairDef, MatchingContextValue } from './context.ts'

export interface MatchingRootProps {
  id: string
  children?: ComponentChildren
  class?: string
  'aria-label'?: string
  weight?: number
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
}: MatchingRootProps): VNode {
  const assessmentCtx = useContext(AssessmentContext)
  const courseCtx = useContext(CourseContext)
  const { markComplete } = useCompletion(id)
  const [pairs, setPairs] = useState<MatchingPairDef[]>([])
  const [selections, setSelections] = useState<Map<number, string>>(new Map())
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const mountTimeRef = useRef(Date.now())

  const selectionsRef = useRef(selections)
  selectionsRef.current = selections
  const pairsRef = useRef(pairs)
  pairsRef.current = pairs

  // Collect pairs from Pair children via registration
  const pairCounterRef = useRef(0)
  const pairsCollectedRef = useRef<MatchingPairDef[]>([])

  const registerPair = useCallback((prompt: string, response: string): number => {
    const index = pairCounterRef.current++
    pairsCollectedRef.current[index] = { prompt, response }
    return index
  }, [])

  // Finalize pairs after first render
  useEffect(() => {
    setPairs([...pairsCollectedRef.current])
  }, [])

  // Build shuffled response list from all unique responses
  const responses = useMemo(() => {
    if (pairs.length === 0) return []
    return shuffle(pairs.map(p => p.response))
  }, [pairs])

  // Evaluate: correctPairs / totalPairs
  const evaluate = useCallback((): number => {
    const p = pairsRef.current
    const sel = selectionsRef.current
    if (p.length === 0) return 0
    let correct = 0
    for (let i = 0; i < p.length; i++) {
      if (sel.get(i) === p[i].response) correct++
    }
    return correct / p.length
  }, [])

  // Register with Assessment
  useEffect(() => {
    if (!assessmentCtx) return
    return assessmentCtx.register(id, evaluate, weight, () => {
      const p = pairsRef.current
      const sel = selectionsRef.current
      return p.map((_, i) => `${p[i].prompt}:${sel.get(i) ?? ''}`).join(',')
    })
  }, [id, assessmentCtx])

  // Reset on new attempt
  useEffect(() => {
    if (assessmentCtx && assessmentCtx.attempt > 0) {
      setSelections(new Map())
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
      const p = pairsRef.current
      const sel = selectionsRef.current
      const studentPairs = p.map((_, i) => `${p[i].prompt}[.]${sel.get(i) ?? ''}`).join('[,]')
      const correctPairs = p.map(pair => `${pair.prompt}[.]${pair.response}`).join('[,]')
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

  const select = useCallback((pairIndex: number, response: string) => {
    if (submitted) return
    setSelections(prev => {
      const next = new Map(prev)
      next.set(pairIndex, response)
      return next
    })
  }, [submitted])

  const submit = useCallback(() => {
    if (selectionsRef.current.size >= pairsRef.current.length) {
      setLocalSubmitted(true)
    }
  }, [])

  const ctxValue: MatchingContextValue = useMemo(() => ({
    pairs,
    responses,
    selections,
    select,
    submitted,
    isStandalone: !assessmentCtx,
    submit,
    id,
    correct: isCorrect,
    score: scoreValue,
    registerPair,
  }), [pairs, responses, selections, select, submitted, assessmentCtx, submit, id, isCorrect, scoreValue, registerPair])

  return (
    <MatchingContext.Provider value={ctxValue}>
      <fieldset
        aria-label={ariaLabel}
        class={className}
        data-submitted={submitted || undefined}
        data-correct={submitted ? String(isCorrect) : undefined}
      >
        {children}
      </fieldset>
    </MatchingContext.Provider>
  )
}
