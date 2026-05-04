import type { ComponentChildren, VNode } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { useCompletion } from '../../hooks/index.ts'
import { useLocale } from '../../i18n/index.ts'
import { AudioContext } from './context.ts'

export interface AudioRootProps {
  src: string
  autoplay?: boolean
  completeOnEnd?: boolean
  class?: string
  children?: ComponentChildren
  id?: string
  'aria-label'?: string
}

export function Root(
  { src, autoplay = false, completeOnEnd = false, class: className, children, id, 'aria-label': ariaLabel }: AudioRootProps,
): VNode {
  const { t } = useLocale()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(1)

  const completionId = id ?? `audio-${src}`
  const { markComplete } = useCompletion(completionId)
  const markedRef = useRef(false)

  const play = useCallback(() => {
    audioRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current.play()
    } else {
      audioRef.current?.pause()
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, v))
    }
  }, [])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTimeUpdate = () => setCurrentTime(el.currentTime)
    const onDurationChange = () => setDuration(el.duration)
    const onLoadedMetadata = () => setDuration(el.duration)
    const onVolumeChange = () => setVolumeState(el.volume)
    const onEnded = () => {
      setPlaying(false)
      if (completeOnEnd && !markedRef.current) {
        markedRef.current = true
        markComplete()
      }
    }

    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('loadedmetadata', onLoadedMetadata)
    el.addEventListener('volumechange', onVolumeChange)
    el.addEventListener('ended', onEnded)

    return () => {
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('loadedmetadata', onLoadedMetadata)
      el.removeEventListener('volumechange', onVolumeChange)
      el.removeEventListener('ended', onEnded)
    }
  }, [completeOnEnd, markComplete])

  const progress = duration > 0 ? currentTime / duration : 0

  const ctxValue = {
    playing,
    currentTime,
    duration,
    progress,
    volume,
    play,
    pause,
    toggle,
    seek,
    setVolume,
    audioRef,
  }

  return (
    <AudioContext.Provider value={ctxValue}>
      <div class={className} role="group" aria-label={ariaLabel ?? t('audio.player')}>
        <audio ref={audioRef} src={src} autoplay={autoplay} preload="metadata" />
        {children}
      </div>
    </AudioContext.Provider>
  )
}
