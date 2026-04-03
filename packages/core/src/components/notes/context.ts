import { createContext } from 'preact'

export const MAX_NOTEPAD_LENGTH = 5000

export interface NotesContextValue {
  text: string
  setText: (text: string) => void
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

export const NotesContext = createContext<NotesContextValue | null>(null)
