# Krok 4: Hooky

## Cíl

Implementovat Preact hooky jako thin wrappers nad CourseRuntime. Toto je veřejné API pro autory kurzů.

## Soubory

- `packages/core/src/hooks/useCourse.ts`
- `packages/core/src/hooks/useNavigation.ts`
- `packages/core/src/hooks/useCompletion.ts`
- `packages/core/src/hooks/useAssessment.ts`
- `packages/core/src/hooks/usePage.ts`
- `packages/core/src/hooks/index.ts`

## API

### useCourse

```typescript
function useCourse(): CourseRuntime
```

Vrací celý runtime objekt. Escape hatch pro pokročilé použití.

### useNavigation

```typescript
function useNavigation(): {
  currentPage: string
  next(): void
  prev(): void
  goTo(id: string): void
  canGoNext: boolean
  canGoPrev: boolean
  pageIndex: number
  totalPages: number
}
```

### useCompletion

```typescript
function useCompletion(id: string): {
  isComplete: boolean
  markComplete(): void
}
```

Používá se jak pro celé stránky, tak pro jednotlivé prvky (MCQ, text blok...).

### useAssessment

```typescript
function useAssessment(): {
  score: number | null
  maxScore: number
  passed: boolean | null
  attempts: number
  submit(score: number, max: number): void
}
```

### usePage

```typescript
function usePage(): {
  pageId: string
  completion: CompletionStrategy
}
```

Vrací info o aktuální stránce. Používáno interně v komponentách.

## Implementační detail

- Všechny hooky čtou z CourseRuntime kontextu (viz krok 5)
- Hooky by měly být reaktivní — UI se překreslí při změně state
- Pokud se runtime stane z Preact signals, hooky budou automaticky reaktivní
- Pokud je runtime plain object, hooky budou potřebovat subscribe/forceUpdate pattern

## Akceptační kritéria

- Všechny hooky exportovány z `@kurikulum/core`
- Hooky fungují uvnitř CourseProvider kontextu
- Hooky hází srozumitelnou chybu mimo kontext
- Změna state (navigace, completion) překreslí komponenty
