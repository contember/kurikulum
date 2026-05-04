import { createAdapter } from '../adapters/index.ts'
import { createXApiAdapter } from '../adapters/xapi.ts'
import type { DeliveryAdapter } from '../types.ts'

/**
 * Reads import.meta.env.KURIKULUM_TARGET (set by the kurikulum() Vite plugin)
 * and returns the appropriate adapter, falling back to standalone. For
 * target='xapi', xAPI config is parsed from URL query params (endpoint, auth,
 * actor, activityId, registration).
 */
export function createDefaultAdapter(): DeliveryAdapter {
  const target = (import.meta.env.KURIKULUM_TARGET as string | undefined) ?? 'standalone'

  if (target === 'xapi') {
    if (typeof window === 'undefined') return createAdapter('standalone')
    const params = new URLSearchParams(window.location.search)
    return createXApiAdapter({
      endpoint: params.get('endpoint') ?? '',
      auth: params.get('auth') ?? '',
      actor: params.get('actor') ? JSON.parse(params.get('actor')!) : {},
      activityId: params.get('activityId') ?? window.location.href,
      registration: params.get('registration') ?? undefined,
    })
  }

  if (target === 'scorm-1.2' || target === 'scorm-2004') {
    return createAdapter(target)
  }

  return createAdapter('standalone')
}
