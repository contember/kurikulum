import type { ComponentChildren, VNode } from 'preact'
import { useState, useCallback, useMemo } from 'preact/hooks'
import { NotesContext, MAX_NOTE_LENGTH, MAX_NOTES_COUNT } from './context.ts'
import type { Note } from '../../types.ts'
import { useCourse } from '../../hooks/useCourse.ts'

export interface NotesRootProps {
  children?: ComponentChildren
}

export function Root({ children }: NotesRootProps): VNode {
  const runtime = useCourse()
  const [notes, setNotes] = useState<Note[]>(() => runtime.state.notes ?? [])
  const [isOpen, setIsOpen] = useState(false)

  const syncToRuntime = useCallback((updated: Note[]) => {
    runtime.state.notes = updated
  }, [runtime])

  const getNotesForPage = useCallback(
    (pageId: string): Note[] => notes.filter((n) => n.pageId === pageId),
    [notes],
  )

  const addNote = useCallback(
    (pageId: string, text: string) => {
      const trimmed = text.slice(0, MAX_NOTE_LENGTH)
      if (!trimmed) return

      setNotes((prev) => {
        let updated = [...prev, { pageId, text: trimmed, createdAt: Date.now() }]
        if (updated.length > MAX_NOTES_COUNT) {
          console.warn(`[kurikulum] Max notes count (${MAX_NOTES_COUNT}) exceeded, removing oldest`)
          updated = updated.slice(updated.length - MAX_NOTES_COUNT)
        }
        syncToRuntime(updated)
        return updated
      })
    },
    [syncToRuntime],
  )

  const removeNote = useCallback(
    (pageId: string, index: number) => {
      setNotes((prev) => {
        const pageNotes = prev.filter((n) => n.pageId === pageId)
        if (index < 0 || index >= pageNotes.length) return prev
        const target = pageNotes[index]
        const updated = prev.filter((n) => n !== target)
        syncToRuntime(updated)
        return updated
      })
    },
    [syncToRuntime],
  )

  const updateNote = useCallback(
    (pageId: string, index: number, text: string) => {
      const trimmed = text.slice(0, MAX_NOTE_LENGTH)
      setNotes((prev) => {
        const pageNotes = prev.filter((n) => n.pageId === pageId)
        if (index < 0 || index >= pageNotes.length) return prev
        const target = pageNotes[index]
        const updated = prev.map((n) => (n === target ? { ...n, text: trimmed } : n))
        syncToRuntime(updated)
        return updated
      })
    },
    [syncToRuntime],
  )

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  const currentPageId = runtime.state.currentPage

  const ctxValue = useMemo(
    () => ({ notes, getNotesForPage, addNote, removeNote, updateNote, isOpen, open, close, toggle, currentPageId }),
    [notes, getNotesForPage, addNote, removeNote, updateNote, isOpen, open, close, toggle, currentPageId],
  )

  return (
    <NotesContext.Provider value={ctxValue}>
      {children}
    </NotesContext.Provider>
  )
}
