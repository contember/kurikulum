export type { DeliveryAdapter } from './types.ts'
export { createStandaloneAdapter } from './standalone.ts'

import type { DeliveryAdapter } from './types.ts'
import { createStandaloneAdapter } from './standalone.ts'

export function createAdapter(type: 'standalone' | 'scorm-1.2'): DeliveryAdapter {
  switch (type) {
    case 'standalone':
      return createStandaloneAdapter()
    case 'scorm-1.2':
      throw new Error('SCORM 1.2 adapter is not yet implemented')
  }
}
