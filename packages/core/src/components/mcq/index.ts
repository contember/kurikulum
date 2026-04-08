import { Control } from './Control.tsx'
import { Feedback } from './Feedback.tsx'
import { Item } from './Item.tsx'
import { ItemLabel } from './ItemLabel.tsx'
import { Label } from './Label.tsx'
import { Root } from './Root.tsx'
import { Submit } from './Submit.tsx'

export const MCQ = { Root, Label, Item, Control, ItemLabel, Submit, Feedback }
export { MCQContext, MCQItemContext } from './context.ts'
export type { MCQContextValue, MCQItemContextValue } from './context.ts'
