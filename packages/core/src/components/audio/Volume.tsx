import type { VNode } from 'preact'
import { useCallback, useContext } from 'preact/hooks'
import { useLocale } from '../../i18n/index.ts'
import { AudioContext } from './context.ts'

export interface AudioVolumeProps {
  class?: string
  'aria-label'?: string
}

export function Volume({ class: className, 'aria-label': ariaLabel }: AudioVolumeProps): VNode {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('Audio.Volume must be used within Audio.Root')
  const { t } = useLocale()

  const handleInput = useCallback((e: Event) => {
    const value = Number((e.target as HTMLInputElement).value)
    ctx.setVolume(value)
  }, [ctx])

  return (
    <input
      type="range"
      class={className}
      min={0}
      max={1}
      step={0.05}
      value={ctx.volume}
      onInput={handleInput}
      aria-label={ariaLabel ?? t('audio.volume')}
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={ctx.volume}
      aria-valuetext={`${Math.round(ctx.volume * 100)}%`}
    />
  )
}
