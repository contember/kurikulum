# Krok 13: SCORM 1.2 adapter

## Cíl

Adapter komunikující se SCORM 1.2 API (LMS runtime).

## Soubory

- `packages/core/src/adapters/scorm12.ts`

## SCORM 1.2 API

SCORM 1.2 LMS poskytuje `window.API` objekt s metodami:

```typescript
interface SCORM12API {
  LMSInitialize(param: ""): "true" | "false"
  LMSFinish(param: ""): "true" | "false"
  LMSGetValue(element: string): string
  LMSSetValue(element: string, value: string): "true" | "false"
  LMSCommit(param: ""): "true" | "false"
  LMSGetLastError(): string
}
```

## Mapování DeliveryAdapter → SCORM 1.2

| DeliveryAdapter | SCORM 1.2 CMI |
|---|---|
| `initialize()` | `LMSInitialize("")` |
| `getSuspendData()` | `LMSGetValue("cmi.suspend_data")` |
| `setSuspendData(data)` | `LMSSetValue("cmi.suspend_data", data)` |
| `setScore(score, max)` | `LMSSetValue("cmi.core.score.raw", score)` + `cmi.core.score.max` |
| `setStatus(status)` | `LMSSetValue("cmi.core.lesson_status", mapStatus(status))` |
| `setLocation(pageId)` | `LMSSetValue("cmi.core.lesson_location", pageId)` |
| `getLocation()` | `LMSGetValue("cmi.core.lesson_location")` |
| `setSessionTime(ms)` | `LMSSetValue("cmi.core.session_time", formatTime(ms))` |
| `commit()` | `LMSCommit("")` |
| `terminate()` | `LMSFinish("")` |

## Status mapování

SCORM 1.2 má jeden `lesson_status` field:

```typescript
function mapStatus(status: string): string {
  switch (status) {
    case "incomplete": return "incomplete"
    case "completed": return "completed"
    case "passed": return "passed"
    case "failed": return "failed"
    default: return "incomplete"
  }
}
```

## Session time format

SCORM 1.2 formát: `HH:MM:SS.SS`

```typescript
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.00`
}
```

## API discovery

SCORM 1.2 API může být na `window.API` nebo v parent/opener framech:

```typescript
function findAPI(win: Window): SCORM12API | null {
  if (win.API) return win.API
  if (win.parent && win.parent !== win) return findAPI(win.parent)
  if (win.opener) return findAPI(win.opener)
  return null
}
```

## Error handling

- Pokud API není nalezena: `console.warn("[kurikulum] SCORM API not found, falling back to standalone")`
- Fallback na standalone adapter — kurz funguje i bez LMS
- `LMSGetLastError()` pro debugging

## Akceptační kritéria

- Adapter najde SCORM API v window hierarchy
- Všechny CMI hodnoty se správně čtou/zapisují
- Session time je ve správném formátu
- Graceful fallback na standalone když API chybí
- suspend_data roundtrip funguje
