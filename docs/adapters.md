# Adapters & Build

Adapters handle state persistence (suspend data, location, score) and LMS communication. `<KurikulumApp>` picks the right one for you based on the build target — most apps never touch this directly.

## Default — picked by `<KurikulumApp>`

`<KurikulumApp>` calls `createDefaultAdapter()` which reads `import.meta.env.KURIKULUM_TARGET` (set by the kurikulum() Vite plugin) and returns:

| `KURIKULUM_TARGET` | Adapter                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `standalone`       | `createAdapter('standalone')` — localStorage                                                                              |
| `scorm-1.2`        | `createAdapter('scorm-1.2')` — falls back to standalone                                                                   |
| `scorm-2004`       | `createAdapter('scorm-2004')` — falls back to 1.2, then standalone                                                        |
| `cmi5`             | `createAdapter('scorm-2004')` — cmi5 packaging, SCORM API at runtime                                                      |
| `xapi`             | `createXApiAdapter(...)` — config parsed from URL query params (`?endpoint=…&auth=…&actor=…&activityId=…&registration=…`) |

## Build Targets

```bash
bun run dev                                       # standalone, multi-locale dev
bun run build                                     # standalone web bundle
KURIKULUM_LOCALE=cs bun run build:scorm           # SCORM 1.2 ZIP — Czech
KURIKULUM_LOCALE=en bun run build:scorm           # SCORM 1.2 ZIP — English
KURIKULUM_TARGET=scorm-2004 KURIKULUM_LOCALE=cs bun run build  # SCORM 2004
KURIKULUM_TARGET=cmi5 KURIKULUM_LOCALE=cs bun run build        # cmi5
KURIKULUM_TARGET=xapi bun run build                            # xAPI
```

Single-file `index.html` lands in `dist/<target>[-<locale>]/`. SCORM/cmi5 builds also produce a sibling `dist/Course[-<locale>].zip` via the kurikulum() Vite plugin's post-build hook.

See `docs/i18n.md` for the role of `KURIKULUM_LOCALE`.

## Manual adapter wiring

Pass `adapter` to `<KurikulumApp>` to override:

```tsx
import { KurikulumApp } from 'kurikulum/auto'
import { createXApiAdapter } from 'kurikulum'

const adapter = createXApiAdapter({
  endpoint: 'https://lrs.example.com/xapi',
  auth: 'Basic …',
  actor: { mbox: 'mailto:learner@example.com' },
  activityId: 'https://example.com/courses/my-course',
})

<KurikulumApp config={config} adapter={adapter}>
  …
</KurikulumApp>
```

Or call `createDefaultAdapter()` yourself if you want the env-driven default with extra wrapping:

```tsx
import { createDefaultAdapter } from 'kurikulum'

const adapter = wrap(createDefaultAdapter())
```

## Implementing a custom adapter

Implement the `DeliveryAdapter` interface from `kurikulum`. All methods listed in the interface are required; `getLanguagePreference` / `setLanguagePreference` are optional.

```typescript
import type { DeliveryAdapter, InteractionRecord } from 'kurikulum'

export function createMyAdapter(): DeliveryAdapter {
  return {
    async initialize() {/* … */},
    getSuspendData() {/* return string | null */},
    setSuspendData(data) {/* … */},
    setScore(score, max) {/* … */},
    setStatus(status) {/* 'incomplete'|'completed'|'passed'|'failed' */},
    setLocation(pageId) {/* … */},
    getLocation() {/* return string | null */},
    setSessionTime(ms) {/* … */},
    recordInteraction(interaction: InteractionRecord) {/* … */},
    commit() {/* … */},
    terminate() {/* … */},
    // optional:
    getLanguagePreference() {/* return string | null */},
    setLanguagePreference(lang) {/* … */},
  }
}
```
