import type { DeliveryAdapter, InteractionRecord } from '../types.ts'

export interface XApiConfig {
  endpoint: string
  auth: string
  actor: {
    mbox?: string
    account?: { homePage: string; name: string }
  }
  activityId: string
  registration?: string
}

export interface XApiStatement {
  actor: XApiActor
  verb: { id: string; display: { 'en-US': string } }
  object: { id: string; definition: { type: string; name?: { 'en-US': string } } }
  result?: XApiResult
  context?: { registration?: string }
  timestamp: string
}

interface XApiActor {
  mbox?: string
  account?: { homePage: string; name: string }
  objectType: 'Agent'
}

interface XApiResult {
  score?: { scaled?: number; raw?: number; min?: number; max?: number }
  success?: boolean
  completion?: boolean
  duration?: string
  response?: string
}

const VERBS = {
  launched: { id: 'http://adlnet.gov/expapi/verbs/launched', display: { 'en-US': 'launched' } },
  experienced: { id: 'http://adlnet.gov/expapi/verbs/experienced', display: { 'en-US': 'experienced' } },
  completed: { id: 'http://adlnet.gov/expapi/verbs/completed', display: { 'en-US': 'completed' } },
  attempted: { id: 'http://adlnet.gov/expapi/verbs/attempted', display: { 'en-US': 'attempted' } },
  passed: { id: 'http://adlnet.gov/expapi/verbs/passed', display: { 'en-US': 'passed' } },
  failed: { id: 'http://adlnet.gov/expapi/verbs/failed', display: { 'en-US': 'failed' } },
  answered: { id: 'http://adlnet.gov/expapi/verbs/answered', display: { 'en-US': 'answered' } },
  terminated: { id: 'http://adlnet.gov/expapi/verbs/terminated', display: { 'en-US': 'terminated' } },
  initialized: { id: 'http://adlnet.gov/expapi/verbs/initialized', display: { 'en-US': 'initialized' } },
} as const

const ACTIVITY_TYPES = {
  course: 'http://adlnet.gov/expapi/activities/course',
  module: 'http://adlnet.gov/expapi/activities/module',
  assessment: 'http://adlnet.gov/expapi/activities/assessment',
  interaction: 'http://adlnet.gov/expapi/activities/cmi.interaction',
} as const

const OFFLINE_QUEUE_KEY = 'tabule:xapi:queue'
const BATCH_INTERVAL_MS = 10_000

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `PT${hours}H${minutes}M${seconds}S`
}

export function createXApiAdapter(config: XApiConfig, fetchFn?: typeof fetch): DeliveryAdapter {
  const actor: XApiActor = { ...config.actor, objectType: 'Agent' }
  const httpFetch = fetchFn ?? (typeof globalThis.fetch !== 'undefined' ? globalThis.fetch.bind(globalThis) : null)

  let pendingStatements: XApiStatement[] = []
  let batchTimer: ReturnType<typeof setInterval> | null = null
  let suspendData: string | null = null
  let location: string | null = null
  let lastScore: { score: number; max: number } | null = null
  let lastStatus: string | null = null
  let sessionTimeMs = 0

  function buildStatement(verb: typeof VERBS[keyof typeof VERBS], objectId: string, activityType: string, result?: XApiResult, objectName?: string): XApiStatement {
    const stmt: XApiStatement = {
      actor,
      verb,
      object: {
        id: objectId,
        definition: { type: activityType },
      },
      timestamp: new Date().toISOString(),
    }
    if (objectName) {
      stmt.object.definition.name = { 'en-US': objectName }
    }
    if (result) {
      stmt.result = result
    }
    if (config.registration) {
      stmt.context = { registration: config.registration }
    }
    return stmt
  }

  function enqueue(stmt: XApiStatement) {
    pendingStatements.push(stmt)
  }

  async function sendStatements(statements: XApiStatement[]): Promise<boolean> {
    if (!httpFetch || statements.length === 0) return false
    try {
      const response = await httpFetch(`${config.endpoint}/statements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.auth,
          'X-Experience-API-Version': '1.0.3',
        },
        body: JSON.stringify(statements),
      })
      return response.ok
    } catch {
      return false
    }
  }

  function loadOfflineQueue(): XApiStatement[] {
    try {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  function saveOfflineQueue(statements: XApiStatement[]) {
    try {
      if (statements.length === 0) {
        localStorage.removeItem(OFFLINE_QUEUE_KEY)
      } else {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(statements))
      }
    } catch {
      // localStorage unavailable
    }
  }

  async function flushBatch() {
    const offlineQueue = loadOfflineQueue()
    const toSend = [...offlineQueue, ...pendingStatements]
    pendingStatements = []

    if (toSend.length === 0) return

    const success = await sendStatements(toSend)
    if (success) {
      saveOfflineQueue([])
    } else {
      saveOfflineQueue(toSend)
    }
  }

  function startBatchTimer() {
    if (batchTimer) return
    batchTimer = setInterval(() => { flushBatch() }, BATCH_INTERVAL_MS)
  }

  function stopBatchTimer() {
    if (batchTimer) {
      clearInterval(batchTimer)
      batchTimer = null
    }
  }

  // State API helpers
  async function getState(stateId: string): Promise<string | null> {
    if (!httpFetch) return null
    try {
      const params = new URLSearchParams({
        activityId: config.activityId,
        agent: JSON.stringify({ mbox: actor.mbox, account: actor.account, objectType: 'Agent' }),
        stateId,
      })
      if (config.registration) params.set('registration', config.registration)
      const response = await httpFetch(`${config.endpoint}/activities/state?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': config.auth,
          'X-Experience-API-Version': '1.0.3',
        },
      })
      if (response.ok) {
        return await response.text()
      }
      return null
    } catch {
      return null
    }
  }

  async function putState(stateId: string, data: string): Promise<void> {
    if (!httpFetch) return
    try {
      const params = new URLSearchParams({
        activityId: config.activityId,
        agent: JSON.stringify({ mbox: actor.mbox, account: actor.account, objectType: 'Agent' }),
        stateId,
      })
      if (config.registration) params.set('registration', config.registration)
      await httpFetch(`${config.endpoint}/activities/state?${params}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': config.auth,
          'X-Experience-API-Version': '1.0.3',
        },
        body: data,
      })
    } catch {
      // State save failed — suspend_data still kept in memory
    }
  }

  return {
    async initialize() {
      // Restore suspend_data from State API
      const stateData = await getState('suspend_data')
      if (stateData) {
        suspendData = stateData
      }
      const stateLocation = await getState('location')
      if (stateLocation) {
        location = stateLocation
      }

      // Send launched + initialized statements (cmi5 required)
      enqueue(buildStatement(VERBS.launched, config.activityId, ACTIVITY_TYPES.course))
      enqueue(buildStatement(VERBS.initialized, config.activityId, ACTIVITY_TYPES.course))

      startBatchTimer()
    },

    getSuspendData() {
      return suspendData
    },

    setSuspendData(data: string) {
      suspendData = data
      putState('suspend_data', data)
    },

    setScore(score: number, max: number) {
      lastScore = { score, max }
    },

    setStatus(status: 'incomplete' | 'completed' | 'passed' | 'failed') {
      const prev = lastStatus
      lastStatus = status

      if (status === 'passed' || status === 'failed') {
        const result: XApiResult = {}
        if (lastScore) {
          result.score = {
            scaled: lastScore.max > 0 ? lastScore.score / lastScore.max : 0,
            raw: lastScore.score,
            min: 0,
            max: lastScore.max,
          }
        }
        result.success = status === 'passed'
        result.completion = true
        if (sessionTimeMs > 0) {
          result.duration = formatDuration(sessionTimeMs)
        }

        // Send attempted + passed/failed
        enqueue(buildStatement(VERBS.attempted, config.activityId, ACTIVITY_TYPES.assessment, result))
        const verb = status === 'passed' ? VERBS.passed : VERBS.failed
        enqueue(buildStatement(verb, config.activityId, ACTIVITY_TYPES.assessment, result))
      }

      if (status === 'completed' && prev !== 'completed') {
        const result: XApiResult = { completion: true }
        if (sessionTimeMs > 0) {
          result.duration = formatDuration(sessionTimeMs)
        }
        enqueue(buildStatement(VERBS.completed, config.activityId, ACTIVITY_TYPES.course, result))
      }
    },

    setLocation(pageId: string) {
      location = pageId
      putState('location', pageId)
      // Page experienced
      enqueue(buildStatement(VERBS.experienced, `${config.activityId}/page/${pageId}`, ACTIVITY_TYPES.module))
    },

    getLocation() {
      return location
    },

    setSessionTime(ms: number) {
      sessionTimeMs = ms
    },

    recordInteraction(interaction: InteractionRecord) {
      const result: XApiResult = {
        response: interaction.studentResponse,
        success: interaction.result === 'correct',
        completion: true,
      }
      if (interaction.latency !== undefined) {
        result.duration = formatDuration(interaction.latency)
      }

      enqueue(buildStatement(
        VERBS.answered,
        `${config.activityId}/interaction/${interaction.id}`,
        ACTIVITY_TYPES.interaction,
        result,
      ))
    },

    commit() {
      // Batch sending handles the flush on interval; commit is a no-op
      // (statements are queued and sent periodically)
    },

    terminate() {
      stopBatchTimer()
      // Send terminated statement (cmi5 required)
      enqueue(buildStatement(VERBS.terminated, config.activityId, ACTIVITY_TYPES.course))
      // Final synchronous-ish flush
      const offlineQueue = loadOfflineQueue()
      const toSend = [...offlineQueue, ...pendingStatements]
      pendingStatements = []
      if (httpFetch && toSend.length > 0) {
        // Use sendBeacon-style fire-and-forget or try sync send
        sendStatements(toSend).then(success => {
          if (!success) saveOfflineQueue(toSend)
          else saveOfflineQueue([])
        }).catch(() => saveOfflineQueue(toSend))
      } else {
        saveOfflineQueue(toSend)
      }
    },
  }
}
