import { Next } from './Next.tsx'
import { Prev } from './Prev.tsx'
import { Progress } from './Progress.tsx'
import { Root } from './Root.tsx'

export const Navigation = { Root, Prev, Next, Progress }
export { NavigationContext } from './context.ts'
export type { NavigationContextValue } from './context.ts'
