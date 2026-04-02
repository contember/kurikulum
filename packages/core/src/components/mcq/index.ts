import { Root } from './Root.tsx'
import { Label } from './Label.tsx'
import { Item } from './Item.tsx'
import { Control } from './Control.tsx'
import { ItemLabel } from './ItemLabel.tsx'
import { Submit } from './Submit.tsx'
import { Feedback } from './Feedback.tsx'

export const MCQ = { Root, Label, Item, Control, ItemLabel, Submit, Feedback }
export { MCQContext, MCQItemContext } from './context.ts'
export type { MCQContextValue, MCQItemContextValue } from './context.ts'
