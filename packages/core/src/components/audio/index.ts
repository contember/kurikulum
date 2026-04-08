import { Play } from './Play.tsx'
import { Progress } from './Progress.tsx'
import { Root } from './Root.tsx'
import { Time } from './Time.tsx'
import { Volume } from './Volume.tsx'

export const Audio = { Root, Play, Progress, Time, Volume }
export { AudioContext } from './context.ts'
export type { AudioContextValue } from './context.ts'
