import { Panel } from './Panel.tsx'
import { Root } from './Root.tsx'
import { Search } from './Search.tsx'
import { Term } from './Term.tsx'

export const Glossary = { Root, Panel, Term, Search }
export { GlossaryContext } from './context.ts'
export type { GlossaryContextValue, GlossaryEntry } from './context.ts'
