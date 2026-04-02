import { Window } from 'happy-dom'

const happyWindow = new Window()
globalThis.document = happyWindow.document as unknown as Document
globalThis.localStorage = happyWindow.localStorage as unknown as Storage

import { describe, it, expect, beforeEach, spyOn, mock } from 'bun:test'
import { createScorm2004Adapter } from './scorm2004.ts'

function createMockAPI() {
  const store: Record<string, string> = {}
  return {
    Initialize: mock((_param: '') => 'true' as const),
    Terminate: mock((_param: '') => 'true' as const),
    GetValue: mock((element: string) => store[element] ?? ''),
    SetValue: mock((element: string, value: string) => {
      store[element] = value
      return 'true' as const
    }),
    Commit: mock((_param: '') => 'true' as const),
    GetLastError: mock(() => '0'),
    _store: store,
  }
}

function createMockWindow(api?: any): Window {
  const win = { parent: null, opener: null } as any
  win.parent = win
  if (api) win.API_1484_11 = api
  return win as Window
}

describe('createScorm2004Adapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to SCORM 1.2 when SCORM 2004 API is not found', () => {
    const warnSpy = spyOn(console, 'warn')
    const win = createMockWindow()
    const adapter = createScorm2004Adapter(win)

    expect(warnSpy).toHaveBeenCalledWith(
      '[kurikulum] SCORM 2004 API not found, falling back to SCORM 1.2',
    )
    warnSpy.mockRestore()
  })

  it('falls back to standalone when neither SCORM 2004 nor 1.2 API found', () => {
    const warnSpy = spyOn(console, 'warn')
    const win = createMockWindow()
    const adapter = createScorm2004Adapter(win)

    // First warning: SCORM 2004 fallback
    expect(warnSpy).toHaveBeenCalledWith(
      '[kurikulum] SCORM 2004 API not found, falling back to SCORM 1.2',
    )
    // Second warning: SCORM 1.2 fallback to standalone
    expect(warnSpy).toHaveBeenCalledWith(
      '[kurikulum] SCORM API not found, falling back to standalone',
    )
    warnSpy.mockRestore()

    // Verify it behaves like standalone (uses localStorage)
    adapter.setSuspendData('test-data')
    expect(adapter.getSuspendData()).toBe('test-data')
    expect(localStorage.getItem('kurikulum:suspend')).toBe('test-data')
  })

  describe('with SCORM 2004 API', () => {
    let mockAPI: ReturnType<typeof createMockAPI>
    let adapter: ReturnType<typeof createScorm2004Adapter>

    beforeEach(() => {
      mockAPI = createMockAPI()
      adapter = createScorm2004Adapter(createMockWindow(mockAPI))
    })

    it('calls Initialize on initialize', async () => {
      await adapter.initialize()
      expect(mockAPI.Initialize).toHaveBeenCalledWith('')
    })

    it('reads and writes suspend_data', () => {
      expect(adapter.getSuspendData()).toBeNull()

      adapter.setSuspendData('{"page":"intro","completed":[]}')
      expect(mockAPI.SetValue).toHaveBeenCalledWith(
        'cmi.suspend_data',
        '{"page":"intro","completed":[]}',
      )

      expect(adapter.getSuspendData()).toBe('{"page":"intro","completed":[]}')
    })

    it('sets score with raw, max, min, and scaled', () => {
      adapter.setScore(85, 100)
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.score.raw', '85')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.score.max', '100')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.score.min', '0')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.score.scaled', '0.85')
    })

    it('sets scaled score correctly for partial scores', () => {
      adapter.setScore(3, 4)
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.score.scaled', '0.75')
    })

    describe('setStatus', () => {
      it('sets completion_status to incomplete', () => {
        adapter.setStatus('incomplete')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'incomplete')
      })

      it('sets completion_status to completed', () => {
        adapter.setStatus('completed')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed')
      })

      it('sets both completion and success status for passed', () => {
        adapter.setStatus('passed')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.success_status', 'passed')
      })

      it('sets both completion and success status for failed', () => {
        adapter.setStatus('failed')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.completion_status', 'completed')
        expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.success_status', 'failed')
      })
    })

    it('sets and gets location (without core. prefix)', () => {
      expect(adapter.getLocation()).toBeNull()

      adapter.setLocation('page-3')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.location', 'page-3')

      expect(adapter.getLocation()).toBe('page-3')
    })

    it('formats session time as ISO 8601 duration', () => {
      // 1 hour 23 minutes 45 seconds
      adapter.setSessionTime(5025000)
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT1H23M45S')
    })

    it('formats zero session time', () => {
      adapter.setSessionTime(0)
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT0H0M0S')
    })

    it('formats large session time', () => {
      // 100 hours
      adapter.setSessionTime(360000000)
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.session_time', 'PT100H0M0S')
    })

    it('calls Commit on commit', () => {
      adapter.commit()
      expect(mockAPI.Commit).toHaveBeenCalledWith('')
    })

    it('calls Terminate on terminate', () => {
      adapter.terminate()
      expect(mockAPI.Terminate).toHaveBeenCalledWith('')
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
    let adapter: ReturnType<typeof createScorm2004Adapter>

    beforeEach(() => {
      mockAPI = createMockAPI()
      adapter = createScorm2004Adapter(createMockWindow(mockAPI))
    })

    it('writes interaction with SCORM 2004 field names', () => {
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
      expect(mockAPI._store['cmi.interactions.0.learner_response']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.correct_responses.0.pattern']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.result']).toBe('correct')
      expect(mockAPI._store['cmi.interactions.0.latency']).toBe('PT0H0M30S')
      expect(mockAPI._store['cmi.interactions.0.weighting']).toBe('1')
      expect(mockAPI._store['cmi.interactions.0.timestamp']).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('maps wrong result to incorrect for SCORM 2004', () => {
      adapter.recordInteraction({
        id: 'q1',
        type: 'choice',
        studentResponse: '0',
        correctResponse: '1',
        result: 'wrong',
      })

      expect(mockAPI._store['cmi.interactions.0.result']).toBe('incorrect')
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
      expect(mockAPI._store['cmi.interactions.1.id']).toBe('q2')
      expect(mockAPI._store['cmi.interactions.1.learner_response']).toBe('Paris')
      expect(mockAPI._store['cmi.interactions.1.latency']).toBe('PT0H0M5S')
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

    it('formats interaction latency as ISO 8601 duration', () => {
      adapter.recordInteraction({
        id: 'q6',
        type: 'fill-in',
        studentResponse: 'answer',
        correctResponse: 'answer',
        result: 'correct',
        latency: 3661000, // 1h 1m 1s
      })

      expect(mockAPI._store['cmi.interactions.0.latency']).toBe('PT1H1M1S')
    })
  })

  describe('API discovery', () => {
    it('finds API_1484_11 on window.parent', () => {
      const mockAPI = createMockAPI()
      const parent = { API_1484_11: mockAPI, parent: null, opener: null } as any
      parent.parent = parent
      const child = { parent, opener: null } as any

      const adapter = createScorm2004Adapter(child as Window)
      adapter.setLocation('page-1')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.location', 'page-1')
    })

    it('finds API_1484_11 on window.opener', () => {
      const mockAPI = createMockAPI()
      const opener = { API_1484_11: mockAPI, parent: null, opener: null } as any
      opener.parent = opener
      const child = { parent: null, opener } as any
      child.parent = child

      const adapter = createScorm2004Adapter(child as Window)
      adapter.setLocation('page-2')
      expect(mockAPI.SetValue).toHaveBeenCalledWith('cmi.location', 'page-2')
    })
  })
})
