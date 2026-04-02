# Krok 2: CourseState + CourseRuntime

## Cíl

Implementovat jádro runtime — flat state objekt a metody pro navigaci, completion, assessment a lifecycle.

## Soubory

- `packages/core/src/runtime.ts`
- `packages/core/src/types.ts`

## CourseState

```typescript
interface CourseState {
  // Navigation
  currentPage: string
  pages: string[]

  // Completion — flat registr
  completions: Record<string, boolean>

  // Assessment
  score: number | null
  maxScore: number
  passed: boolean | null
  attempts: number

  // Time
  sessionStart: number
  totalTimeMs: number
}
```

## CourseRuntime

```typescript
interface CourseRuntime {
  state: CourseState

  // Navigation
  navigateTo(pageId: string): void
  nextPage(): void
  prevPage(): void

  // Completion
  markComplete(id: string): void
  isComplete(id: string): boolean
  isPageComplete(pageId: string): boolean

  // Assessment
  submitScore(score: number, max: number, passThreshold?: number): void

  // Lifecycle
  suspend(): void   // serializuje state do adapteru
  restore(): void   // deserializuje state z adapteru
}
```

## CourseConfig

```typescript
interface CourseConfig {
  title: string
  pages: string[]
  defaultCompletion?: CompletionStrategy
  passThreshold?: number  // 0-1, default 0.7
}
```

## createCourseRuntime

```typescript
function createCourseRuntime(
  config: CourseConfig,
  adapter: DeliveryAdapter
): CourseRuntime
```

- State je reactive (Preact signals nebo prostý objekt + subscribers)
- Každá mutace state volá `adapter.commit()` (debounced)
- `suspend()` serializuje celý state do `adapter.setSuspendData(JSON.stringify(state))`
- `restore()` deserializuje z `adapter.getSuspendData()`
- `navigateTo` nastaví `currentPage` a volá `adapter.setLocation(pageId)`

## Akceptační kritéria

- Vytvoření runtime s mock adapterem
- Navigace mezi stránkami (next/prev/goTo)
- markComplete/isComplete funguje
- submitScore nastaví score + passed
- suspend/restore roundtrip — state se zachová
- Unit testy na všechny metody
