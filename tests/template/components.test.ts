import { Window as HappyWindow } from 'happy-dom'

const window = new HappyWindow()
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
import { Course } from '../../template/src/components/Course.tsx'
import { Page } from '../../template/src/components/Page.tsx'
import { Navigation } from '../../template/src/components/Navigation.tsx'
import { Text } from '../../template/src/components/Text.tsx'
import { Image } from '../../template/src/components/Image.tsx'
import { Video } from '../../template/src/components/Video.tsx'

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
    recordInteraction() {},
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
  }
}

describe('Course', () => {
  it('renders all pages but hides inactive ones', () => {
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

    // All page content is in the DOM
    expect(container.textContent).toContain('Page 1 content')
    expect(container.textContent).toContain('Page 2 content')
    expect(container.textContent).toContain('Page 3 content')

    // Find page wrappers by data-page-id on the main divs
    const divs = Array.from(container.getElementsByTagName('div'))
    const pageDivs = divs.filter(d => d.getAttribute('data-page-id'))
    expect(pageDivs.length).toBe(3)

    // Inactive pages have display:none on their wrapper parent
    expect(pageDivs[0].parentElement!.style.display).not.toBe('none') // page-1 active
    expect(pageDivs[1].parentElement!.style.display).toBe('none')     // page-2 hidden
    expect(pageDivs[2].parentElement!.style.display).toBe('none')     // page-3 hidden
  })

  it('switches visible page after navigation', () => {
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
    const getPageWrappers = () => {
      const divs = Array.from(container.getElementsByTagName('div'))
      return divs.filter(d => d.getAttribute('data-page-id')).map(d => d.parentElement!)
    }

    // page-1 visible, page-2 hidden
    expect(getPageWrappers()[0].style.display).not.toBe('none')
    expect(getPageWrappers()[1].style.display).toBe('none')

    runtime.navigateTo('page-2')
    ctx.notify()

    render(h(App, null), container)
    // page-2 visible, page-1 hidden
    expect(getPageWrappers()[0].style.display).toBe('none')
    expect(getPageWrappers()[1].style.display).not.toBe('none')
  })

  it('renders skip-to-content link', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Course, null,
          h(Page, { id: 'page-1' }, 'Page 1 content'),
        ),
      ),
      container,
    )

    const links = Array.from(container.getElementsByTagName('a'))
    const skipLink = links.find(a => a.getAttribute('href') === '#page-content')
    expect(skipLink).toBeDefined()
    expect(skipLink!.textContent).toBe('Přeskočit na obsah')
  })

  it('hides pages that do not match current page', () => {
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

    // The page is rendered but hidden
    const divs = Array.from(container.getElementsByTagName('div'))
    const pageDiv = divs.find(d => d.getAttribute('data-page-id') === 'nonexistent')
    expect(pageDiv).toBeDefined()
    expect(pageDiv!.parentElement!.style.display).toBe('none')
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

  it('has role="main" and tabindex for focus management', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Page, { id: 'page-1' }, 'Content'),
      ),
      container,
    )

    const divs = Array.from(container.getElementsByTagName('div'))
    const mainEl = divs.find(d => d.getAttribute('role') === 'main')
    expect(mainEl).toBeDefined()
    expect(mainEl!.getAttribute('tabindex')).toBe('-1')
    expect(mainEl!.getAttribute('id')).toBe('page-content')
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

  it('has aria-disabled on disabled buttons', () => {
    const adapter = createMockAdapter()
    const runtime = createCourseRuntime(config, adapter)
    runtime.markComplete('page-1')
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )

    const buttons = container.getElementsByTagName('button')
    // First page (complete): prev disabled, next enabled
    expect(buttons[0].getAttribute('aria-disabled')).toBe('true')
    expect(buttons[1].getAttribute('aria-disabled')).toBe('false')
  })

  it('has aria-current on page indicator', () => {
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

    const spans = container.getElementsByTagName('span')
    const pageIndicator = Array.from(spans).find(s => s.getAttribute('aria-current') === 'page')
    expect(pageIndicator).toBeDefined()
    expect(pageIndicator!.textContent).toContain('1 / 3')
  })

  it('disables prev button on first page and next when incomplete', () => {
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
    expect(buttons[0].disabled).toBe(true)   // prev (first page)
    expect(buttons[1].disabled).toBe(true)   // next (page not complete)

    // After completing the page, next becomes enabled
    runtime.markComplete('page-1')
    ctx.notify()
    render(
      h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      ),
      container,
    )
    const buttons2 = container.getElementsByTagName('button')
    expect(buttons2[1].disabled).toBe(false) // next (page complete)
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
    runtime.markComplete('page-1')
    const ctx = createTestContext(runtime)

    const container = document.createElement('div')
    function App() {
      return h(CourseContext.Provider, { value: ctx } as any,
        h(Navigation, null),
      )
    }

    render(h(App, null), container)

    const buttons = container.getElementsByTagName('button')
    // Click next (page-1 is complete, so next is enabled)
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
