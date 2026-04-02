import { Window } from 'happy-dom'

const window = new Window()
globalThis.document = window.document as unknown as Document
globalThis.localStorage = window.localStorage as unknown as Storage

import { describe, it, expect, beforeEach, spyOn } from 'bun:test'
import { createStandaloneAdapter } from './standalone.ts'
import { createAdapter } from './index.ts'

beforeEach(() => {
  localStorage.clear()
})

describe('createStandaloneAdapter', () => {
  it('implements the full DeliveryAdapter interface', () => {
    const adapter = createStandaloneAdapter()
    expect(typeof adapter.initialize).toBe('function')
    expect(typeof adapter.getSuspendData).toBe('function')
    expect(typeof adapter.setSuspendData).toBe('function')
    expect(typeof adapter.setScore).toBe('function')
    expect(typeof adapter.setStatus).toBe('function')
    expect(typeof adapter.setLocation).toBe('function')
    expect(typeof adapter.getLocation).toBe('function')
    expect(typeof adapter.setSessionTime).toBe('function')
    expect(typeof adapter.commit).toBe('function')
    expect(typeof adapter.terminate).toBe('function')
  })

  it('initialize resolves immediately', async () => {
    const adapter = createStandaloneAdapter()
    await expect(adapter.initialize()).resolves.toBeUndefined()
  })

  it('persists suspend data to localStorage', () => {
    const adapter = createStandaloneAdapter()
    expect(adapter.getSuspendData()).toBeNull()

    adapter.setSuspendData('{"page":"intro"}')
    expect(adapter.getSuspendData()).toBe('{"page":"intro"}')
    expect(localStorage.getItem('kurikulum:suspend')).toBe('{"page":"intro"}')
  })

  it('persists location to localStorage', () => {
    const adapter = createStandaloneAdapter()
    expect(adapter.getLocation()).toBeNull()

    adapter.setLocation('page-2')
    expect(adapter.getLocation()).toBe('page-2')
    expect(localStorage.getItem('kurikulum:location')).toBe('page-2')
  })

  it('setScore logs to console', () => {
    const spy = spyOn(console, 'log')
    const adapter = createStandaloneAdapter()
    adapter.setScore(8, 10)
    expect(spy).toHaveBeenCalledWith('[kurikulum]', 'setScore', 8, 10)
    spy.mockRestore()
  })

  it('setStatus logs to console', () => {
    const spy = spyOn(console, 'log')
    const adapter = createStandaloneAdapter()
    adapter.setStatus('completed')
    expect(spy).toHaveBeenCalledWith('[kurikulum]', 'setStatus', 'completed')
    spy.mockRestore()
  })

  it('setSessionTime logs to console', () => {
    const spy = spyOn(console, 'log')
    const adapter = createStandaloneAdapter()
    adapter.setSessionTime(5000)
    expect(spy).toHaveBeenCalledWith('[kurikulum]', 'setSessionTime', 5000)
    spy.mockRestore()
  })

  it('terminate logs to console', () => {
    const spy = spyOn(console, 'log')
    const adapter = createStandaloneAdapter()
    adapter.terminate()
    expect(spy).toHaveBeenCalledWith('[kurikulum] terminated')
    spy.mockRestore()
  })

  it('data persists across adapter instances (same localStorage)', () => {
    const adapter1 = createStandaloneAdapter()
    adapter1.setSuspendData('state-data')
    adapter1.setLocation('page-3')

    const adapter2 = createStandaloneAdapter()
    expect(adapter2.getSuspendData()).toBe('state-data')
    expect(adapter2.getLocation()).toBe('page-3')
  })
})

describe('createAdapter', () => {
  it('returns a standalone adapter for "standalone" type', () => {
    const adapter = createAdapter('standalone')
    expect(adapter.getSuspendData()).toBeNull()
    adapter.setSuspendData('test')
    expect(adapter.getSuspendData()).toBe('test')
  })

  it('returns a scorm-1.2 adapter (falls back to standalone without API)', () => {
    const adapter = createAdapter('scorm-1.2')
    expect(adapter.getSuspendData()).toBeNull()
    adapter.setSuspendData('scorm-test')
    expect(adapter.getSuspendData()).toBe('scorm-test')
  })

  it('returns a scorm-2004 adapter (falls back to standalone without API)', () => {
    const adapter = createAdapter('scorm-2004')
    expect(adapter.getSuspendData()).toBeNull()
    adapter.setSuspendData('scorm2004-test')
    expect(adapter.getSuspendData()).toBe('scorm2004-test')
  })
})
