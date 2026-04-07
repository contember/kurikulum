import { Root } from './Root.tsx'
import { Label } from './Label.tsx'
import { Pair } from './Pair.tsx'
import { Prompt } from './Prompt.tsx'
import { Response } from './Response.tsx'
import { Slot } from './Slot.tsx'
import { ResponseChip } from './ResponseChip.tsx'
import { Submit } from './Submit.tsx'
import { Feedback } from './Feedback.tsx'

export const Matching = { Root, Label, Pair, Prompt, Response, Slot, ResponseChip, Submit, Feedback }
export { MatchingContext } from './context.ts'
export type { MatchingContextValue } from './context.ts'
export type { MatchingSlotRenderProps } from './Slot.tsx'
