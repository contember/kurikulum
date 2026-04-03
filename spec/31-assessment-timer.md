# Krok 31: Assessment timer / časový limit

## Cíl

Časový limit na assessment — countdown, auto-submit při vypršení, persistence přes suspend/restore.

## Motivace

Certifikační a compliance testy mají téměř vždy časový limit. Po vypršení se test automaticky odešle. Timer musí přežít page refresh (learner nemůže obejít limit zavřením a otevřením kurzu).

## Změny

### Assessment.Root: timeLimit prop

```typescript
interface AssessmentRootProps {
  // ... stávající ...
  timeLimit?: number       // v sekundách, undefined = bez limitu
  onTimeExpired?: () => void  // callback při vypršení (před auto-submit)
}
```

### Core: Timer logika

- Countdown startuje při prvním zobrazení assessmentu
- Při suspend: uloží remaining time do suspend_data
- Při restore: obnoví countdown se zbývajícím časem
- Při vypršení: auto-submit s aktuálními odpovědmi

### Compound components

```
Assessment.Timer — zobrazuje zbývající čas
```

```typescript
interface TimerProps {
  class?: string
  warningThreshold?: number  // v sekundách — změní styl když zbývá málo času (default 60)
  children?: (remaining: number, isWarning: boolean) => ComponentChildren
}
```

### Hook: useAssessmentTimer

```typescript
interface TimerContext {
  remaining: number        // zbývající sekundy
  total: number            // celkový limit
  isRunning: boolean
  isExpired: boolean
  isWarning: boolean       // pod warningThreshold
  formatted: string        // "04:32"
}
```

### SCORM session_time

Timer přispívá do `cmi.core.session_time` — celkový čas strávený v assessmentu.

## Příklad

```tsx
<Assessment id="cert-exam" passThreshold={0.8} maxAttempts={1} timeLimit={1800}>
  <Assessment.Timer warningThreshold={120} />

  <MCQ id="q1" question="...">...</MCQ>
  <MCQ id="q2" question="...">...</MCQ>

  <Assessment.Submit />
  <Assessment.Feedback />
</Assessment>
```

Custom render:

```tsx
<Assessment.Timer>
  {(remaining, isWarning) => (
    <div class={isWarning ? 'text-red-600 font-bold' : ''}>
      Zbývá: {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
    </div>
  )}
</Assessment.Timer>
```

## Akceptační kritéria

- timeLimit prop na Assessment.Root aktivuje countdown
- Timer přežije suspend/restore (zbývající čas se uloží)
- Auto-submit při vypršení
- Assessment.Timer compound component s warningThreshold
- useAssessmentTimer hook pro custom UI
- Render function pattern pro custom zobrazení
- SCORM session_time reporting
- Template styled timer komponenta
- Unit testy
