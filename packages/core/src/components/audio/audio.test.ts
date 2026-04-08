import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document
const HappyEvent = window.Event

import { beforeEach, describe, expect, it } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import { CourseContext, createNotifier } from '../../context.tsx'
import type { CourseContextValue } from '../../context.tsx'
import { useAudio } from '../../hooks/useAudio.ts'
import { createCourseRuntime } from '../../runtime.ts'
import type { CourseConfig, CourseRuntime, DeliveryAdapter } from '../../types.ts'
import { Audio } from './index.ts'

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    async initialize() {},
    commit() {
      this.committed++
    },
    setSuspendData(data: string) {
      this.suspendData = data
    },
    getSuspendData() {
      return this.suspendData || null
    },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) {
      this.location = pageId
    },
    getLocation() {
      return this.location || null
    },
    setSessionTime() {},
    recordInteraction() {},
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1'],
  defaultCompletion: 'manual',
}

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  const pageConditions: Record<string, () => boolean> = {}
  return {
    runtime,
    adapter: createMockAdapter(),
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
    pageConditions,
    getVisiblePages() {
      return runtime.state.pages.filter(id => {
        const cond = pageConditions[id]
        return cond ? cond() : true
      })
    },
    restoreInfo: { restored: false, storedPage: null },
    restoreDismissed: false,
    dismissRestore() {
      notify()
    },
  }
}

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

describe('Audio compound component', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let runtime: CourseRuntime
  let ctx: ReturnType<typeof createTestContext>
  let container: HTMLElement

  beforeEach(() => {
    adapter = createMockAdapter()
    runtime = createCourseRuntime(config, adapter)
    ctx = createTestContext(runtime)
    container = document.createElement('div')
  })

  it('Audio.Root renders an audio element with src', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' })),
      container,
    )
    const audios = container.getElementsByTagName('audio')
    expect(audios.length).toBe(1)
    expect(audios[0].getAttribute('src')).toBe('test.mp3')
  })

  it('Audio.Root renders with role="group" and aria-label', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' })),
      container,
    )
    const divs = container.getElementsByTagName('div')
    const group = Array.from(divs).find(el => el.getAttribute('role') === 'group')
    expect(group).not.toBeUndefined()
    expect(group!.getAttribute('aria-label')).toBe('Audio player')
  })

  it('Audio.Root renders children', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h('span', null, 'Hello'))),
      container,
    )
    const spans = container.getElementsByTagName('span')
    expect(spans.length).toBe(1)
    expect(spans[0].textContent).toBe('Hello')
  })

  it('Audio.Root sets preload="metadata"', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' })),
      container,
    )
    const audios = container.getElementsByTagName('audio')
    expect(audios[0].getAttribute('preload')).toBe('metadata')
  })

  it('Audio.Play renders a button with aria-label', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h(Audio.Play, null))),
      container,
    )
    const btns = container.getElementsByTagName('button')
    expect(btns.length).toBe(1)
    expect(btns[0].getAttribute('aria-label')).toBe('Play')
  })

  it('Audio.Play throws outside Audio.Root', () => {
    expect(() => {
      render(h(Audio.Play, null), container)
    }).toThrow('Audio.Play must be used within Audio.Root')
  })

  it('Audio.Progress renders a range input with aria-label Seek', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h(Audio.Progress, null))),
      container,
    )
    const inputs = Array.from(container.getElementsByTagName('input')) as HTMLInputElement[]
    const seekInput = inputs.find(el => el.getAttribute('aria-label') === 'Seek')
    expect(seekInput).not.toBeUndefined()
    expect(seekInput!.type).toBe('range')
  })

  it('Audio.Progress throws outside Audio.Root', () => {
    expect(() => {
      render(h(Audio.Progress, null), container)
    }).toThrow('Audio.Progress must be used within Audio.Root')
  })

  it('Audio.Time renders time display', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h(Audio.Time, null))),
      container,
    )
    const spans = container.getElementsByTagName('span')
    expect(spans.length).toBe(1)
    expect(spans[0].textContent).toBe('0:00 / 0:00')
  })

  it('Audio.Time throws outside Audio.Root', () => {
    expect(() => {
      render(h(Audio.Time, null), container)
    }).toThrow('Audio.Time must be used within Audio.Root')
  })

  it('Audio.Volume renders a range input with aria-label Volume', () => {
    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h(Audio.Volume, null))),
      container,
    )
    const inputs = Array.from(container.getElementsByTagName('input')) as HTMLInputElement[]
    const volumeInput = inputs.find(el => el.getAttribute('aria-label') === 'Volume')
    expect(volumeInput).not.toBeUndefined()
  })

  it('Audio.Volume throws outside Audio.Root', () => {
    expect(() => {
      render(h(Audio.Volume, null), container)
    }).toThrow('Audio.Volume must be used within Audio.Root')
  })
})

describe('useAudio hook', () => {
  it('throws outside Audio.Root', () => {
    expect(() => {
      const container = document.createElement('div')
      function Bad() {
        useAudio()
        return null
      }
      render(h(Bad, null), container)
    }).toThrow('useAudio must be used within an Audio.Root')
  })

  it('returns audio context within Audio.Root', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const container = document.createElement('div')
    let audioCtx: ReturnType<typeof useAudio> | null = null

    function Capture() {
      audioCtx = useAudio()
      return null
    }

    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3' }, h(Capture, null))),
      container,
    )

    expect(audioCtx).not.toBeNull()
    expect(audioCtx!.playing).toBe(false)
    expect(audioCtx!.currentTime).toBe(0)
    expect(audioCtx!.duration).toBe(0)
    expect(audioCtx!.progress).toBe(0)
    expect(audioCtx!.volume).toBe(1)
    expect(typeof audioCtx!.play).toBe('function')
    expect(typeof audioCtx!.pause).toBe('function')
    expect(typeof audioCtx!.toggle).toBe('function')
    expect(typeof audioCtx!.seek).toBe('function')
    expect(typeof audioCtx!.setVolume).toBe('function')
  })
})

describe('Audio.Play render prop', () => {
  it('calls children as function with playing state', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const container = document.createElement('div')

    render(
      h(
        CourseContext.Provider,
        { value: ctx },
        h(Audio.Root, { src: 'test.mp3' }, h(Audio.Play, null, (playing: boolean) => playing ? 'Pause' : 'Play')),
      ),
      container,
    )

    const btns = container.getElementsByTagName('button')
    expect(btns[0].textContent).toBe('Play')
  })
})

describe('Audio completeOnEnd', () => {
  it('does not mark complete initially when completeOnEnd is true', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const container = document.createElement('div')

    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3', id: 'narration', completeOnEnd: true })),
      container,
    )

    expect(runtime.isComplete('narration')).toBe(false)
  })

  it('marks complete when audio ends and completeOnEnd is true', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const container = document.createElement('div')

    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3', id: 'narration', completeOnEnd: true })),
      container,
    )

    await flushEffects()

    // Simulate audio ended event
    const audios = container.getElementsByTagName('audio')
    audios[0].dispatchEvent(new HappyEvent('ended') as unknown as Event)

    expect(runtime.isComplete('narration')).toBe(true)
  })

  it('does not mark complete when completeOnEnd is false', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)
    const container = document.createElement('div')

    render(
      h(CourseContext.Provider, { value: ctx }, h(Audio.Root, { src: 'test.mp3', id: 'narration', completeOnEnd: false })),
      container,
    )

    await flushEffects()

    const audios = container.getElementsByTagName('audio')
    audios[0].dispatchEvent(new HappyEvent('ended') as unknown as Event)

    expect(runtime.isComplete('narration')).toBe(false)
  })
})
