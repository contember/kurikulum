import { Window as HappyWindow } from 'happy-dom'

const happyWindow = new HappyWindow()
globalThis.document = happyWindow.document as unknown as Document
globalThis.localStorage = happyWindow.localStorage as unknown as Storage

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createXApiAdapter } from './xapi.ts'
import type { XApiConfig, XApiStatement } from './xapi.ts'

function createConfig(overrides?: Partial<XApiConfig>): XApiConfig {
  return {
    endpoint: 'https://lrs.example.com/xapi',
    auth: 'Basic dXNlcjpwYXNz',
    actor: { mbox: 'mailto:learner@example.com' },
    activityId: 'https://example.com/courses/safety-101',
    ...overrides,
  }
}

function createMockFetch(options?: { ok?: boolean; body?: any }) {
  const ok = options?.ok ?? true
  const body = options?.body ?? []
  const calls: { url: string; init: RequestInit }[] = []

  const fetchFn = mock(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: url as string, init: init! })
    return {
      ok,
      status: ok ? 200 : 500,
      json: async () => body,
      text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    } as Response
  })

  return { fetchFn: fetchFn as unknown as typeof fetch, calls }
}

describe('createXApiAdapter', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('initialize', () => {
    it('sends launched and initialized statements', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)
      await adapter.initialize()

      // Flush by terminating
      adapter.terminate()

      // Wait for async send
      await new Promise(r => setTimeout(r, 50))

      // Find the POST to /statements
      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      expect(statementCalls.length).toBeGreaterThanOrEqual(1)

      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const verbs = statements.map(s => s.verb.display['en-US'])
      expect(verbs).toContain('launched')
      expect(verbs).toContain('initialized')
      expect(verbs).toContain('terminated')
    })

    it('restores suspend_data from State API', async () => {
      const fetchFn = mock(async (url: string | URL | Request, init?: RequestInit) => {
        const urlStr = url as string
        if (urlStr.includes('/activities/state') && init?.method === 'GET') {
          if (urlStr.includes('stateId=suspend_data')) {
            return { ok: true, text: async () => '{"v":1,"state":{}}' } as Response
          }
          if (urlStr.includes('stateId=location')) {
            return { ok: true, text: async () => 'page-2' } as Response
          }
        }
        return { ok: true, json: async () => [], text: async () => '[]' } as Response
      }) as unknown as typeof fetch

      const adapter = createXApiAdapter(createConfig(), fetchFn)
      await adapter.initialize()

      expect(adapter.getSuspendData()).toBe('{"v":1,"state":{}}')
      expect(adapter.getLocation()).toBe('page-2')

      adapter.terminate()
    })
  })

  describe('suspend/restore', () => {
    it('stores and retrieves suspend_data', async () => {
      const { fetchFn } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setSuspendData('{"page":"intro"}')
      expect(adapter.getSuspendData()).toBe('{"page":"intro"}')

      adapter.terminate()
    })

    it('persists suspend_data to State API via PUT', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setSuspendData('{"page":"intro"}')

      await new Promise(r => setTimeout(r, 50))

      const stateCalls = calls.filter(c => c.url.includes('/activities/state') && c.init.method === 'PUT')
      expect(stateCalls.length).toBeGreaterThanOrEqual(1)

      const suspendCall = stateCalls.find(c => c.url.includes('stateId=suspend_data'))
      expect(suspendCall).toBeDefined()
      expect(suspendCall!.init.body).toBe('{"page":"intro"}')

      adapter.terminate()
    })
  })

  describe('setLocation', () => {
    it('tracks location and sends experienced statement', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setLocation('page-3')
      expect(adapter.getLocation()).toBe('page-3')

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      expect(statementCalls.length).toBeGreaterThanOrEqual(1)

      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const experienced = statements.find(s => s.verb.display['en-US'] === 'experienced')
      expect(experienced).toBeDefined()
      expect(experienced!.object.id).toBe('https://example.com/courses/safety-101/page/page-3')

      adapter.terminate()
    })

    it('persists location to State API', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setLocation('page-5')

      await new Promise(r => setTimeout(r, 50))

      const stateCalls = calls.filter(c => c.url.includes('/activities/state') && c.init.method === 'PUT')
      const locationCall = stateCalls.find(c => c.url.includes('stateId=location'))
      expect(locationCall).toBeDefined()
      expect(locationCall!.init.body).toBe('page-5')

      adapter.terminate()
    })
  })

  describe('setScore + setStatus', () => {
    it('sends attempted + passed statements with score', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setScore(17, 20)
      adapter.setStatus('passed')

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const attempted = statements.find(s => s.verb.display['en-US'] === 'attempted')
      expect(attempted).toBeDefined()
      expect(attempted!.result!.score).toEqual({ scaled: 0.85, raw: 17, min: 0, max: 20 })
      expect(attempted!.result!.success).toBe(true)
      expect(attempted!.result!.completion).toBe(true)

      const passed = statements.find(s => s.verb.display['en-US'] === 'passed')
      expect(passed).toBeDefined()
      expect(passed!.result!.success).toBe(true)
    })

    it('sends attempted + failed statements', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setScore(5, 20)
      adapter.setStatus('failed')

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const failed = statements.find(s => s.verb.display['en-US'] === 'failed')
      expect(failed).toBeDefined()
      expect(failed!.result!.success).toBe(false)
      expect(failed!.result!.score!.raw).toBe(5)
    })

    it('sends completed statement for course completion', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setStatus('completed')

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const completed = statements.find(s => s.verb.display['en-US'] === 'completed')
      expect(completed).toBeDefined()
      expect(completed!.result!.completion).toBe(true)
    })

    it('includes duration when session time is set', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setSessionTime(1530000) // 25m 30s
      adapter.setScore(17, 20)
      adapter.setStatus('passed')

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const attempted = statements.find(s => s.verb.display['en-US'] === 'attempted')
      expect(attempted!.result!.duration).toBe('PT0H25M30S')
    })
  })

  describe('recordInteraction', () => {
    it('sends answered statement with result', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.recordInteraction({
        id: 'q1',
        type: 'choice',
        studentResponse: '1',
        correctResponse: '1',
        result: 'correct',
        latency: 5000,
      })

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const answered = statements.find(s => s.verb.display['en-US'] === 'answered')
      expect(answered).toBeDefined()
      expect(answered!.object.id).toBe('https://example.com/courses/safety-101/interaction/q1')
      expect(answered!.result!.response).toBe('1')
      expect(answered!.result!.success).toBe(true)
      expect(answered!.result!.duration).toBe('PT0H0M5S')
    })

    it('handles wrong result', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.recordInteraction({
        id: 'q2',
        type: 'choice',
        studentResponse: '0',
        correctResponse: '1',
        result: 'wrong',
      })

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const answered = statements.find(s => s.verb.display['en-US'] === 'answered')
      expect(answered!.result!.success).toBe(false)
    })
  })

  describe('actor and context', () => {
    it('includes actor in statements', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setStatus('completed')
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      expect(statements[0].actor.mbox).toBe('mailto:learner@example.com')
      expect(statements[0].actor.objectType).toBe('Agent')
    })

    it('includes registration in context when provided', async () => {
      const { fetchFn, calls } = createMockFetch()
      const config = createConfig({ registration: 'abc-123' })
      const adapter = createXApiAdapter(config, fetchFn)

      adapter.setStatus('completed')
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      expect(statements[0].context!.registration).toBe('abc-123')
    })

    it('supports account-based actor', async () => {
      const { fetchFn, calls } = createMockFetch()
      const config = createConfig({
        actor: { account: { homePage: 'https://lms.example.com', name: 'user123' } },
      })
      const adapter = createXApiAdapter(config, fetchFn)

      adapter.setStatus('completed')
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      expect(statements[0].actor.account).toEqual({ homePage: 'https://lms.example.com', name: 'user123' })
    })
  })

  describe('HTTP headers', () => {
    it('sends correct auth and version headers', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setStatus('completed')
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      expect(statementCalls.length).toBeGreaterThanOrEqual(1)

      const headers = statementCalls[0].init.headers as Record<string, string>
      expect(headers.Authorization).toBe('Basic dXNlcjpwYXNz')
      expect(headers['X-Experience-API-Version']).toBe('1.0.3')
      expect(headers['Content-Type']).toBe('application/json')
    })
  })

  describe('offline queue', () => {
    it('saves statements to localStorage when LRS is unavailable', async () => {
      const { fetchFn } = createMockFetch({ ok: false })
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.setStatus('completed')
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const queue = localStorage.getItem('tabule:xapi:queue')
      expect(queue).not.toBeNull()

      const statements = JSON.parse(queue!)
      expect(statements.length).toBeGreaterThan(0)
    })

    it('retries offline queue on next flush', async () => {
      // First: save some statements to offline queue
      localStorage.setItem(
        'tabule:xapi:queue',
        JSON.stringify([
          {
            actor: { objectType: 'Agent' },
            verb: { id: 'test', display: { 'en-US': 'test' } },
            object: { id: 'test', definition: { type: 'test' } },
            timestamp: new Date().toISOString(),
          },
        ]),
      )

      const { fetchFn, calls } = createMockFetch({ ok: true })
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      // Terminate triggers flush which includes offline queue
      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      expect(statementCalls.length).toBeGreaterThanOrEqual(1)

      const sentStatements: XApiStatement[] = JSON.parse(statementCalls[statementCalls.length - 1].init.body as string)
      // Should include both offline + new terminated statement
      const verbIds = sentStatements.map(s => s.verb.id)
      expect(verbIds).toContain('test')
      expect(verbIds).toContain('http://adlnet.gov/expapi/verbs/terminated')

      // Queue should be cleared after successful send
      await new Promise(r => setTimeout(r, 50))
      const queue = localStorage.getItem('tabule:xapi:queue')
      expect(queue).toBeNull()
    })
  })

  describe('terminate', () => {
    it('sends terminated statement', async () => {
      const { fetchFn, calls } = createMockFetch()
      const adapter = createXApiAdapter(createConfig(), fetchFn)

      adapter.terminate()
      await new Promise(r => setTimeout(r, 50))

      const statementCalls = calls.filter(c => c.url.includes('/statements'))
      const lastCall = statementCalls[statementCalls.length - 1]
      const statements: XApiStatement[] = JSON.parse(lastCall.init.body as string)

      const terminated = statements.find(s => s.verb.display['en-US'] === 'terminated')
      expect(terminated).toBeDefined()
      expect(terminated!.object.id).toBe('https://example.com/courses/safety-101')
    })
  })
})
