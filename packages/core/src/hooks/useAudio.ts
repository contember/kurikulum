import { useContext } from 'preact/hooks'
import { AudioContext } from '../components/audio/context.ts'
import type { AudioContextValue } from '../components/audio/context.ts'

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext)
  if (!ctx) {
    throw new Error('useAudio must be used within an Audio.Root')
  }
  return ctx
}
