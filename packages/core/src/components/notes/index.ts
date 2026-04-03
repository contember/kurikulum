import { Root } from './Root.tsx'
import { Panel } from './Panel.tsx'
import { Editor } from './Editor.tsx'
import { Indicator } from './Indicator.tsx'

export const Notes = { Root, Panel, Editor, Indicator }
export { NotesContext } from './context.ts'
export type { NotesContextValue } from './context.ts'
export { MAX_NOTE_LENGTH, MAX_NOTES_COUNT } from './context.ts'
