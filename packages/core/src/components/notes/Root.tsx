import type { ComponentChildren, VNode } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import { NotesContext, MAX_NOTEPAD_LENGTH } from './context.ts'
import { useCourse } from '../../hooks/useCourse.ts'

export interface NotesRootProps {
  children?: ComponentChildren
}

export function Root({ children }: NotesRootProps): VNode {
  const runtime = useCourse()
  const [text, setTextState] = useState(() => runtime.state.notepad ?? '')
  const [isOpen, setIsOpen] = useState(false)

  const setText = useCallback((value: string) => {
    const trimmed = value.slice(0, MAX_NOTEPAD_LENGTH)
    setTextState(trimmed)
    runtime.state.notepad = trimmed
  }, [runtime])

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const ctxValue = useMemo(
    () => ({ text, setText, isOpen, open, close, toggle }),
    [text, setText, isOpen, open, close, toggle],
  )

  return (
    <NotesContext.Provider value={ctxValue}>
      {children}
    </NotesContext.Provider>
  )
}
