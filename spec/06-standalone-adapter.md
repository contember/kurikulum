# Krok 6: Standalone adapter

## Cíl

Adapter pro vývoj bez SCORM — ukládá do localStorage, loguje do console.

## Soubory

- `packages/core/src/adapters/types.ts`
- `packages/core/src/adapters/standalone.ts`
- `packages/core/src/adapters/index.ts`

## DeliveryAdapter interface

```typescript
interface DeliveryAdapter {
  initialize(): Promise<void>

  // State persistence
  getSuspendData(): string | null
  setSuspendData(data: string): void

  // SCORM-mapped values
  setScore(score: number, max: number): void
  setStatus(status: "incomplete" | "completed" | "passed" | "failed"): void
  setLocation(pageId: string): void
  getLocation(): string | null
  setSessionTime(ms: number): void

  // Lifecycle
  commit(): void
  terminate(): void
}
```

## createAdapter factory

```typescript
function createAdapter(type: "standalone" | "scorm-1.2"): DeliveryAdapter
```

## Standalone implementace

- `initialize()` — no-op, resolve okamžitě
- `getSuspendData()` → `localStorage.getItem("kurikulum:suspend")`
- `setSuspendData(data)` → `localStorage.setItem("kurikulum:suspend", data)`
- `setScore/setStatus/setLocation/setSessionTime` → `console.log("[kurikulum]", ...)`
- `getLocation()` → `localStorage.getItem("kurikulum:location")`
- `commit()` — no-op (localStorage je synchronní)
- `terminate()` — `console.log("[kurikulum] terminated")`

## Akceptační kritéria

- Standalone adapter implementuje celý DeliveryAdapter interface
- Data persistují přes page reload (localStorage)
- Console logy pomáhají při debugování
- `createAdapter("standalone")` vrací instanci
