export type { DeliveryAdapter } from './types.ts'
export { createStandaloneAdapter } from './standalone.ts'
export { createScorm12Adapter } from './scorm12.ts'

import type { DeliveryAdapter } from './types.ts'
import { createStandaloneAdapter } from './standalone.ts'
import { createScorm12Adapter } from './scorm12.ts'

export function createAdapter(type: 'standalone' | 'scorm-1.2'): DeliveryAdapter {
  switch (type) {
    case 'standalone':
      return createStandaloneAdapter()
    case 'scorm-1.2':
      return createScorm12Adapter()
  }
}
