import { createContext } from 'preact'
import type { RefObject } from 'preact'

export interface AudioContextValue {
  playing: boolean
  currentTime: number
  duration: number
  progress: number // 0–1
  volume: number   // 0–1
  play: () => void
  pause: () => void
  toggle: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  audioRef: RefObject<HTMLAudioElement>
}

export const AudioContext = createContext<AudioContextValue | null>(null)
