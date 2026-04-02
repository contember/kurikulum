import { Root } from './Root.tsx'
import { Label } from './Label.tsx'
import { Item } from './Item.tsx'
import { Control } from './Control.tsx'
import { ItemLabel } from './ItemLabel.tsx'
import { Submit } from './Submit.tsx'
import { Feedback } from './Feedback.tsx'

export const MultiSelect = { Root, Label, Item, Control, ItemLabel, Submit, Feedback }
export { MultiSelectContext, MultiSelectItemContext } from './context.ts'
export type { MultiSelectContextValue, MultiSelectItemContextValue } from './context.ts'
