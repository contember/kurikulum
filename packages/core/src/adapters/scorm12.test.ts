import { Window as HappyWindow } from 'happy-dom'

const happyWindow = new HappyWindow()
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

  describe('recordInteraction', () => {
    let mockAPI: ReturnType<typeof createMockAPI>
    let adapter: ReturnType<typeof createScorm12Adapter>

    beforeEach(() => {
      mockAPI = createMockAPI()
      adapter = createScorm12Adapter(createMockWindow(mockAPI))
    })

    it('writes choice interaction to cmi.interactions.0.*', () => {
      adapter.recordInteraction({
        id: 'q1',
        type: 'choice',
        studentResponse: '1',
        correctResponse: '1',
        result: 'correct',
        latency: 30000,
        weighting: 1,
      })

      expect(mockAPI._store['cmi.interactions.0.id']).toBe('q1')
      expect(mockAPI._store['cmi.interactions.0.type']).toBe('choice')
      expect(mockAPI._store['cmi.interactions.0.student_response']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.correct_responses.0.pattern']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.result']).toBe('correct')
      expect(mockAPI._store['cmi.interactions.0.latency']).toBe('00:00:30')
      expect(mockAPI._store['cmi.interactions.0.weighting']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.time']).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })

    it('increments interaction count for multiple interactions', () => {
      adapter.recordInteraction({
        id: 'q1',
        type: 'choice',
        studentResponse: '0',
        correctResponse: '1',
        result: 'wrong',
      })
      adapter.recordInteraction({
        id: 'q2',
        type: 'fill-in',
        studentResponse: 'Paris',
        correctResponse: 'Paris',
        result: 'correct',
        latency: 5000,
      })

      expect(mockAPI._store['cmi.interactions.0.id']).toBe('q1')
      expect(mockAPI._store['cmi.interactions.0.type']).toBe('choice')
      expect(mockAPI._store['cmi.interactions.1.id']).toBe('q2')
      expect(mockAPI._store['cmi.interactions.1.type']).toBe('fill-in')
      expect(mockAPI._store['cmi.interactions.1.student_response']).toBe('Paris')
      expect(mockAPI._store['cmi.interactions.1.latency']).toBe('00:00:05')
    })

    it('writes matching interaction with SCORM format', () => {
      adapter.recordInteraction({
        id: 'q3',
        type: 'matching',
        studentResponse: 'Cat[.]Animal[,]Rose[.]Plant',
        correctResponse: 'Cat[.]Animal[,]Rose[.]Plant',
        result: 'correct',
      })

      expect(mockAPI._store['cmi.interactions.0.type']).toBe('matching')
      expect(mockAPI._store['cmi.interactions.0.student_response']).toBe('Cat[.]Animal[,]Rose[.]Plant')
    })

    it('writes sequencing interaction', () => {
      adapter.recordInteraction({
        id: 'q4',
        type: 'sequencing',
        studentResponse: '2,0,1',
        correctResponse: '0,1,2',
        result: 'wrong',
      })

      expect(mockAPI._store['cmi.interactions.0.type']).toBe('sequencing')
      expect(mockAPI._store['cmi.interactions.0.student_response']).toBe('2,0,1')
      expect(mockAPI._store['cmi.interactions.0.correct_responses.0.pattern']).toBe('0,1,2')
      expect(mockAPI._store['cmi.interactions.0.result']).toBe('wrong')
    })

    it('omits optional fields when not provided', () => {
      adapter.recordInteraction({
        id: 'q5',
        type: 'choice',
        studentResponse: '0',
        correctResponse: '1',
        result: 'wrong',
      })

      expect(mockAPI._store['cmi.interactions.0.id']).toBe('q5')
      expect(mockAPI._store['cmi.interactions.0.weighting']).toBeUndefined()
      expect(mockAPI._store['cmi.interactions.0.latency']).toBeUndefined()
    })

    it('formats large latency correctly', () => {
      adapter.recordInteraction({
        id: 'q6',
        type: 'fill-in',
        studentResponse: 'answer',
        correctResponse: 'answer',
        result: 'correct',
        latency: 3661000, // 1h 1m 1s
      })

      expect(mockAPI._store['cmi.interactions.0.latency']).toBe('01:01:01')
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
