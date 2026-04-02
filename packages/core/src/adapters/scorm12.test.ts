import { Window } from 'happy-dom'

const happyWindow = new Window()
globalThis.document = happyWindow.document as unknown as Document
globalThis.localStorage = happyWindow.localStorage as unknown as Storage

import { describe, it, expect, beforeEach, spyOn, mock } from 'bun:test'
import { createScorm12Adapter } from './scorm12.ts'

function createMockAPI() {
  const store: Record<string, string> = {}
  return {
    LMSInitialize: mock((_param: '') => 'true' as const),
    LMSFinish: mock((_param: '') => 'true' as const),
    LMSGetValue: mock((element: string) => store[element] ?? ''),
    LMSSetValue: mock((element: string, value: string) => {
      store[element] = value
      return 'true' as const
    }),
    LMSCommit: mock((_param: '') => 'true' as const),
    LMSGetLastError: mock(() => '0'),
    _store: store,
  }
}

function createMockWindow(api?: any): Window {
  const win = { parent: null, opener: null } as any
  win.parent = win
  if (api) win.API = api
  return win as Window
}

describe('createScorm12Adapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to standalone when SCORM API is not found', () => {
    const warnSpy = spyOn(console, 'warn')
    const win = createMockWindow()
    const adapter = createScorm12Adapter(win)

    expect(warnSpy).toHaveBeenCalledWith(
      '[kurikulum] SCORM API not found, falling back to standalone',
    )
    warnSpy.mockRestore()

    // Verify it behaves like standalone (uses localStorage)
    adapter.setSuspendData('test-data')
    expect(adapter.getSuspendData()).toBe('test-data')
    expect(localStorage.getItem('kurikulum:suspend')).toBe('test-data')
  })

  describe('with SCORM API', () => {
    let mockAPI: ReturnType<typeof createMockAPI>
    let adapter: ReturnType<typeof createScorm12Adapter>

    beforeEach(() => {
      mockAPI = createMockAPI()
      adapter = createScorm12Adapter(createMockWindow(mockAPI))
    })

    it('calls LMSInitialize on initialize', async () => {
      await adapter.initialize()
      expect(mockAPI.LMSInitialize).toHaveBeenCalledWith('')
    })

    it('reads and writes suspend_data', () => {
      expect(adapter.getSuspendData()).toBeNull()

      adapter.setSuspendData('{"page":"intro","completed":[]}')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith(
        'cmi.suspend_data',
        '{"page":"intro","completed":[]}',
      )

      expect(adapter.getSuspendData()).toBe('{"page":"intro","completed":[]}')
    })

    it('sets score raw and max', () => {
      adapter.setScore(85, 100)
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.raw', '85')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.score.max', '100')
    })

    it('maps and sets lesson_status', () => {
      adapter.setStatus('completed')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'completed')

      adapter.setStatus('passed')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'passed')

      adapter.setStatus('failed')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'failed')

      adapter.setStatus('incomplete')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_status', 'incomplete')
    })

    it('sets and gets lesson_location', () => {
      expect(adapter.getLocation()).toBeNull()

      adapter.setLocation('page-3')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_location', 'page-3')

      expect(adapter.getLocation()).toBe('page-3')
    })

    it('formats session time as HH:MM:SS.00', () => {
      // 1 hour 23 minutes 45 seconds
      adapter.setSessionTime(5025000)
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '01:23:45.00')
    })

    it('formats zero session time', () => {
      adapter.setSessionTime(0)
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '00:00:00.00')
    })

    it('formats large session time', () => {
      // 100 hours
      adapter.setSessionTime(360000000)
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.session_time', '100:00:00.00')
    })

    it('calls LMSCommit on commit', () => {
      adapter.commit()
      expect(mockAPI.LMSCommit).toHaveBeenCalledWith('')
    })

    it('calls LMSFinish on terminate', () => {
      adapter.terminate()
      expect(mockAPI.LMSFinish).toHaveBeenCalledWith('')
    })

    it('suspend_data roundtrip works', () => {
      const data = JSON.stringify({ currentPage: 'page-2', progress: [true, true, false] })

      adapter.setSuspendData(data)
      const retrieved = adapter.getSuspendData()

      expect(retrieved).toBe(data)
      expect(JSON.parse(retrieved!)).toEqual({
        currentPage: 'page-2',
        progress: [true, true, false],
      })
    })
  })

  describe('API discovery', () => {
    it('finds API on window.parent', () => {
      const mockAPI = createMockAPI()
      const parent = { API: mockAPI, parent: null, opener: null } as any
      parent.parent = parent
      const child = { parent, opener: null } as any

      const adapter = createScorm12Adapter(child as Window)
      adapter.setLocation('page-1')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_location', 'page-1')
    })

    it('finds API on window.opener', () => {
      const mockAPI = createMockAPI()
      const opener = { API: mockAPI, parent: null, opener: null } as any
      opener.parent = opener
      const child = { parent: null, opener } as any
      child.parent = child

      const adapter = createScorm12Adapter(child as Window)
      adapter.setLocation('page-2')
      expect(mockAPI.LMSSetValue).toHaveBeenCalledWith('cmi.core.lesson_location', 'page-2')
    })
  })
})
