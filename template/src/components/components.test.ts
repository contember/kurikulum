import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document
// Stub IntersectionObserver for scroll strategy tests
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(private callback: IntersectionObserverCallback, private options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as any

import { describe, it, expect } from 'bun:test'
import { h } from 'preact'
import { render } from 'preact'
import type { CourseConfig, DeliveryAdapter, CourseRuntime } from '@kurikulum/core'
import {
  CourseContext,
  createNotifier,
  createCourseRuntime,
} from '@kurikulum/core'
import type { CourseContextValue } from '@kurikulum/core'
import { Course } from './Course.tsx'
import { Page } from './Page.tsx'
import { Navigation } from './Navigation.tsx'
import { Text } from './Text.tsx'
import { Image } from './Image.tsx'
import { Video } from './Video.tsx'

function flushEffects(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 50))
}

function createMockAdapter(): DeliveryAdapter & { committed: number; suspendData: string; location: string } {
  return {
    committed: 0,
    suspendData: '',
    location: '',
    async initialize() {},
    commit() { this.committed++ },
    setSuspendData(data: string) { this.suspendData = data },
    getSuspendData() { return this.suspendData || null },
    setScore() {},
    setStatus() {},
    setLocation(pageId: string) { this.location = pageId },
    getLocation() { return this.location || null },
    setSessionTime() {},
    terminate() {},
  }
}

const config: CourseConfig = {
  title: 'Test Course',
  pages: ['page-1', 'page-2', 'page-3'],
  defaultCompletion: 'manual',
}

function createTestContext(runtime: CourseRuntime): CourseContextValue & { notify: () => void } {
  const { subscribe, notify } = createNotifier()
  return {
    runtime,
    subscribe,
    notify,
    defaultCompletion: config.defaultCompletion ?? 'mount',
  }
}

describe('Course', () => {
  it('renders only the active page', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Course, null,
          h(Page, { id: 'page-1' }, 'Page 1 content'),
          h(Page, { id: 'page-2' }, 'Page 2 content'),
          h(Page, { id: 'page-3' }, 'Page 3 content'),
        ),
      ),
      container,
    )

    expect(container.textContent).toContain('Page 1 content')
    expect(container.textContent).not.toContain('Page 2 content')
    expect(container.textContent).not.toContain('Page 3 content')
  })

  it('switches to new page after navigation', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    function App() {
      return h(CourseContext.Provider, { value: ctx } as any,
        h(Course, null,
          h(Page, { id: 'page-1' }, 'Page 1 content'),
          h(Page, { id: 'page-2' }, 'Page 2 content'),
        ),
      )
    }

    render(h(App, null), container)
    expect(container.textContent).toContain('Page 1 content')

    runtime.navigateTo('page-2')
    ctx.notify()

    render(h(App, null), container)
    expect(container.textContent).toContain('Page 2 content')
    expect(container.textContent).not.toContain('Page 1 content')
  })

  it('returns null when no matching page found', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    runtime.navigateTo('page-1')
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Course, null,
          h(Page, { id: 'nonexistent' }, 'Nope'),
        ),
      ),
      container,
    )

    expect(container.textContent).toBe('')
  })
})

describe('Page', () => {
  it('renders children', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1' }, 'Hello from page'),
      ),
      container,
    )

    expect(container.textContent).toContain('Hello from page')
  })

  it('marks page complete with mount strategy', async () => {
    const mountConfig: CourseConfig = {
      title: 'Test',
      pages: ['page-1'],
      defaultCompletion: 'mount',
    }
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(mountConfig, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1', completion: 'mount' }, 'Content'),
      ),
      container,
    )

    await flushEffects()
    expect(runtime.isComplete('page-1')).toBe(true)
  })

  it('does not auto-complete with manual strategy', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1', completion: 'manual' }, 'Content'),
      ),
      container,
    )

    await flushEffects()
    expect(runtime.isComplete('page-1')).toBe(false)
  })

  it('marks page complete with timer strategy', async () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1', completion: 'timer', completionTimer: 0.05 }, 'Content'),
      ),
      container,
    )

    expect(runtime.isComplete('page-1')).toBe(false)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(runtime.isComplete('page-1')).toBe(true)
  })

  it('renders scroll sentinel for scroll strategy', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1', completion: 'scroll' }, 'Content'),
      ),
      container,
    )

    // Check that a div with aria-hidden is rendered as scroll sentinel
    const divs = container.getElementsByTagName('div')
    let hasSentinel = false
    for (let i = 0; i < divs.length; i++) {
      if (divs[i].getAttribute('aria-hidden') === 'true') {
        hasSentinel = true
        break
      }
    }
    expect(hasSentinel).toBe(true)
  })
})

describe('Navigation', () => {
  it('renders navigation with correct progress', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )

    expect(container.textContent).toContain('1 / 3')
  })

  it('has ARIA attributes on nav element', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )

    const navs = container.getElementsByTagName('nav')
    expect(navs.length).toBe(1)
    expect(navs[0].getAttribute('role')).toBe('navigation')
    expect(navs[0].getAttribute('aria-label')).toBe('Navigace kurzu')
  })

  it('disables prev button on first page', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )

    const buttons = container.getElementsByTagName('button')
    expect(buttons[0].disabled).toBe(true)   // prev
    expect(buttons[1].disabled).toBe(false)  // next
  })

  it('disables next button on last page', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    runtime.navigateTo('page-3')
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )

    const buttons = container.getElementsByTagName('button')
    expect(buttons[0].disabled).toBe(false)  // prev
    expect(buttons[1].disabled).toBe(true)   // next
  })

  it('navigates when buttons are clicked', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    function App() {
      return h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      )
    }

    render(h(App, null), container)

    const buttons = container.getElementsByTagName('button')
    // Click next
    buttons[1].click()
    ctx.notify()

    render(h(App, null), container)
    expect(container.textContent).toContain('2 / 3')
    expect(runtime.state.currentPage).toBe('page-2')

    // Click prev
    const buttons2 = container.getElementsByTagName('button')
    buttons2[0].click()
    ctx.notify()

    render(h(App, null), container)
    expect(container.textContent).toContain('1 / 3')
    expect(runtime.state.currentPage).toBe('page-1')
  })
})

describe('Text', () => {
  it('renders children in a prose div', () => {
    const container = document.createElement('div')
    render(h(Text, null, 'Hello world'), container)

    expect(container.textContent).toContain('Hello world')
    const div = container.firstElementChild as HTMLElement
    expect(div.tagName).toBe('DIV')
    expect(div.className).toContain('prose')
  })
})

describe('Image', () => {
  it('renders figure with img and alt text', () => {
    const container = document.createElement('div')
    render(h(Image, { src: '/photo.jpg', alt: 'A photo' }), container)

    const figures = container.getElementsByTagName('figure')
    expect(figures.length).toBe(1)

    const imgs = container.getElementsByTagName('img')
    expect(imgs.length).toBe(1)
    expect(imgs[0].getAttribute('src')).toBe('/photo.jpg')
    expect(imgs[0].getAttribute('alt')).toBe('A photo')
    expect(imgs[0].className).toContain('max-w-full')
  })

  it('renders figcaption when caption is provided', () => {
    const container = document.createElement('div')
    render(h(Image, { src: '/photo.jpg', alt: 'A photo', caption: 'My caption' }), container)

    const captions = container.getElementsByTagName('figcaption')
    expect(captions.length).toBe(1)
    expect(captions[0].textContent).toBe('My caption')
  })

  it('does not render figcaption without caption', () => {
    const container = document.createElement('div')
    render(h(Image, { src: '/photo.jpg', alt: 'A photo' }), container)

    const captions = container.getElementsByTagName('figcaption')
    expect(captions.length).toBe(0)
  })
})

describe('Video', () => {
  it('renders video with controls', () => {
    const container = document.createElement('div')
    render(h(Video, { src: '/video.mp4' }), container)

    const figures = container.getElementsByTagName('figure')
    expect(figures.length).toBe(1)

    const videos = container.getElementsByTagName('video')
    expect(videos.length).toBe(1)
    expect(videos[0].getAttribute('src')).toBe('/video.mp4')
    expect(videos[0].hasAttribute('controls')).toBe(true)
  })

  it('renders with poster', () => {
    const container = document.createElement('div')
    render(h(Video, { src: '/video.mp4', poster: '/poster.jpg' }), container)

    const videos = container.getElementsByTagName('video')
    expect(videos[0].getAttribute('poster')).toBe('/poster.jpg')
  })

  it('renders figcaption when caption is provided', () => {
    const container = document.createElement('div')
    render(h(Video, { src: '/video.mp4', caption: 'Video caption' }), container)

    const captions = container.getElementsByTagName('figcaption')
    expect(captions.length).toBe(1)
    expect(captions[0].textContent).toBe('Video caption')
  })

  it('does not render figcaption without caption', () => {
    const container = document.createElement('div')
    render(h(Video, { src: '/video.mp4' }), container)

    const captions = container.getElementsByTagName('figcaption')
    expect(captions.length).toBe(0)
  })

  it('works inside a Page component', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1', completion: 'manual' },
          h(Text, null, 'Some text'),
          h(Image, { src: '/img.png', alt: 'Image' }),
          h(Video, { src: '/vid.mp4' }),
        ),
      ),
      container,
    )

    expect(container.textContent).toContain('Some text')
    expect(container.getElementsByTagName('img').length).toBe(1)
    expect(container.getElementsByTagName('video').length).toBe(1)
  })
})
