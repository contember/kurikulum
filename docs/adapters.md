# Adapters & Build

Adapters handle persistence and LMS communication.

## Available Adapters

```typescript
import { createAdapter, createXApiAdapter } from '@kurikulum/core'

createAdapter('standalone')   // localStorage (dev + standalone web)
createAdapter('scorm-1.2')    // SCORM 1.2 RTE (falls back to standalone)
createAdapter('scorm-2004')   // SCORM 2004 RTE (falls back to 1.2, then standalone)

createXApiAdapter({
  endpoint: 'https://lrs.example.com/xapi',
  auth: 'Basic ...',
  actor: { mbox: 'mailto:learner@example.com' },
  activityId: 'https://example.com/courses/my-course',
})
```

## Build Targets

Set `KURIKULUM_TARGET` env var:

```bash
bun run dev                                    # standalone
bun run build                                  # standalone
bun run build:scorm                            # SCORM 1.2 ZIP
KURIKULUM_TARGET=scorm-2004 bun run build      # SCORM 2004
KURIKULUM_TARGET=xapi bun run build            # xAPI
```

All builds produce single-file `index.html` in `dist/<target>/`.

## Runtime Selection in course.tsx

```typescript
const target = (import.meta.env.KURIKULUM_TARGET as string) || 'standalone'

const adapter = target === 'xapi'
  ? createXApiAdapter({ /* config */ })
  : createAdapter(target as 'standalone' | 'scorm-1.2' | 'scorm-2004')
```
