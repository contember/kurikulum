import { createContext } from 'preact'
import type { Note } from '../../types.ts'

export const MAX_NOTE_LENGTH = 200
export const MAX_NOTES_COUNT = 20

export interface NotesContextValue {
  notes: Note[]
  getNotesForPage: (pageId: string) => Note[]
  addNote: (pageId: string, text: string) => void
  removeNote: (pageId: string, index: number) => void
  updateNote: (pageId: string, index: number, text: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  currentPageId: string
}

export const NotesContext = createContext<NotesContextValue | null>(null)
