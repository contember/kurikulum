import { useContext } from 'preact/hooks'
import { NotesContext } from '../components/notes/context.ts'
import type { NotesContextValue } from '../components/notes/context.ts'

export function useNotes(): NotesContextValue {
  const ctx = useContext(NotesContext)
  if (!ctx) {
    throw new Error('useNotes must be used within a Notes.Root')
  }
  return ctx
}
